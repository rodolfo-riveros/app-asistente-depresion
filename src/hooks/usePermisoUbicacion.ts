import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';
import {
  EstadoPermisoUbicacion,
  leerPermisoUbicacion,
  pedirPermisoUbicacion,
} from '../services/ubicacion';

export type { EstadoPermisoUbicacion };

/**
 * Estado del permiso de ubicación (mismo patrón que `usePermisoMicrofono`).
 *
 * - `cargando`: aún no se consultó al sistema.
 * - `pendiente`: se puede pedir → explicar el motivo y ofrecer "Permitir".
 * - `concedido`: la app adjunta lat/lon a cada mensaje del chat.
 * - `bloqueado`: negado y el sistema ya no deja preguntar → "Abrir ajustes".
 *
 * Se vuelve a consultar al regresar a la app (p. ej. desde Ajustes).
 */
export const usePermisoUbicacion = () => {
  const [estado, setEstado] = useState<EstadoPermisoUbicacion>('cargando');

  const refrescar = useCallback(async () => {
    const e = await leerPermisoUbicacion();
    setEstado(e);
    return e;
  }, []);

  useEffect(() => {
    let activo = true;
    // El setState ocurre tras el `await`, no de forma síncrona en el efecto.
    leerPermisoUbicacion().then((e) => activo && setEstado(e));
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refrescar();
    });
    return () => {
      activo = false;
      sub.remove();
    };
  }, [refrescar]);

  /** Muestra el diálogo del sistema. Devuelve el estado resultante. */
  const pedir = useCallback(async (): Promise<EstadoPermisoUbicacion> => {
    const e = await pedirPermisoUbicacion();
    setEstado(e);
    return e;
  }, []);

  const abrirAjustes = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  return { estado, pedir, abrirAjustes, refrescar };
};
