import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';
import { ChatMessageRequest, ChatMessageResponse, MensajeGuardado } from '../types/api';
import { AuthResponse, RegisterPayload } from '../types/auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '120000', 10);

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach the Supabase access token issued by the backend
client.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Se invoca cuando el backend responde 401 (token vencido o revocado en
 * Supabase). `AuthProvider` lo usa para cerrar la sesión local.
 */
let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

/**
 * Convierte cualquier fallo de axios en un Error con mensaje mostrable.
 * FastAPI manda el motivo en `detail`; si no hubo respuesta, es problema de red.
 */
const normalizarError = (error: unknown, fallback: string): Error => {
  const axiosError = error as AxiosError<{ detail?: string | { msg?: string }[] }>;

  if (axiosError?.response) {
    if (axiosError.response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }

    const detail = axiosError.response.data?.detail;
    if (typeof detail === 'string' && detail) {
      return new Error(detail);
    }
    if (Array.isArray(detail) && detail[0]?.msg) {
      return new Error(detail[0].msg);
    }
    return new Error(fallback);
  }

  if (axiosError?.request) {
    const esTimeout = axiosError.code === 'ECONNABORTED';
    const base = esTimeout
      ? `El servidor no respondió a tiempo.`
      : `No se pudo conectar con el servidor.`;
    const sugerencia =
      'Si es la primera solicitud, el servidor puede estar despertando (Render). ' +
      'Espera unos segundos e inténtalo de nuevo.';
    return new Error(`${base}\n\n${sugerencia}`);
  }

  return new Error(fallback);
};

/** Reintenta una llamada si falla por timeout o conexión (Render cold start). */
async function conReintento<T>(fn: () => Promise<T>, reintentos = 2, esperaMs = 5000): Promise<T> {
  let ultimoError: unknown;
  for (let i = 0; i < reintentos; i++) {
    try {
      return await fn();
    } catch (err) {
      ultimoError = err;
      const esRecuperable =
        err instanceof Error &&
        (err.message.includes('no respondió') || err.message.includes('conectar'));
      if (!esRecuperable) throw err;
      if (i < reintentos - 1) await new Promise((r) => setTimeout(r, esperaMs));
    }
  }
  throw ultimoError;
}

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

  // --- Auth (Supabase Auth vía backend) ---
  async login(email: string, password: string): Promise<AuthResponse> {
    return conReintento(async () => {
      try {
        const response = await client.post<AuthResponse>('/auth/login', { email, password });
        return response.data;
      } catch (error) {
        throw normalizarError(error, 'No se pudo iniciar sesión. Inténtalo de nuevo.');
      }
    });
  },

  async register(data: RegisterPayload): Promise<AuthResponse> {
    return conReintento(async () => {
      try {
        const response = await client.post<AuthResponse>('/auth/register', data);
        return response.data;
      } catch (error) {
        throw normalizarError(error, 'No se pudo completar el registro. Inténtalo de nuevo.');
      }
    });
  },

  // --- Chat ---
  async sendMessage(payload: ChatMessageRequest): Promise<ChatMessageResponse> {
    return conReintento(async () => {
      try {
        const response = await client.post<ChatMessageResponse>('/chat/mensaje', payload);
        return response.data;
      } catch (error) {
        throw normalizarError(error, 'No se pudo enviar tu mensaje. Inténtalo de nuevo.');
      }
    });
  },

  // --- Continuidad de conversaciones ---
  /**
   * Hilo completo del usuario, en orden cronológico.
   * El backend mantiene UNA sola conversación por persona (como mensajería),
   * así que esto es todo el historial, no una "sesión" suelta.
   */
  async getHistorial(limite = 200): Promise<MensajeGuardado[]> {
    try {
      const response = await client.get<MensajeGuardado[]>('/chat/historial', {
        params: { limite },
      });
      return response.data;
    } catch (error) {
      throw normalizarError(error, 'No se pudo cargar tu conversación.');
    }
  },

  // --- Voz ---
  /**
   * Sube el audio grabado y devuelve la transcripción.
   * En nativo FormData acepta `{uri, name, type}`; en web hay que convertir el
   * blob URI a Blob antes de adjuntarlo.
   */
  async transcribirAudio(uri: string): Promise<string> {
    const form = new FormData();

    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      form.append('audio', blob, 'audio.webm');
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
};
