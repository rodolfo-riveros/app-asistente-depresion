import type { Accion, RecursoId } from '../types/chat';

/**
 * Validación tolerante de las `acciones` que manda el backend (v4).
 *
 * El backend puede no mandarlas (versión anterior, columna aún sin migrar →
 * `undefined`/`null`) o mandar un tipo que esta versión de la app no conoce.
 * Nada de eso debe romper el chat: se quedan sólo las acciones completas y
 * conocidas; el resto se descarta en silencio.
 */

const RECURSOS: readonly RecursoId[] = [
  'guia-depresion',
  'respiracion-478',
  'escaneo-corporal',
  'tres-cosas-buenas',
  'grounding-54321',
  'higiene-sueno',
  'activacion-conductual',
];

const texto = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const textoOpcional = (v: unknown): string | null => (texto(v) ? v : null);
const numeroOpcional = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

const normalizarUna = (raw: unknown): Accion | null => {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  if (!texto(a.titulo)) return null;
  const titulo = a.titulo;

  switch (a.tipo) {
    case 'musica':
      if (!texto(a.spotify_url) || !texto(a.youtube_music_url)) return null;
      return {
        tipo: 'musica',
        titulo,
        busqueda: texto(a.busqueda) ? a.busqueda : titulo,
        spotify_url: a.spotify_url,
        youtube_music_url: a.youtube_music_url,
      };
    case 'recurso':
      if (!RECURSOS.includes(a.recurso_id as RecursoId)) return null;
      return { tipo: 'recurso', titulo, recurso_id: a.recurso_id as RecursoId };
    case 'centro':
      if (!texto(a.maps_url)) return null;
      return {
        tipo: 'centro',
        titulo,
        direccion: textoOpcional(a.direccion),
        telefono: textoOpcional(a.telefono),
        maps_url: a.maps_url,
        distancia_km: numeroOpcional(a.distancia_km),
      };
    case 'buscar_mapa':
      if (!texto(a.maps_url)) return null;
      return { tipo: 'buscar_mapa', titulo, maps_url: a.maps_url };
    case 'llamar':
      if (!texto(a.telefono)) return null;
      return { tipo: 'llamar', titulo, telefono: a.telefono };
    case 'actividad':
      return { tipo: 'actividad', titulo, actividad_id: textoOpcional(a.actividad_id) };
    default:
      return null;
  }
};

/** Devuelve siempre un array (vacío si no llegó nada válido). */
export const normalizarAcciones = (raw: unknown): Accion[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizarUna).filter((a): a is Accion => a !== null);
};
