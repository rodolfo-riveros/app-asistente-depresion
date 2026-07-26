import { useCallback, useRef, useState } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { voz } from '../services/voz';

/**
 * Grabación de voz del usuario y su transcripción en el backend.
 *
 * Dos detalles que marcan la diferencia en cuánto "te entiende":
 *
 * 1. `prepareToRecordAsync()` tarda unas décimas. Si se llama justo al pulsar,
 *    se comen las primeras sílabas. Por eso se puede precalentar con `preparar()`
 *    al abrir el modo voz, y `iniciar()` sólo arranca la captura.
 * 2. Se descartan las grabaciones de menos de `MIN_MS`: son pulsaciones sin
 *    querer y el transcriptor devuelve texto inventado o vacío.
 *
 * El modo de audio se cambia en cada tramo a propósito: en iOS, dejar
 * `allowsRecording` activo baja el volumen de reproducción, así que al terminar
 * de grabar se vuelve a modo reproducción para que se oiga bien al asistente.
 */

const MIN_MS = 700;

export const useDictado = () => {
  const grabadora = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [grabando, setGrabando] = useState(false);
  const [transcribiendo, setTranscribiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preparadaRef = useRef(false);
  const inicioRef = useRef(0);

  const asegurarPermiso = useCallback(async (): Promise<boolean> => {
    const permiso = await requestRecordingPermissionsAsync();
    if (!permiso.granted) {
      setError('Necesito permiso para usar el micrófono.');
      return false;
    }
    return true;
  }, []);

  /** Deja el micrófono listo para que `iniciar()` sea instantáneo. */
  const preparar = useCallback(async (): Promise<void> => {
    if (preparadaRef.current) return;
    if (!(await asegurarPermiso())) return;

    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await grabadora.prepareToRecordAsync();
      preparadaRef.current = true;
    } catch (e) {
      console.error('Error preparando el micrófono:', e);
    }
  }, [asegurarPermiso, grabadora]);

  const iniciar = useCallback(async (): Promise<boolean> => {
    setError(null);
    if (!(await asegurarPermiso())) return false;

    try {
      if (!preparadaRef.current) {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await grabadora.prepareToRecordAsync();
      }
      grabadora.record();
      preparadaRef.current = false; // hay que volver a preparar tras cada toma
      inicioRef.current = Date.now();
      setGrabando(true);
      return true;
    } catch (e) {
      console.error('Error iniciando la grabación:', e);
      setError('No pude activar el micrófono.');
      return false;
    }
  }, [asegurarPermiso, grabadora]);

  /** Corta la grabación, la sube y devuelve el texto dictado (o null). */
  const detenerYTranscribir = useCallback(async (): Promise<string | null> => {
    const duracion = Date.now() - inicioRef.current;
    setGrabando(false);

    try {
      await grabadora.stop();
    } catch (e) {
      console.error('Error deteniendo la grabación:', e);
    }

    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

    const uri = grabadora.uri;
    if (!uri) {
      setError('No se guardó el audio.');
      return null;
    }

    if (duracion < MIN_MS) {
      setError('Fue muy corto. Mantén el modo voz y habla con calma.');
      return null;
    }

    setTranscribiendo(true);
    try {
      const texto = await voz.transcribir(uri);
      if (!texto.trim()) {
        setError('No te escuché bien. ¿Lo intentamos de nuevo?');
        return null;
      }
      setError(null);
      return texto;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo transcribir el audio.');
      return null;
    } finally {
      setTranscribiendo(false);
    }
  }, [grabadora]);

  const cancelar = useCallback(async () => {
    preparadaRef.current = false;
    if (grabando) {
      try {
        await grabadora.stop();
      } catch {
        // ya estaba detenida
      }
      setGrabando(false);
    }
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
  }, [grabadora, grabando]);

  return {
    grabando,
    transcribiendo,
    error,
    preparar,
    iniciar,
    detenerYTranscribir,
    cancelar,
  };
};
