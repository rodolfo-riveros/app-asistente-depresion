import { api } from './api';
import { HamiltonResult } from '../types/chat';

export type Tendencia = 'mejorando' | 'estable' | 'empeorando';

export interface PerfilFicha {
  nombre?: string | null;
  edad?: number | null;
  ciudad?: string | null;
  ocupacion?: string | null;
}

export interface EvaluacionResumen {
  fecha: string;
  score: number;
  nivel: string;
}

export interface ItemHamilton {
  item: number;
  etiqueta: string;
  valor: number | null;
  maximo: number;
  registrado: boolean;
}

export interface ProgresoTest {
  registrados: number;
  total: number;
  porcentaje: number;
}

export interface ActividadFicha {
  conversaciones: number;
  mensajes: number;
  primera_conversacion: string | null;
  ultima_conversacion: string | null;
  actividades_creadas: number;
  actividades_completadas: number;
  tasa_cumplimiento: number;
}

export interface Diagnostico {
  generado_en: string;
  perfil: PerfilFicha;
  ultima_evaluacion: HamiltonResult | null;
  evaluaciones: EvaluacionResumen[];
  items: ItemHamilton[];
  progreso: ProgresoTest;
  actividad: ActividadFicha;
  tendencia: Tendencia | null;
  aviso: string;
}

/** Puntaje máximo de la escala de Hamilton de 17 ítems. */
export const SCORE_MAXIMO = 52;

/**
 * Escala de referencia local. Sólo se usa para rellenar huecos si el backend
 * devuelve menos de 17 ítems: la ficha siempre debe mostrar la escala completa
 * porque los ítems sin registrar también son información para el profesional.
 */
const ESCALA_HAMILTON: { etiqueta: string; maximo: number }[] = [
  { etiqueta: 'Ánimo deprimido', maximo: 4 },
  { etiqueta: 'Sentimientos de culpa', maximo: 4 },
  { etiqueta: 'Ideación suicida', maximo: 4 },
  { etiqueta: 'Insomnio de conciliación', maximo: 2 },
  { etiqueta: 'Insomnio intermedio', maximo: 2 },
  { etiqueta: 'Despertar precoz', maximo: 2 },
  { etiqueta: 'Trabajo y actividades', maximo: 4 },
  { etiqueta: 'Inhibición psicomotora', maximo: 4 },
  { etiqueta: 'Agitación', maximo: 4 },
  { etiqueta: 'Ansiedad psíquica', maximo: 4 },
  { etiqueta: 'Ansiedad somática', maximo: 4 },
  { etiqueta: 'Síntomas gastrointestinales', maximo: 2 },
  { etiqueta: 'Síntomas somáticos generales', maximo: 2 },
  { etiqueta: 'Síntomas genitales', maximo: 2 },
  { etiqueta: 'Hipocondría', maximo: 4 },
  { etiqueta: 'Pérdida de peso', maximo: 2 },
  { etiqueta: 'Conciencia de enfermedad', maximo: 2 },
];

const AVISO_POR_DEFECTO =
  'Este documento es una herramienta de orientación psicoeducativa generada a partir de ' +
  'una conversación. No constituye un diagnóstico clínico ni sustituye la valoración de ' +
  'un profesional de la salud mental.';

const numero = (valor: unknown, defecto = 0): number =>
  typeof valor === 'number' && Number.isFinite(valor) ? valor : defecto;

/**
 * Rellena lo que falte de la respuesta del servidor.
 *
 * La pantalla se dibuja siempre igual, así que un backend a medio implementar
 * (o una versión antigua) produce huecos vacíos, nunca una pantalla rota.
 */
const normalizar = (bruto: Partial<Diagnostico> | null | undefined): Diagnostico => {
  const recibidos = Array.isArray(bruto?.items) ? bruto.items : [];

  const items: ItemHamilton[] = ESCALA_HAMILTON.map((base, indice) => {
    const numeroItem = indice + 1;
    const encontrado = recibidos.find((i) => numero(i?.item, -1) === numeroItem);
    const registrado = Boolean(encontrado?.registrado) && encontrado?.valor != null;

    return {
      item: numeroItem,
      etiqueta: encontrado?.etiqueta || base.etiqueta,
      valor: registrado ? numero(encontrado?.valor) : null,
      maximo: numero(encontrado?.maximo, base.maximo) || base.maximo,
      registrado,
    };
  });

  const registrados = numero(
    bruto?.progreso?.registrados,
    items.filter((i) => i.registrado).length
  );
  const total = numero(bruto?.progreso?.total, items.length) || items.length;

  const evaluaciones = (Array.isArray(bruto?.evaluaciones) ? bruto.evaluaciones : [])
    .filter((e) => e && e.fecha)
    .map((e) => ({ fecha: e.fecha, score: numero(e.score), nivel: e.nivel || 'Sin nivel' }))
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  return {
    generado_en: bruto?.generado_en || new Date().toISOString(),
    perfil: bruto?.perfil ?? {},
    ultima_evaluacion: bruto?.ultima_evaluacion ?? null,
    evaluaciones,
    items,
    progreso: {
      registrados,
      total,
      porcentaje: numero(bruto?.progreso?.porcentaje, Math.round((registrados / total) * 100)),
    },
    actividad: {
      conversaciones: numero(bruto?.actividad?.conversaciones),
      mensajes: numero(bruto?.actividad?.mensajes),
      primera_conversacion: bruto?.actividad?.primera_conversacion ?? null,
      ultima_conversacion: bruto?.actividad?.ultima_conversacion ?? null,
      actividades_creadas: numero(bruto?.actividad?.actividades_creadas),
      actividades_completadas: numero(bruto?.actividad?.actividades_completadas),
      tasa_cumplimiento: numero(bruto?.actividad?.tasa_cumplimiento),
    },
    tendencia: bruto?.tendencia ?? null,
    aviso: bruto?.aviso || AVISO_POR_DEFECTO,
  };
};

export const diagnosticoService = {
  /** Ficha clínica completa para compartir con un profesional. */
  async obtener(): Promise<Diagnostico> {
    const datos = await api.request<Partial<Diagnostico>>(
      'get',
      '/diagnostico',
      undefined,
      'No se pudo preparar tu ficha de diagnóstico.'
    );
    return normalizar(datos);
  },
};
