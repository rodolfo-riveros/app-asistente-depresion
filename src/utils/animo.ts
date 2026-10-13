import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Check-in de ánimo diario ("¿Cómo te sientes ahora?" en Inicio).
 *
 * El backend no guarda este dato todavía, así que vive en el dispositivo.
 * Inicio lo escribe y Registro lo lee para la gráfica "Ánimo de la semana".
 * Se guarda una entrada por día (la última del día gana).
 */

const KEY = '@mood_log';
/** Se conservan ~3 meses; suficiente para la vista semanal y tendencias. */
const MAX_DIAS = 90;

export interface RegistroAnimo {
  /** Día local `YYYY-MM-DD`. */
  dia: string;
  /** 0 = Muy mal … 4 = Muy bien (índice de `moodScale`). */
  valor: number;
  /** ISO de la última vez que se marcó ese día. */
  actualizado: string;
}

export const claveDia = (fecha: Date = new Date()): string => {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const leer = async (): Promise<RegistroAnimo[]> => {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? (JSON.parse(json) as RegistroAnimo[]) : [];
  } catch {
    return [];
  }
};

export const animo = {
  listar: leer,

  /** Ánimo marcado hoy, o `null` si aún no hay. */
  async deHoy(): Promise<number | null> {
    const hoy = claveDia();
    const registro = (await leer()).find((r) => r.dia === hoy);
    return registro ? registro.valor : null;
  },

  async guardar(valor: number): Promise<void> {
    const hoy = claveDia();
    const resto = (await leer()).filter((r) => r.dia !== hoy);
    const lista = [...resto, { dia: hoy, valor, actualizado: new Date().toISOString() }]
      .sort((a, b) => a.dia.localeCompare(b.dia))
      .slice(-MAX_DIAS);
    await AsyncStorage.setItem(KEY, JSON.stringify(lista));
  },

  /**
   * Los últimos 7 días (de lunes a domingo de la semana actual), con `null`
   * en los días sin registro. Útil para la gráfica de barras de Registro.
   */
  async semanaActual(): Promise<{ dia: string; letra: string; valor: number | null }[]> {
    const lista = await leer();
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
    const letras = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    return letras.map((letra, i) => {
      const f = new Date(lunes);
      f.setDate(lunes.getDate() + i);
      const dia = claveDia(f);
      return { dia, letra, valor: lista.find((r) => r.dia === dia)?.valor ?? null };
    });
  },
};
