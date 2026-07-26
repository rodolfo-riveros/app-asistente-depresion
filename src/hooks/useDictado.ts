import { useCallback, useState } from 'react';
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
 * El modo de audio se cambia en cada tramo a propósito: en iOS, dejar
 * `allowsRecording` activo baja el volumen de reproducción, así que al terminar
 * de grabar se vuelve a modo reproducción para que se oiga bien la voz del
 * asistente.
 */
export const useDictado = () => {
  const grabadora = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [grabando, setGrabando] = useState(false);
  const [transcribiendo, setTranscribiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iniciar = useCallback(async (): Promise<boolean> => {
    setError(null);

    const permiso = await requestRecordingPermissionsAsync();
    if (!permiso.granted) {
      setError('Necesito permiso para usar el micrófono.');
      return false;
    }

    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await grabadora.prepareToRecordAsync();
      grabadora.record();
      setGrabando(true);
      return true;
    } catch (e) {
      console.error('Error iniciando la grabación:', e);
      setError('No pude activar el micrófono.');
      return false;
    }
  }, [grabadora]);

  /** Corta la grabación, la sube y devuelve el texto dictado (o null). */
  const detenerYTranscribir = useCallback(async (): Promise<string | null> => {
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

    setTranscribiendo(true);
    try {
      const texto = await voz.transcribir(uri);
      if (!texto.trim()) {
        setError('No te escuché. ¿Lo intentamos de nuevo?');
        return null;
      }
      return texto;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo transcribir el audio.');
      return null;
    } finally {
      setTranscribiendo(false);
    }
  }, [grabadora]);

  const cancelar = useCallback(async () => {
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

  return { grabando, transcribiendo, error, iniciar, detenerYTranscribir, cancelar };
};
