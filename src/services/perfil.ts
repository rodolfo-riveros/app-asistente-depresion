import { api } from './api';

/**
 * Sin foto de perfil (v5, 2026-10-13): el avatar es la inicial sobre `accent`.
 * Si un backend anterior aún manda `foto_url`, se ignora.
 */
export interface Perfil {
  id: string;
  nombre: string;
  email?: string | null;
  edad?: number | null;
  ciudad?: string | null;
  ocupacion?: string | null;
  bio?: string | null;
}

export type PerfilEditable = Pick<Perfil, 'nombre' | 'edad' | 'ciudad' | 'ocupacion' | 'bio'>;

/**
 * Perfil de la persona.
 *
 * El backend usa estos datos como memoria del acompañante: lo que se guarda
 * aquí es lo que el asistente "sabe" de ti en próximas conversaciones.
 * Las actividades tienen su propio servicio (`services/actividades.ts`).
 */
export const perfilService = {
  async obtener(): Promise<Perfil> {
    return api.request<Perfil>('get', '/perfil', undefined, 'No se pudo cargar tu perfil.');
  },

  /**
   * `PUT /perfil`. Sólo viajan las claves presentes en `cambios`; una clave
   * presente con `undefined`, `null` o `''` significa "vaciar el dato" y se
   * manda como `null` (el backend lo borra; el nombre nunca se borra).
   */
  async guardar(cambios: Partial<PerfilEditable>): Promise<Perfil> {
    const cuerpo = Object.fromEntries(
      Object.entries(cambios).map(([clave, valor]) => [
        clave,
        valor === undefined || valor === '' ? null : valor,
      ])
    );
    return api.request<Perfil>('put', '/perfil', cuerpo, 'No se pudo guardar tu perfil.');
  },
};
