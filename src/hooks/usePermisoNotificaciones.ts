import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { EstadoPermisoNotificaciones, recordatorio } from '../services/recordatorio';

export type { EstadoPermisoNotificaciones };

/**
 * Estado del permiso de notificaciones (mismo patrón que `usePermisoMicrofono`).
 *
 * - `cargando`: aún no se consultó al sistema.
 * - `pendiente`: se puede pedir → explicar el motivo y ofrecer "Permitir".
 * - `concedido`: el recordatorio puede programarse.
 * - `bloqueado`: negado y el sistema ya no deja preguntar → "Abrir ajustes".
 * - `no-disponible`: web o Expo Go sin el módulo; no se muestra nada.
 *
 * Se vuelve a consultar al regresar a la app (p. ej. desde Ajustes).
 */
export const usePermisoNotificaciones = () => {
  const [estado, setEstado] = useState<EstadoPermisoNotificaciones>('cargando');

  const refrescar = useCallback(async () => {
    const e = await recordatorio.leerPermiso();
    setEstado(e);
    return e;
  }, []);

  useEffect(() => {
    let activo = true;
    // El setState ocurre tras el `await`, no de forma síncrona en el efecto.
    recordatorio.leerPermiso().then((e) => activo && setEstado(e));
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refrescar();
    });
    return () => {
      activo = false;
      sub.remove();
    };
  }, [refrescar]);

  /** Muestra el diálogo del sistema. Devuelve el estado resultante. */
  const pedir = useCallback(async (): Promise<EstadoPermisoNotificaciones> => {
    const e = await recordatorio.pedirPermiso();
    setEstado(e);
    return e;
  }, []);

  const abrirAjustes = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  return { estado, pedir, abrirAjustes, refrescar };
};
