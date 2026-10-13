import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { asistente } from '../constants/asistente';
import { preferencias, type Preferencias } from '../utils/preferencias';
import { api, MAX_CARACTERES_VOZ_NUBE } from './api';

/**
 * Voz de la asistente y dictado de la persona.
 *
 * - Hablar (por defecto): síntesis del propio teléfono (expo-speech). Gratis, sin
 *   red y sin latencia. Se elige la mejor voz FEMENINA en español, con ritmo
 *   pausado y tono suave: tiene que transmitir calma.
 * - Hablar (opcional): voz neuronal en la nube vía `POST /voz/sintetizar` del
 *   backend (Azure AI Speech, voz es-PE-CamilaNeural con prosodia calmada), sólo
 *   si `EXPO_PUBLIC_TTS_NUBE=true`. Ante cualquier error o si tarda
 *   más de 8 s, cae a la voz del teléfono sin que la persona note nada.
 * - Escuchar: el audio se graba en el dispositivo y lo transcribe el backend.
 */

export type RitmoVoz = Preferencias['vozRitmo'];

export interface VozDisponible {
  /** Identificador de expo-speech (lo que se guarda en `preferencias.vozId`). */
  id: string;
  /** Nombre para mostrar ("Paulina", "Voz SFB"…). */
  nombre: string;
  /** Código de idioma tal como lo da el sistema (`es-MX`, `es-us`…). */
  idioma: string;
  /** País legible ("México", "España"…) o el código si no se conoce. */
  pais: string;
  calidad: 'alta' | 'estándar';
  /** `true` femenina · `false` masculina · `null` no se sabe (heurística por nombre). */
  femenina: boolean | null;
  /** Necesita conexión (voces "network" de Google TTS). */
  enLinea: boolean;
}

/* ------------------------------------------------------------ Ajustes */

const IDIOMA = 'es-ES';

/** Los motores TTS cortan los textos largos; se locuta por trozos. */
const MAX_CARACTERES_POR_TRAMO = 180;

/** Respiro entre tramos: sin él la voz encadena oraciones sin aire. */
const PAUSA_ENTRE_TRAMOS_MS = 280;

/**
 * Velocidad por plataforma. En iOS `rate` multiplica la velocidad por defecto de
 * AVSpeechSynthesizer y bajar de 1 se nota mucho más que en Android (donde 1 ya
 * es algo rápido en Google TTS), así que iOS se ajusta menos.
 */
const RATE: Record<RitmoVoz, number> = Platform.select({
  ios: { pausada: 0.93, normal: 1.0 },
  android: { pausada: 0.88, normal: 0.98 },
  default: { pausada: 0.9, normal: 1.0 },
});

/** Tono neutro, apenas cálido. Nada agudo. */
const PITCH = Platform.OS === 'ios' ? 1.02 : 1.0;

/** Motor en la nube: apagado salvo que se active explícitamente. */
const NUBE_ACTIVA = process.env.EXPO_PUBLIC_TTS_NUBE === 'true';
const LIMITE_NUBE_MS = 8000;

export const FRASE_PRUEBA = `Hola, soy ${asistente.nombre}. Estoy aquí para escucharte, sin prisa.`;

/* --------------------------------------------- Género y calidad (heurística) */

/**
 * expo-speech no informa del género de la voz. Se deduce del nombre o del
 * identificador; el mapeo es APROXIMADO y puede fallar con motores poco comunes
 * (Samsung, Huawei…), en cuyo caso queda `null` y se ordena después de las
 * femeninas conocidas.
 *
 * - iOS / macOS / Windows (web): por nombre propio (Paulina, Mónica, Jorge…).
 *   Incluye las voces "novedad" de Apple (Flo, Sandy, Shelley, Grandma = femeninas;
 *   Eddy, Reed, Rocko, Grandpa = masculinas).
 * - Android, Google TTS (`es-us-x-sfb-local`, `es-es-x-eea-network`…), según lo
 *   que se suele observar:
 *     es-US: sfb, esc, esf = femeninas · esd = masculina
 *     es-ES: eea, eec = femeninas · eed, eef = masculinas
 *   Variantes antiguas `…#female_1-local` / `…#male_2-local` y Samsung
 *   `SMTf00` / `SMTm00` se leen por su marca f/m.
 */
const NOMBRES_FEMENINOS = [
  'paulina',
  'monica',
  'marisol',
  'angelica',
  'isabela',
  'soledad',
  'francisca',
  'luciana',
  'esperanza',
  'camila',
  'dalia',
  'elvira',
  'helena',
  'laura',
  'sabina',
  'valeria',
  'ximena',
  'paloma',
  'lupe',
  'penelope',
  'conchita',
  'lucia',
  'mia',
  'sofia',
  'flo',
  'sandy',
  'shelley',
  'grandma',
];

const NOMBRES_MASCULINOS = [
  'jorge',
  'juan',
  'diego',
  'carlos',
  'enrique',
  'miguel',
  'andres',
  'pablo',
  'raul',
  'alvaro',
  'jose',
  'rodrigo',
  'alonso',
  'eddy',
  'reed',
  'rocko',
  'grandpa',
];

const GOOGLE_FEMENINAS = ['sfb', 'esc', 'esf', 'eea', 'eec'];
const GOOGLE_MASCULINAS = ['esd', 'eed', 'eef'];

/** Marcas diacríticas combinables (U+0300–U+036F) que deja `normalize('NFD')`. */
const DIACRITICOS = new RegExp(
  `[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`,
  'g'
);

const sinAcentos = (s: string) => s.normalize('NFD').replace(DIACRITICOS, '').toLowerCase();

/** Código de Google TTS: `es-us-x-sfb-local` → `sfb`. */
const codigoGoogle = (id: string): string | null =>
  /^[a-z]{2,3}-[a-z0-9]{2,3}-x-([a-z]{3})/i.exec(id)?.[1]?.toLowerCase() ?? null;

const contienePalabra = (texto: string, lista: string[]) =>
  lista.some((n) => new RegExp(`(^|[^a-z])${n}([^a-z]|$)`).test(texto));

const deducirFemenina = (v: Speech.Voice): boolean | null => {
  const texto = sinAcentos(`${v.name} ${v.identifier}`);

  if (/#female|smtf\d|(^|[^a-z])female/.test(texto)) return true;
  if (/#male|smtm\d|(^|[^a-z])male/.test(texto)) return false;

  const codigo = codigoGoogle(v.identifier) ?? codigoGoogle(v.name);
  if (codigo && GOOGLE_FEMENINAS.includes(codigo)) return true;
  if (codigo && GOOGLE_MASCULINAS.includes(codigo)) return false;

  if (contienePalabra(texto, NOMBRES_FEMENINOS)) return true;
  if (contienePalabra(texto, NOMBRES_MASCULINOS)) return false;

  // Voces web de Google ("Google español de Estados Unidos") son femeninas.
  if (/^google espanol/.test(sinAcentos(v.name))) return true;
  return null;
};

const PAISES: Record<string, string> = {
  pe: 'Perú',
  mx: 'México',
  us: 'Estados Unidos',
  '419': 'Latinoamérica',
  ar: 'Argentina',
  co: 'Colombia',
  cl: 'Chile',
  bo: 'Bolivia',
  ec: 'Ecuador',
  ve: 'Venezuela',
  uy: 'Uruguay',
  py: 'Paraguay',
  cr: 'Costa Rica',
  pr: 'Puerto Rico',
  es: 'España',
};

const regionDe = (idioma: string) => idioma.replace('_', '-').split('-')[1]?.toLowerCase() ?? '';

const esCalidadAlta = (v: Speech.Voice) =>
  v.quality === Speech.VoiceQuality.Enhanced || /premium|enhanced/i.test(v.identifier);

/** Puntuación para elegir la voz automática: femenina > calidad > acento latino. */
const puntuar = (v: Speech.Voice, femenina: boolean | null): number => {
  let p = femenina === true ? 100 : femenina === null ? 30 : 0;

  if (/premium/i.test(v.identifier)) p += 25;
  else if (esCalidadAlta(v)) p += 20;
  if (/compact/i.test(v.identifier)) p -= 5;
  // Voces robóticas (Eloquence) y de novedad de Apple: sólo si no hay otra cosa.
  if (/eloquence/i.test(v.identifier)) p -= 15;
  if (/speech\.synthesis/i.test(v.identifier)) p -= 30;
  // Las voces "network" fallan sin conexión: preferir la local a igualdad.
  if (/network/i.test(v.identifier)) p -= 2;

  const region = regionDe(v.language);
  if (region === 'pe') p += 12;
  else if (region === 'mx' || region === 'us' || region === '419') p += 10;
  else if (region && region !== 'es') p += 8;
  else if (region === 'es') p += 3;

  return p;
};

const nombreLegible = (v: Speech.Voice): string => {
  const codigo = codigoGoogle(v.name);
  if (codigo) return `Voz ${codigo.toUpperCase()}`;
  // iOS: "Paulina (mejorada)" ya viene bien; se quitan prefijos técnicos si los hay.
  return v.name.replace(/^com\.apple\.[\w.-]+\./, '').trim() || v.identifier;
};

/* ---------------------------------------------------- Catálogo y caché */

let catalogo: Promise<VozDisponible[]> | null = null;
let configuracion: Promise<{ voice?: string; ritmo: RitmoVoz }> | null = null;

const cargarCatalogo = async (): Promise<VozDisponible[]> => {
  const voces = await Speech.getAvailableVoicesAsync();
  const vistos = new Set<string>();

  return voces
    .filter((v) => v.language?.toLowerCase().startsWith('es'))
    .filter((v) => (vistos.has(v.identifier) ? false : (vistos.add(v.identifier), true)))
    .map((v) => {
      const femenina = deducirFemenina(v);
      const region = regionDe(v.language);
      return {
        voz: {
          id: v.identifier,
          nombre: nombreLegible(v),
          idioma: v.language,
          pais: PAISES[region] ?? v.language,
          calidad: esCalidadAlta(v) ? 'alta' : 'estándar',
          femenina,
          enLinea: /network/i.test(v.identifier),
        } satisfies VozDisponible,
        puntos: puntuar(v, femenina),
      };
    })
    .sort((a, b) => b.puntos - a.puntos || a.voz.nombre.localeCompare(b.voz.nombre))
    .map((x) => x.voz);
};

/**
 * Voces en español del teléfono, ordenadas de la más recomendada a la menos
 * (la primera es la que se usa en modo automático).
 */
export const listarVocesEspanol = async (): Promise<VozDisponible[]> => {
  if (!catalogo) {
    catalogo = cargarCatalogo().catch(() => []);
  }
  const lista = await catalogo;
  // Android a veces devuelve [] mientras el motor TTS arranca: reintentar luego.
  if (lista.length === 0) catalogo = null;
  return lista;
};

/** Voz que se usaría en automático (la mejor femenina en español), si hay alguna. */
export const vozRecomendada = async (): Promise<VozDisponible | null> =>
  (await listarVocesEspanol())[0] ?? null;

const resolverConfiguracion = async (): Promise<{ voice?: string; ritmo: RitmoVoz }> => {
  const [prefs, voces] = await Promise.all([preferencias.obtener(), listarVocesEspanol()]);
  // La elegida sólo vale si sigue instalada; si no, vuelve a la automática.
  const elegida = prefs.vozId ? voces.find((v) => v.id === prefs.vozId) : undefined;
  return { voice: (elegida ?? voces[0])?.id, ritmo: prefs.vozRitmo };
};

const obtenerConfiguracion = () => {
  if (!configuracion) {
    configuracion = resolverConfiguracion().catch(() => ({ ritmo: 'pausada' as const }));
  }
  return configuracion;
};

/** Llamar tras cambiar `vozId` / `vozRitmo` (o al volver de instalar voces). */
export const refrescarPreferenciasVoz = (): void => {
  catalogo = null;
  configuracion = null;
};

/* ------------------------------------------------------ Limpieza de texto */

/**
 * Deja el texto en algo pronunciable.
 *
 * El modelo responde con markdown, emojis y a veces enlaces o números de
 * teléfono pegados; leído tal cual suena a "asterisco asterisco" y a ruido.
 */
const prepararParaVoz = (texto: string): string =>
  texto
    // Bloques y marcas de código
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    // Énfasis de markdown
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|\s)_([^_]+)_/g, '$1$2')
    // Encabezados, citas y viñetas al inicio de línea
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*[-*•]\s+/gm, ', ')
    .replace(/^\s*\d+\.\s+/gm, ', ')
    // Enlaces: se lee el texto, no la URL
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, 'el enlace que te compartí')
    // Emojis y símbolos decorativos
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu,
      ''
    )
    // Los teléfonos se leen dígito a dígito para que se entiendan
    .replace(/\b(\d{3})\b/g, (m) => m.split('').join(' '))
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();

/** Parte el texto en tramos que el motor TTS pueda locutar sin cortarse. */
const trocear = (texto: string): string[] => {
  const oraciones = texto.split(/(?<=[.!?…])\s+/);
  const tramos: string[] = [];
  let actual = '';

  for (const oracion of oraciones) {
    if (!oracion.trim()) continue;

    if ((actual + ' ' + oracion).trim().length <= MAX_CARACTERES_POR_TRAMO) {
      actual = (actual + ' ' + oracion).trim();
      continue;
    }

    if (actual) tramos.push(actual);

    if (oracion.length <= MAX_CARACTERES_POR_TRAMO) {
      actual = oracion.trim();
      continue;
    }

    // Oración larguísima: se corta por comas antes de rendirse.
    let resto = oracion.trim();
    while (resto.length > MAX_CARACTERES_POR_TRAMO) {
      const corte = resto.lastIndexOf(',', MAX_CARACTERES_POR_TRAMO);
      const punto = corte > 60 ? corte + 1 : MAX_CARACTERES_POR_TRAMO;
      tramos.push(resto.slice(0, punto).trim());
      resto = resto.slice(punto).trim();
    }
    actual = resto;
  }

  if (actual) tramos.push(actual);
  return tramos;
};

/* ----------------------------------------------------------- Reproducción */

/**
 * Una locución en curso. Cada `hablar`/`probarVoz`/`callar` crea un turno nuevo;
 * los callbacks de turnos viejos se ignoran. `onDone` se llama una sola vez,
 * también al interrumpir (como hacía `onStopped` de expo-speech).
 */
let turno = 0;
let pendiente: { turno: number; onDone?: () => void } | null = null;
let temporizador: ReturnType<typeof setTimeout> | null = null;
let reproductor: AudioPlayer | null = null;

const finalizar = (t: number) => {
  if (!pendiente || pendiente.turno !== t) return;
  const { onDone } = pendiente;
  pendiente = null;
  onDone?.();
};

const soltarReproductor = () => {
  const p = reproductor;
  reproductor = null;
  if (!p) return;
  try {
    p.pause();
    p.remove();
  } catch {
    // Ya liberado.
  }
};

/** Corta todo lo que suena (teléfono y nube) y cierra el turno actual. */
const cortar = async () => {
  const anterior = turno;
  turno += 1;
  if (temporizador) clearTimeout(temporizador);
  temporizador = null;
  soltarReproductor();
  try {
    await Speech.stop();
  } catch {
    // Si no había nada sonando, no hay nada que hacer.
  }
  finalizar(anterior);
};

/** Locuta los tramos uno a uno con la voz del teléfono, con un respiro entre ellos. */
const hablarEnTelefono = (
  t: number,
  tramos: string[],
  voice: string | undefined,
  ritmo: RitmoVoz
) => {
  const decir = (i: number) => {
    if (t !== turno) return;
    if (i >= tramos.length) {
      finalizar(t);
      return;
    }
    const siguiente = () => {
      if (t !== turno) return;
      temporizador = setTimeout(() => decir(i + 1), PAUSA_ENTRE_TRAMOS_MS);
    };
    Speech.speak(tramos[i], {
      language: IDIOMA,
      voice,
      rate: RATE[ritmo],
      pitch: PITCH,
      onDone: siguiente,
      onError: siguiente,
      // `onStopped` llega por `callar()`, que ya cierra el turno.
    });
  };
  decir(0);
};

/**
 * Pide el audio al backend y lo reproduce. Devuelve `false` si no pudo
 * empezar a sonar (error, timeout o audio que no carga) para caer al teléfono.
 */
const hablarEnNube = async (t: number, texto: string, ritmo: RitmoVoz): Promise<boolean> => {
  try {
    const uri = await api.sintetizarVoz(texto, { ritmo, timeoutMs: LIMITE_NUBE_MS });
    if (t !== turno) return true;

    return await new Promise<boolean>((resolve) => {
      let empezo = false;
      const player = createAudioPlayer({ uri });
      reproductor = player;

      const fallar = () => {
        if (empezo) {
          // Falló a mitad: se da por terminada la locución.
          soltarReproductor();
          finalizar(t);
          return;
        }
        empezo = true;
        if (reproductor === player) soltarReproductor();
        resolve(false);
      };

      const limite = setTimeout(() => {
        if (!empezo) fallar();
      }, LIMITE_NUBE_MS);

      player.addListener('playbackStatusUpdate', (estado) => {
        if (t !== turno) {
          clearTimeout(limite);
          return;
        }
        if (estado.error) {
          clearTimeout(limite);
          fallar();
          return;
        }
        if (!empezo && (estado.playing || estado.isLoaded)) {
          empezo = true;
          clearTimeout(limite);
          resolve(true);
        }
        if (estado.didJustFinish) {
          soltarReproductor();
          finalizar(t);
        }
      });

      player.play();
    });
  } catch {
    return false;
  }
};

/* ------------------------------------------------------------- API pública */

/** Reproduce la frase de prueba con una voz concreta (`null` = automática). */
export const probarVoz = async (
  id: string | null,
  ritmo: RitmoVoz,
  onDone?: () => void
): Promise<void> => {
  await cortar();
  const t = turno;
  pendiente = { turno: t, onDone };
  const voice = id ?? (await vozRecomendada())?.id;
  if (t !== turno) return;
  hablarEnTelefono(t, [FRASE_PRUEBA], voice, ritmo);
};

export const voz = {
  /**
   * Lee un texto en voz alta con la voz elegida (o la mejor femenina en
   * español del teléfono). `onDone` se llama una sola vez: al terminar, al
   * fallar o al interrumpirse con `callar()`.
   */
  async hablar(texto: string, onDone?: () => void): Promise<void> {
    await cortar();
    const t = turno;

    const limpio = prepararParaVoz(texto);
    if (!limpio) {
      onDone?.();
      return;
    }
    pendiente = { turno: t, onDone };

    const { voice, ritmo } = await obtenerConfiguracion();
    if (t !== turno) return;

    // Textos muy largos van directo al teléfono: el backend los rechazaría (413).
    if (NUBE_ACTIVA && limpio.length <= MAX_CARACTERES_VOZ_NUBE) {
      const sono = await hablarEnNube(t, limpio, ritmo);
      if (sono || t !== turno) return;
    }

    hablarEnTelefono(t, trocear(limpio), voice, ritmo);
  },

  /** Detiene la voz (teléfono y nube). */
  async callar(): Promise<void> {
    await cortar();
  },

  probarVoz,
  listarVocesEspanol,
  refrescarPreferenciasVoz,

  /** Sube la grabación al backend y devuelve el texto dictado. */
  async transcribir(uri: string): Promise<string> {
    return api.transcribirAudio(uri);
  },
};
