import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Preferencias locales del dispositivo (interruptores de Perfil y Crear cuenta,
 * persona de confianza). No se envían al backend.
 */

const KEY = '@preferencias';

export interface PersonaConfianza {
  nombre: string;
  telefono: string;
}

export interface Preferencias {
  /** "Recordatorio diario": la asistente pregunta cómo estás cada noche. */
  recordatorioDiario: boolean;
  /** Hora del recordatorio, `HH:mm`. */
  horaRecordatorio: string;
  /** "Notificaciones discretas": sin texto en la pantalla bloqueada. */
  notificacionesDiscretas: boolean;
  /** Contacto al que avisar con un toque. */
  personaConfianza: PersonaConfianza | null;
  /**
   * Voz de la asistente elegida por la persona (identificador de expo-speech).
   * `null` = la app elige la mejor voz femenina en español del teléfono.
   */
  vozId: string | null;
  /** Velocidad de lectura: 'pausada' (por defecto, más calmada) o 'normal'. */
  vozRitmo: 'pausada' | 'normal';
}

export const PREFERENCIAS_INICIALES: Preferencias = {
  recordatorioDiario: true,
  horaRecordatorio: '21:00',
  notificacionesDiscretas: false,
  personaConfianza: null,
  vozId: null,
  vozRitmo: 'pausada',
};

export const preferencias = {
  async obtener(): Promise<Preferencias> {
    try {
      const json = await AsyncStorage.getItem(KEY);
      return json ? { ...PREFERENCIAS_INICIALES, ...JSON.parse(json) } : PREFERENCIAS_INICIALES;
    } catch {
      return PREFERENCIAS_INICIALES;
    }
  },

  /** Mezcla los cambios con lo guardado y devuelve el resultado. */
  async guardar(cambios: Partial<Preferencias>): Promise<Preferencias> {
    const siguiente = { ...(await preferencias.obtener()), ...cambios };
    await AsyncStorage.setItem(KEY, JSON.stringify(siguiente));
    return siguiente;
  },
};
