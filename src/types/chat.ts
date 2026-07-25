export type MessageRole = 'user' | 'assistant';

export type AssistantEmotion = 'listening' | 'empathetic' | 'concerned' | 'inspiring' | 'neutral';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  emotion?: AssistantEmotion;
}

export type DepressionLevel =
  'Sin depresión' | 'Depresión leve' | 'Depresión moderada' | 'Depresión severa';

export interface HamiltonResult {
  score: number;
  nivel: DepressionLevel;
  interpretacion: string;
  recomendaciones: string[];
  fecha: string;
  sesion_id: string;
}

export interface ChatSession {
  sesion_id: string;
  messages: ChatMessage[];
  test_completo: boolean;
  protocolo_crisis_activo: boolean;
  resultado?: HamiltonResult;
}

export interface MentalHealthCenter {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  distanciaKm?: number;
  lat: number;
  lon: number;
  horario: string;
}
