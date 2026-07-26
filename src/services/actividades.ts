import { api } from './api';

/** Filtros que acepta `GET /actividades?estado=...` (contrato v3, sección 1). */
export type EstadoActividades = 'pendientes' | 'vencidas' | 'completadas' | 'todas';

export type CategoriaActividad =
  'autocuidado' | 'social' | 'estudio' | 'salud' | 'ocio' | 'general';

export interface Actividad {
  id: string;
  titulo: string;
  nota?: string | null;
  categoria: string;
  para_cuando?: string | null;
  completada: boolean;
  completada_en?: string | null;
  /** Lo calcula el backend: `para_cuando < ahora AND NOT completada`. */
  vencida?: boolean;
  /** Lo registra el asistente en el chat cuando la persona cuenta qué pasó. */
  motivo_no_realizada?: string | null;
  creado_en?: string | null;
}

export interface NuevaActividad {
  titulo: string;
  nota?: string;
  categoria?: CategoriaActividad;
  /** ISO 8601. */
  para_cuando?: string;
}

/**
 * Acuerdos que la persona tomó con el asistente durante el chat.
 *
 * El backend también los usa como memoria: las vencidas sin completar entran
 * en el prompt para que el acompañante pregunte por ellas sin regañar.
 */
export const actividadesService = {
  async listar(estado: EstadoActividades = 'pendientes'): Promise<Actividad[]> {
    return api.request<Actividad[]>(
      'get',
      '/actividades',
      { params: { estado } },
      'No se pudieron cargar tus actividades.'
    );
  },

  async completar(id: string, completada = true): Promise<Actividad> {
    return api.request<Actividad>(
      'patch',
      `/actividades/${id}`,
      { completada },
      'No se pudo actualizar la actividad.'
    );
  },

  async crear(datos: NuevaActividad): Promise<Actividad> {
    return api.request<Actividad>(
      'post',
      '/actividades',
      datos,
      'No se pudo guardar la actividad.'
    );
  },

  async eliminar(id: string): Promise<void> {
    await api.request<void>(
      'delete',
      `/actividades/${id}`,
      undefined,
      'No se pudo borrar la actividad.'
    );
  },
};
