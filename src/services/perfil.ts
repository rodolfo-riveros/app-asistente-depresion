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

  /**
   * Sube la foto de perfil (`POST /perfil/foto`, campo multipart `foto`; el
   * backend acepta JPG, PNG o WEBP de hasta 5 MB). `uri` viene del selector.
   */
  async subirFoto(uri: string): Promise<Perfil> {
    const form = new FormData();
    const sufijo = uri.split('?')[0].split('.').pop()?.toLowerCase();
    const extension = sufijo === 'png' ? 'png' : sufijo === 'webp' ? 'webp' : 'jpg';
    const tipo = extension === 'jpg' ? 'image/jpeg' : `image/${extension}`;

    if (Platform.OS === 'web') {
      // En web la uri es un blob:/data: sin extensión: manda el tipo real del archivo.
      const blob = await (await fetch(uri)).blob();
      const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
      form.append('foto', blob, `perfil.${ext}`);
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
