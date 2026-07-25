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
  status?: 'typing' | 'done';
  resultado?: HamiltonResult;
}

export interface HealthResponse {
  status: string;
  app: string;
  timestamp: string;
}
