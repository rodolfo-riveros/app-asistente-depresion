import { HamiltonResult } from './chat';

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
}

export interface HealthResponse {
  status: string;
}
