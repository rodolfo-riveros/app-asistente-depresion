import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/colors';
import type { IconName } from '../../components/ui';
import type { Actividad, CategoriaActividad } from '../../services/actividades';

/** Helpers compartidos por Actividades e Inicio ("Para hoy"). */

export interface EstiloCategoria {
  clave: CategoriaActividad;
  etiqueta: string;
  icono: IconName;
  /** Fondo suave del IconTile / tarjeta. */
  fondo: string;
}

export const CATEGORIAS: EstiloCategoria[] = [
  { clave: 'autocuidado', etiqueta: 'Autocuidado', icono: 'heart', fondo: colors.peachPale },
  { clave: 'social', etiqueta: 'Social', icono: 'user', fondo: colors.lavenderPale },
  { clave: 'estudio', etiqueta: 'Estudio', icono: 'book', fondo: colors.sage },
  { clave: 'salud', etiqueta: 'Salud', icono: 'plus', fondo: colors.sage },
  { clave: 'ocio', etiqueta: 'Ocio', icono: 'play', fondo: colors.lavenderPale },
  { clave: 'general', etiqueta: 'General', icono: 'calendar', fondo: colors.neutralPale },
];

const CATEGORIA_POR_DEFECTO = CATEGORIAS[CATEGORIAS.length - 1];

export const categoriaDe = (clave?: string): EstiloCategoria =>
  CATEGORIAS.find((c) => c.clave === clave) ?? CATEGORIA_POR_DEFECTO;

const MS_DIA = 86400000;
export const DIAS_SEMANA = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];
export const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const inicioDelDia = (fecha: Date) =>
  new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();

/**
 * Fechas en lenguaje cercano ("mañana", "hace 3 días").
 * Un compromiso se vive en días, no en timestamps: la fecha cruda distancia.
 */
export const fechaRelativa = (iso?: string | null): string | null => {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;

  const dias = Math.round((inicioDelDia(fecha) - inicioDelDia(new Date())) / MS_DIA);
  // La hora sólo se menciona si se fijó una: medianoche significa "ese día".
  const hora =
    fecha.getHours() === 0 && fecha.getMinutes() === 0
      ? ''
      : ` a las ${fecha.toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}`;

  if (dias === 0) return `hoy${hora}`;
  if (dias === 1) return `mañana${hora}`;
  if (dias === 2) return `pasado mañana${hora}`;
  if (dias > 2 && dias < 7) return `el ${DIAS_SEMANA[fecha.getDay()]}${hora}`;
  if (dias >= 7 && dias < 14) return 'la próxima semana';
  if (dias === -1) return `ayer${hora}`;
  if (dias < -1 && dias > -7) return `hace ${-dias} días`;
  if (dias <= -7 && dias > -30) {
    const semanas = Math.round(-dias / 7);
    return semanas === 1 ? 'hace una semana' : `hace ${semanas} semanas`;
  }
  return `el ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
};

export const esVencida = (actividad: Actividad) =>
  !actividad.completada && Boolean(actividad.vencida);

/** Texto de "cuándo" de una actividad: "Para mañana", "Se pasó ayer", "Hecho hoy". */
export const textoCuando = (actividad: Actividad): string => {
  const relativa = fechaRelativa(
    actividad.completada
      ? (actividad.completada_en ?? actividad.para_cuando)
      : actividad.para_cuando
  );
  if (!relativa) return 'Sin fecha fija';
  if (actividad.completada) return `Hecho ${relativa}`;
  if (esVencida(actividad)) return `Se pasó ${relativa}`;
  return `Para ${relativa}`;
};

/**
 * Mensaje de error legible para la UI. Los errores de red del cliente traen un
 * segundo párrafo técnico (despertar del servidor): aquí basta la primera frase.
 */
export const mensajeDe = (error: unknown): string => {
  const texto = error instanceof Error ? error.message.split('\n\n')[0].trim() : '';
  return texto || 'Inténtalo de nuevo en un momento.';
};

/**
 * Respuesta háptica ligera. Nunca rompe el flujo: en web o en dispositivos sin
 * motor de vibración simplemente no hace nada.
 */
export const haptico = {
  seleccion: () => Haptics.selectionAsync().catch(() => undefined),
  exito: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined),
  leve: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined),
};
