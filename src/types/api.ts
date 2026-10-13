import { Accion, HamiltonResult } from './chat';

export interface ChatMessageRequest {
  sesion_id?: string;
  mensaje: string;
  lat?: number;
  lon?: number;
}

export interface ChatMessageResponse {
  sesion_id: string;
  respuesta: string;
  test_completo: boolean;
  protocolo_crisis_activo: boolean;
  /** El backend pide que la app solicite permiso de ubicación al usuario. */
  ubicacion_solicitada?: boolean;
  /** Sólo llega en el turno en que el asistente cierra la evaluación. */
  resultado?: HamiltonResult;
  /** Botones de acción de esta respuesta (v4). Opcional: un backend anterior no lo manda. */
  acciones?: Accion[] | null;
  /**
   * Respuestas rápidas (v5) para la ÚLTIMA pregunta de la asistente: `[]` si no
   * hay; máx. 5, cada una ≤ 32 caracteres. No se guardan en el historial.
   */
  opciones?: string[] | null;
}

export interface MensajeGuardado {
  rol: 'user' | 'assistant';
  contenido: string;
  creado_en: string;
  /** Botones guardados con el mensaje (`mensajes.acciones`); `null` en mensajes antiguos. */
  acciones?: Accion[] | null;
}
