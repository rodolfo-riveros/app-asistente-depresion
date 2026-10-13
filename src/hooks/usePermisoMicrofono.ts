import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';

/**
 * Estado del permiso de micrófono, pensado para explicar ANTES de pedirlo.
 *
 * - `cargando`: aún no se consultó al sistema.
 * - `pendiente`: nunca se pidió (o se puede volver a pedir) → mostrar la
 *   explicación y un botón "Permitir micrófono".
 * - `concedido`: listo para grabar.
 * - `bloqueado`: el usuario lo negó y el sistema ya no deja preguntar →
 *   sólo queda "Abrir ajustes".
 *
 * Se vuelve a consultar al regresar a la app (p. ej. desde Ajustes).
 */
export type EstadoPermiso = 'cargando' | 'pendiente' | 'concedido' | 'bloqueado';

const leerEstado = async (): Promise<EstadoPermiso> => {
  try {
    const p = await getRecordingPermissionsAsync();
    if (p.granted) return 'concedido';
    return p.canAskAgain ? 'pendiente' : 'bloqueado';
  } catch {
    return 'pendiente';
  }
};

export const usePermisoMicrofono = () => {
  const [estado, setEstado] = useState<EstadoPermiso>('cargando');

  const refrescar = useCallback(async () => {
    setEstado(await leerEstado());
  }, []);

  useEffect(() => {
    let activo = true;
    // El setState ocurre tras el `await`, no de forma síncrona en el efecto.
    leerEstado().then((e) => activo && setEstado(e));
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refrescar();
    });
    return () => {
      activo = false;
      sub.remove();
    };
  }, [refrescar]);

  /** Muestra el diálogo del sistema. Devuelve `true` si quedó concedido. */
  const pedir = useCallback(async (): Promise<boolean> => {
    try {
      const p = await requestRecordingPermissionsAsync();
      const siguiente: EstadoPermiso = p.granted
        ? 'concedido'
        : p.canAskAgain
          ? 'pendiente'
          : 'bloqueado';
      setEstado(siguiente);
      return p.granted;
    } catch {
      setEstado('pendiente');
      return false;
    }
  }, []);

  const abrirAjustes = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  return { estado, pedir, abrirAjustes, refrescar };
};
