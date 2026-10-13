import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';
import { ChatMessageRequest, ChatMessageResponse, MensajeGuardado } from '../types/api';
import { AuthResponse, RegisterPayload, User } from '../types/auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10);

/**
 * Render (plan gratis) duerme el servicio tras ~15 min sin tráfico y la primera
 * petición tarda ~50 s en contestar. Mientras no haya una respuesta reciente se
 * amplía el timeout a esto, para no dar por caída una API que sólo está arrancando.
 */
const TIMEOUT_ARRANQUE = 75000;
/** Sin respuestas en este tiempo, el servidor puede haberse dormido otra vez. */
const SERVIDOR_DORMIDO_TRAS_MS = 10 * 60 * 1000;
/** Si una petición tarda más que esto con el servidor "frío", se avisa a la UI. */
const AVISO_LENTO_MS = 4000;
/** El chat espera al modelo de IA (varias herramientas por turno): necesita margen. */
const TIMEOUT_CHAT = Math.max(API_TIMEOUT, 60000);
/** Máximo de caracteres que acepta `POST /voz/sintetizar` (413 si se supera). */
export const MAX_CARACTERES_VOZ_NUBE = 1500;

declare module 'axios' {
  interface AxiosRequestConfig {
    /** No ampliar el timeout aunque el servidor esté frío (p. ej. la voz, que tiene su propio límite). */
    sinAmpliarTimeout?: boolean;
    /** Ya se reintentó tras renovar el token: no volver a intentarlo. */
    reintentoTrasRenovar?: boolean;
  }
}

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ---------------------------------------------- Servidor despertando (UI) */

let ultimaRespuesta = 0;
let despertando = false;
const oyentesDespertando = new Set<(despertando: boolean) => void>();
const avisosLentos = new WeakMap<object, ReturnType<typeof setTimeout>>();

const servidorCaliente = () => Date.now() - ultimaRespuesta < SERVIDOR_DORMIDO_TRAS_MS;

const fijarDespertando = (valor: boolean) => {
  if (despertando === valor) return;
  despertando = valor;
  oyentesDespertando.forEach((fn) => fn(valor));
};

/**
 * Estado "el servidor está arrancando": `true` cuando una petición con el
 * servidor frío lleva más de 4 s sin respuesta; vuelve a `false` con la primera
 * respuesta (o si la petición falla). Lo expone `AuthContext` como
 * `servidorDespertando` para que las pantallas muestren `MENSAJE_DESPERTANDO`.
 */
export const estadoServidor = {
  despertando: () => despertando,
  suscribir(fn: (despertando: boolean) => void): () => void {
    oyentesDespertando.add(fn);
    return () => {
      oyentesDespertando.delete(fn);
    };
  },
};

/** Texto para la persona (sin hablar de servidores). */
export const MENSAJE_DESPERTANDO =
  'Conectando… la primera vez puede tardar hasta un minuto. Gracias por esperar.';

const terminarSeguimiento = (config: object | undefined, huboRespuesta: boolean) => {
  if (config) {
    const aviso = avisosLentos.get(config);
    if (aviso) clearTimeout(aviso);
    avisosLentos.delete(config);
  }
  if (huboRespuesta) ultimaRespuesta = Date.now();
  fijarDespertando(false);
};

// Token de Supabase emitido por el backend + timeout ampliado si el servidor está frío.
client.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!servidorCaliente() && !config.sinAmpliarTimeout) {
    config.timeout = Math.max(config.timeout ?? API_TIMEOUT, TIMEOUT_ARRANQUE);
    avisosLentos.set(
      config,
      setTimeout(() => {
        if (!servidorCaliente()) fijarDespertando(true);
      }, AVISO_LENTO_MS)
    );
  }
  return config;
});

client.interceptors.response.use(
  (response) => {
    terminarSeguimiento(response.config, true);
    return response;
  },
  (error: AxiosError) => {
    terminarSeguimiento(error.config, Boolean(error.response));
    return Promise.reject(error);
  }
);

/* ------------------------------------------------ Renovación del token */

/**
 * Se invoca cuando el backend responde 401 y no se pudo renovar el token
 * (refresh caducado o revocado). `AuthProvider` lo usa para cerrar la sesión local.
 */
let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

/** En estas rutas un 401 es "credenciales malas", no "sesión caducada". */
const esRutaDeAcceso = (url?: string) =>
  !!url && ['/auth/login', '/auth/register', '/auth/refresh'].some((r) => url.startsWith(r));

let renovacionEnCurso: Promise<string | null> | null = null;

/**
 * Canjea el refresh_token por un access_token nuevo (`POST /auth/refresh`).
 * El access_token de Supabase dura 1 h: sin esto la persona volvería al login
 * a mitad de una conversación. Una sola renovación a la vez.
 */
const renovarToken = (): Promise<string | null> => {
  renovacionEnCurso ??= (async () => {
    const refresh = await storage.getRefreshToken();
    if (!refresh) return null;
    try {
      const { data } = await axios.post<AuthResponse>(
        `${API_BASE_URL}/auth/refresh`,
        { refresh_token: refresh },
        { timeout: TIMEOUT_ARRANQUE }
      );
      if (!data?.token) return null;
      await storage.setToken(data.token);
      if (data.refresh_token) await storage.setRefreshToken(data.refresh_token);
      if (data.user) await storage.setUser(aUsuario(data.user));
      return data.token;
    } catch {
      return null;
    }
  })().finally(() => {
    renovacionEnCurso = null;
  });
  return renovacionEnCurso;
};

client.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as InternalAxiosRequestConfig | undefined;
  if (
    error.response?.status === 401 &&
    config &&
    !config.reintentoTrasRenovar &&
    !esRutaDeAcceso(config.url)
  ) {
    const nuevo = await renovarToken();
    if (nuevo) {
      config.reintentoTrasRenovar = true;
      return client(config);
    }
  }
  return Promise.reject(error);
});

/* ------------------------------------------------------------- Errores */

/** Error ya listo para mostrar, con lo necesario para decidir si reintentar. */
export class ErrorApi extends Error {
  constructor(
    mensaje: string,
    readonly status?: number,
    /** No llegó respuesta (sin red, servidor caído o timeout). */
    readonly sinRespuesta = false,
    readonly timeout = false
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

interface ErrorValidacion {
  msg?: string;
  type?: string;
  loc?: (string | number)[];
  ctx?: { min_length?: number; max_length?: number };
}

const CAMPOS: Record<string, string> = {
  email: 'el correo',
  password: 'la contraseña',
  nombre: 'el nombre',
  mensaje: 'el mensaje',
  texto: 'el texto',
  edad: 'la edad',
  titulo: 'el título',
  nota: 'la nota',
  bio: 'la descripción',
  ciudad: 'la ciudad',
  ocupacion: 'la ocupación',
};

/** FastAPI/Pydantic responden 422 en inglés; se traduce lo habitual. */
const mensajeDeValidacion = (e: ErrorValidacion): string => {
  const msg = e.msg ?? '';
  // Validadores propios del backend: "Value error, El correo … no es válido."
  if (msg.startsWith('Value error, ')) return msg.slice('Value error, '.length);

  const campo = CAMPOS[String(e.loc?.[e.loc.length - 1])] ?? 'un dato';
  const Campo = campo.charAt(0).toUpperCase() + campo.slice(1);
  switch (e.type) {
    case 'missing':
      return `Falta ${campo}.`;
    case 'string_too_short':
      return e.ctx?.min_length && e.ctx.min_length > 1
        ? `${Campo} debe tener al menos ${e.ctx.min_length} caracteres.`
        : `Completa ${campo}.`;
    case 'string_too_long':
      return `${Campo} admite como máximo ${e.ctx?.max_length ?? 'pocos'} caracteres.`;
    default:
      return `Revisa ${campo}: no es válido.`;
  }
};

/**
 * Convierte cualquier fallo de axios en un `ErrorApi` con mensaje mostrable.
 * FastAPI manda el motivo en `detail` (string, o lista en los 422); si no hubo
 * respuesta, es problema de red.
 */
const normalizarError = (error: unknown, fallback: string): ErrorApi => {
  if (error instanceof ErrorApi) return error;
  const axiosError = error as AxiosError<{ detail?: string | ErrorValidacion[] }>;

  if (axiosError?.response) {
    const { status } = axiosError.response;
    if (status === 401 && onUnauthorized && !esRutaDeAcceso(axiosError.config?.url)) {
      onUnauthorized();
    }

    const detail = axiosError.response.data?.detail;
    if (typeof detail === 'string' && detail) {
      return new ErrorApi(detail, status);
    }
    if (Array.isArray(detail) && detail[0]) {
      return new ErrorApi(mensajeDeValidacion(detail[0]), status);
    }
    return new ErrorApi(fallback, status);
  }

  if (axiosError?.request) {
    const esTimeout = axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT';
    // Mensaje para la persona, no para el desarrollador: sin hablar de Render ni de servidores dormidos.
    return new ErrorApi(
      esTimeout
        ? 'La conexión está tardando más de lo normal. Inténtalo de nuevo en un momento.'
        : 'No hay conexión en este momento. Revisa tu internet e inténtalo de nuevo.',
      undefined,
      true,
      esTimeout
    );
  }

  return new ErrorApi(error instanceof Error && error.message ? error.message : fallback);
};

/**
 * Reintenta una llamada idempotente si falló sin llegar al servidor (red caída
 * un instante). Los timeouts NO se reintentan: el servidor ya esperó 75 s y un
 * segundo intento sólo duplicaría la espera.
 */
async function conReintento<T>(fn: () => Promise<T>, reintentos = 2, esperaMs = 3000): Promise<T> {
  let ultimoError: unknown;
  for (let i = 0; i < reintentos; i++) {
    try {
      return await fn();
    } catch (err) {
      ultimoError = err;
      const esRecuperable = err instanceof ErrorApi && err.sinRespuesta && !err.timeout;
      if (!esRecuperable) throw err;
      if (i < reintentos - 1) await new Promise((r) => setTimeout(r, esperaMs));
    }
  }
  throw ultimoError;
}

/** El backend manda `email: null` si Supabase no lo tiene; la app usa string. */
const aUsuario = (u: { id: string; nombre?: string | null; email?: string | null }): User => ({
  id: u.id,
  nombre: u.nombre || (u.email ?? '').split('@')[0] || 'Tú',
  email: u.email ?? '',
});

const normalizarAuth = (data: AuthResponse): AuthResponse => ({
  ...data,
  user: aUsuario(data.user),
});

export const api = {
  /**
   * Llamada genérica con el mismo manejo de errores que el resto del cliente.
   * Evita repetir try/catch en cada servicio nuevo.
   */
  async request<T>(
    metodo: 'get' | 'post' | 'put' | 'patch' | 'delete',
    ruta: string,
    datos?: unknown,
    mensajeError = 'La operación no se pudo completar.'
  ): Promise<T> {
    try {
      const response =
        metodo === 'get'
          ? await client.get<T>(ruta, datos as object)
          : metodo === 'delete'
            ? await client.delete<T>(ruta)
            : await client[metodo]<T>(ruta, datos);
      return response.data;
    } catch (error) {
      throw normalizarError(error, mensajeError);
    }
  },

  /** Subida multipart (imágenes, audio) sin fijar Content-Type a mano. */
  async subirMultipart<T>(ruta: string, form: FormData, mensajeError: string): Promise<T> {
    try {
      const response = await client.post<T>(ruta, form, {
        headers: { 'Content-Type': undefined as unknown as string },
        timeout: 120000,
      });
      return response.data;
    } catch (error) {
      throw normalizarError(error, mensajeError);
    }
  },

  /**
   * Despierta el servidor en segundo plano (`GET /salud`, sin credenciales).
   * Se llama al abrir la app: mientras la persona escribe su correo, Render ya
   * está arrancando y el login no se come los ~50 s de arranque en frío.
   */
  despertarServidor(): void {
    if (servidorCaliente()) return;
    client.get('/salud').catch(() => {});
  },

  // --- Auth (Supabase Auth vía backend) ---
  async login(email: string, password: string): Promise<AuthResponse> {
    return conReintento(async () => {
      try {
        const response = await client.post<AuthResponse>('/auth/login', { email, password });
        return normalizarAuth(response.data);
      } catch (error) {
        throw normalizarError(error, 'No se pudo iniciar sesión. Inténtalo de nuevo.');
      }
    });
  },

  /**
   * Sin reintento automático: si la primera petición llegó al servidor, la
   * segunda respondería "ya existe una cuenta con ese correo".
   */
  async register(data: RegisterPayload): Promise<AuthResponse> {
    try {
      const response = await client.post<AuthResponse & { detail?: string }>(
        '/auth/register',
        data
      );
      // 202: Supabase exige confirmar el correo y no hay sesión todavía.
      if (response.status === 202 || !response.data?.token) {
        throw new ErrorApi(
          response.data?.detail ||
            'Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.',
          response.status
        );
      }
      return normalizarAuth(response.data);
    } catch (error) {
      throw normalizarError(error, 'No se pudo completar el registro. Inténtalo de nuevo.');
    }
  },

  /**
   * Usuario dueño del token guardado (`GET /auth/me`). Si el token caducó y no
   * se puede renovar, responde 401 y el `onUnauthorized` cierra la sesión.
   */
  async me(): Promise<User> {
    try {
      const response = await client.get<User>('/auth/me');
      return aUsuario(response.data);
    } catch (error) {
      throw normalizarError(error, 'No se pudo comprobar tu sesión.');
    }
  },

  // --- Chat ---
  /** Sin reintento: un segundo intento podría duplicar el mensaje en el hilo. */
  async sendMessage(payload: ChatMessageRequest): Promise<ChatMessageResponse> {
    try {
      const response = await client.post<ChatMessageResponse>('/chat/mensaje', payload, {
        timeout: TIMEOUT_CHAT,
      });
      return response.data;
    } catch (error) {
      throw normalizarError(error, 'No se pudo enviar tu mensaje. Inténtalo de nuevo.');
    }
  },

  // --- Continuidad de conversaciones ---
  /**
   * Hilo completo del usuario, en orden cronológico.
   * El backend mantiene UNA sola conversación por persona (como mensajería),
   * así que esto es todo el historial, no una "sesión" suelta.
   */
  async getHistorial(limite = 200): Promise<MensajeGuardado[]> {
    return conReintento(async () => {
      try {
        const response = await client.get<MensajeGuardado[]>('/chat/historial', {
          params: { limite },
        });
        return response.data;
      } catch (error) {
        throw normalizarError(error, 'No se pudo cargar tu conversación.');
      }
    });
  },

  // --- Voz ---
  /**
   * Sube el audio grabado y devuelve la transcripción (`POST /voz/transcribir`,
   * campo multipart `audio`). En nativo FormData acepta `{uri, name, type}`
   * (expo-audio graba m4a en iOS y Android); en web hay que convertir el blob
   * URI a Blob y la extensión sale de su tipo (webm en Chrome, mp4 en Safari).
   */
  async transcribirAudio(uri: string): Promise<string> {
    const form = new FormData();

    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      const extension = /mp4|m4a|aac/.test(blob.type)
        ? 'm4a'
        : /ogg/.test(blob.type)
          ? 'ogg'
          : 'webm';
      form.append('audio', blob, `audio.${extension}`);
    } else {
      form.append('audio', {
        uri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      } as unknown as Blob);
    }

    try {
      // Sin Content-Type explícito: axios calcula el boundary del multipart.
      const response = await client.post<{ texto: string }>('/voz/transcribir', form, {
        headers: { 'Content-Type': undefined as unknown as string },
        timeout: 120000,
      });
      return response.data.texto;
    } catch (error) {
      throw normalizarError(error, 'No se pudo transcribir el audio.');
    }
  },

  /**
   * Voz neuronal en la nube (opcional, tras `EXPO_PUBLIC_TTS_NUBE`).
   *
   * Contrato (implementado en el backend con Azure AI Speech):
   *   POST /voz/sintetizar   (Authorization: Bearer <token>)
   *   Body JSON: { texto: string (≤ 1500), voz?: 'es-XX-…Neural', ritmo?: 'pausada' | 'normal' }
   *   200 → cuerpo binario `audio/mpeg` (MP3 mono 24 kHz / 48 kbps).
   *   413 texto largo · 422 voz/ritmo inválidos · 503 sin Azure configurado ·
   *   502/504 fallo de Azure → JSON { detail }.
   *
   * Devuelve un data URI (`data:audio/mpeg;base64,…`) listo para `createAudioPlayer`,
   * así no hace falta escribir archivos temporales. Se usa con un límite corto: si
   * tarda, quien llama vuelve a la voz del teléfono.
   */
  async sintetizarVoz(
    texto: string,
    opciones: { voz?: string; ritmo?: 'pausada' | 'normal'; timeoutMs?: number } = {}
  ): Promise<string> {
    if (texto.length > MAX_CARACTERES_VOZ_NUBE) {
      throw new ErrorApi('Texto demasiado largo para la voz en la nube.', 413);
    }
    try {
      const response = await client.post<ArrayBuffer>(
        '/voz/sintetizar',
        { texto, voz: opciones.voz, ritmo: opciones.ritmo },
        {
          responseType: 'arraybuffer',
          headers: { Accept: 'audio/mpeg' },
          timeout: opciones.timeoutMs ?? 8000,
          sinAmpliarTimeout: true,
        }
      );
      const bytes = new Uint8Array(response.data);
      if (bytes.length === 0) throw new ErrorApi('Audio vacío.');
      return `data:audio/mpeg;base64,${aBase64(bytes)}`;
    } catch (error) {
      throw normalizarError(error, 'No se pudo generar la voz.');
    }
  },
};

const ALFABETO_BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Base64 sin depender de `btoa`/`Buffer` (no están garantizados en todos los motores JS). */
const aBase64 = (bytes: Uint8Array): string => {
  const partes: string[] = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    partes.push(
      ALFABETO_BASE64[(n >> 18) & 63] +
        ALFABETO_BASE64[(n >> 12) & 63] +
        (i + 1 < bytes.length ? ALFABETO_BASE64[(n >> 6) & 63] : '=') +
        (i + 2 < bytes.length ? ALFABETO_BASE64[n & 63] : '=')
    );
  }
  return partes.join('');
};
