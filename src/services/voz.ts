import * as Speech from 'expo-speech';
import { api } from './api';

/**
 * Voz del asistente y dictado del usuario.
 *
 * Reparto de responsabilidades (estilo ChatGPT, adaptado a móvil):
 * - Hablar: síntesis del propio teléfono (expo-speech). Es gratis, no consume
 *   cuota de ninguna API, no añade latencia de red y funciona sin conexión.
 * - Escuchar: el audio se graba en el dispositivo y lo transcribe el backend,
 *   que es quien tiene la clave del servicio de reconocimiento.
 */

const IDIOMA = 'es-ES';

/** Los motores TTS cortan los textos largos; se locuta por trozos. */
const MAX_CARACTERES_POR_TRAMO = 180;

const OPCIONES_BASE: Speech.SpeechOptions = {
  language: IDIOMA,
  // Algo más lento que el habla neutra: acompaña mejor en este contexto.
  rate: 0.94,
  pitch: 1.02,
};

/** Voz en español elegida una sola vez y reutilizada. */
let vozPreferida: string | undefined;
let vozResuelta = false;

const elegirVoz = async (): Promise<string | undefined> => {
  if (vozResuelta) return vozPreferida;
  vozResuelta = true;

  try {
    const voces = await Speech.getAvailableVoicesAsync();
    const enEspanol = voces.filter((v) => v.language?.toLowerCase().startsWith('es'));
    if (enEspanol.length === 0) return undefined;

    // Preferencias: calidad alta > variante latinoamericana > la primera que haya.
    const mejor =
      enEspanol.find((v) => v.quality === Speech.VoiceQuality.Enhanced) ??
      enEspanol.find((v) => /es-(MX|US|419|AR|CO|PE)/i.test(v.language)) ??
      enEspanol[0];

    vozPreferida = mejor?.identifier;
  } catch {
    vozPreferida = undefined;
  }

  return vozPreferida;
};

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

export const voz = {
  /**
   * Lee un texto en voz alta, por tramos y con la mejor voz española del
   * dispositivo. `onDone` se llama una sola vez, al terminar el último tramo.
   */
  async hablar(texto: string, onDone?: () => void): Promise<void> {
    const limpio = prepararParaVoz(texto);
    if (!limpio) {
      onDone?.();
      return;
    }

    await Speech.stop();

    const voice = await elegirVoz();
    const tramos = trocear(limpio);

    tramos.forEach((tramo, i) => {
      const esUltimo = i === tramos.length - 1;
      Speech.speak(tramo, {
        ...OPCIONES_BASE,
        voice,
        onDone: esUltimo ? onDone : undefined,
        onStopped: esUltimo ? onDone : undefined,
        onError: esUltimo ? onDone : undefined,
      });
    });
  },

  async callar(): Promise<void> {
    try {
      await Speech.stop();
    } catch {
      // Si no había nada sonando, no hay nada que hacer.
    }
  },

  /** Sube la grabación al backend y devuelve el texto dictado. */
  async transcribir(uri: string): Promise<string> {
    return api.transcribirAudio(uri);
  },
};
