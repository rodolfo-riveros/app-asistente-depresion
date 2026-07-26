import { Platform } from 'react-native';
import { api } from './api';

export interface Perfil {
  id: string;
  nombre: string;
  email?: string | null;
  foto_url?: string | null;
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

  async guardar(cambios: Partial<PerfilEditable>): Promise<Perfil> {
    return api.request<Perfil>('put', '/perfil', cambios, 'No se pudo guardar tu perfil.');
  },

  /** Sube la foto de perfil. `uri` viene del selector de imágenes. */
  async subirFoto(uri: string): Promise<Perfil> {
    const form = new FormData();
    const extension = uri.split('.').pop()?.toLowerCase() === 'png' ? 'png' : 'jpg';
    const tipo = extension === 'png' ? 'image/png' : 'image/jpeg';

    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      form.append('foto', blob, `perfil.${extension}`);
    } else {
      form.append('foto', {
        uri,
        name: `perfil.${extension}`,
        type: tipo,
      } as unknown as Blob);
    }

    return api.subirMultipart<Perfil>('/perfil/foto', form, 'No se pudo subir la imagen.');
  },
};
