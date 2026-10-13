export type MessageRole = 'user' | 'assistant';

export type AssistantEmotion = 'listening' | 'empathetic' | 'concerned' | 'inspiring' | 'neutral';

/** Ids de los recursos de la app (`src/screens/recursos/contenido.ts`). */
export type RecursoId =
  | 'guia-depresion'
  | 'respiracion-478'
  | 'escaneo-corporal'
  | 'tres-cosas-buenas'
  | 'grounding-54321'
  | 'higiene-sueno'
  | 'activacion-conductual';

/**
 * Botón de acción que el backend adjunta a una respuesta de la asistente
 * (contrato en `notas/Chat como amiga.md`). Discriminada por `tipo`.
 */
export type Accion =
  | {
      tipo: 'musica';
      titulo: string;
      busqueda: string;
      spotify_url: string;
      youtube_music_url: string;
    }
  | { tipo: 'recurso'; titulo: string; recurso_id: RecursoId }
  | {
      tipo: 'centro';
      titulo: string;
      direccion?: string | null;
      telefono?: string | null;
      maps_url: string;
      distancia_km?: number | null;
    }
  | { tipo: 'buscar_mapa'; titulo: string; maps_url: string }
  | { tipo: 'llamar'; titulo: string; telefono: string }
  | { tipo: 'actividad'; titulo: string; actividad_id?: string | null };

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  emotion?: AssistantEmotion;
  /** Botones bajo la burbuja de la asistente (música, recursos, mapas…). */
  acciones?: Accion[];
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
