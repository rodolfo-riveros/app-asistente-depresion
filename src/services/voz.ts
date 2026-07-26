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

const OPCIONES_VOZ: Speech.SpeechOptions = {
  language: 'es-ES',
  // Ligeramente más lento que el habla neutra: acompaña mejor en este contexto.
  rate: 0.96,
  pitch: 1.0,
};

export const voz = {
  /** Lee un texto en voz alta. Corta cualquier locución anterior. */
  async hablar(texto: string, onDone?: () => void): Promise<void> {
    const limpio = texto.trim();
    if (!limpio) return;

    await Speech.stop();
    Speech.speak(limpio, {
      ...OPCIONES_VOZ,
      onDone,
      onStopped: onDone,
      onError: onDone,
    });
  },

  async callar(): Promise<void> {
    try {
      await Speech.stop();
    } catch {
      // Si no había nada sonando, no hay nada que hacer.
    }
  },

  async estaHablando(): Promise<boolean> {
    return Speech.isSpeakingAsync();
  },

  /** Sube la grabación al backend y devuelve el texto dictado. */
  async transcribir(uri: string): Promise<string> {
    return api.transcribirAudio(uri);
  },
};
