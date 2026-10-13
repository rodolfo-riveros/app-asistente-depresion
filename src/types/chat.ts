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
  | { tipo: 'actividad'; titulo: string; actividad_id?: string | null }
  /** Crisis (v5): la app lo resuelve con la persona de confianza guardada en el teléfono. */
  | { tipo: 'contacto_confianza'; titulo: string };

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  emotion?: AssistantEmotion;
  /** Botones bajo la burbuja de la asistente (música, recursos, mapas…). */
  acciones?: Accion[];
  /**
   * Respuestas rápidas tipo encuesta (v5). Sólo en la respuesta recién llegada:
   * no se guardan en el historial, así que nunca vienen en mensajes restaurados.
   */
  opciones?: string[];
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
  /** null = sin número verificado: la app no muestra el botón Llamar. */
  telefono: string | null;
  distanciaKm?: number;
  /** null = sin coordenadas verificadas: el mapa busca por nombre y dirección. */
  lat: number | null;
  lon: number | null;
  horario: string;
  /** De dónde sale el dato (para revisarlo). */
  fuente?: string;
}
