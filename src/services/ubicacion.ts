import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Ubicación para recomendar centros de salud mental cercanos (v4).
 *
 * Decisión del usuario: el permiso se pide al crear la cuenta (hoja en Inicio)
 * y, si está concedido, la app adjunta lat/lon a cada mensaje del chat. Aquí
 * NUNCA se muestra el diálogo del sistema salvo en `pedirPermisoUbicacion`.
 */

export type EstadoPermisoUbicacion = 'cargando' | 'pendiente' | 'concedido' | 'bloqueado';

export interface Coordenadas {
  lat: number;
  lon: number;
}

/** Una posición sirve durante 10 min: para "centros cercanos" basta y ahorra batería. */
const VIGENCIA_MS = 10 * 60 * 1000;
/** Tope para obtener una posición nueva (sin señal `getCurrentPositionAsync` puede colgarse). */
const PLAZO_GPS_MS = 12000;

let cache: { coords: Coordenadas; en: number } | null = null;
let enCurso: Promise<Coordenadas | null> | null = null;

const aEstado = (p: Location.LocationPermissionResponse): EstadoPermisoUbicacion => {
  if (p.granted) return 'concedido';
  return p.canAskAgain ? 'pendiente' : 'bloqueado';
};

/** Consulta el permiso sin preguntar nada a la persona. */
export const leerPermisoUbicacion = async (): Promise<EstadoPermisoUbicacion> => {
  try {
    return aEstado(await Location.getForegroundPermissionsAsync());
  } catch {
    return 'pendiente';
  }
};

/** Muestra el diálogo del sistema (sólo tras explicar el motivo). */
export const pedirPermisoUbicacion = async (): Promise<EstadoPermisoUbicacion> => {
  try {
    const estado = aEstado(await Location.requestForegroundPermissionsAsync());
    if (estado === 'concedido') void ubicacionActual(); // precalienta la caché
    return estado;
  } catch {
    return 'pendiente';
  }
};

const conPlazo = <T>(promesa: Promise<T>, ms: number, valor: T): Promise<T> =>
  new Promise((resolve) => {
    const t = setTimeout(() => resolve(valor), ms);
    promesa.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      () => {
        clearTimeout(t);
        resolve(valor);
      }
    );
  });

const guardar = (pos: Location.LocationObject | null): Coordenadas | null => {
  if (!pos) return null;
  const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
  cache = { coords, en: Date.now() };
  return coords;
};

const obtener = async (): Promise<Coordenadas | null> => {
  if ((await leerPermisoUbicacion()) !== 'concedido') {
    cache = null;
    return null;
  }
  // Primero la última conocida (instantánea); si es reciente, basta.
  const ultima = await Location.getLastKnownPositionAsync({ maxAge: VIGENCIA_MS }).catch(
    () => null
  );
  if (ultima) return guardar(ultima);
  const actual = await conPlazo(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    PLAZO_GPS_MS,
    null
  );
  return guardar(actual);
};

/**
 * Posición actual si hay permiso; `null` si no lo hay o no se pudo obtener.
 * No pide permiso. Usa una caché de 10 min y comparte la búsqueda en curso.
 */
export const ubicacionActual = (): Promise<Coordenadas | null> => {
  if (cache && Date.now() - cache.en < VIGENCIA_MS) return Promise.resolve(cache.coords);
  if (!enCurso) {
    enCurso = obtener()
      .catch(() => null)
      .finally(() => {
        enCurso = null;
      });
  }
  return enCurso;
};

/**
 * Como `ubicacionActual`, pero sin esperar más de `ms`. Si el GPS tarda, se
 * devuelve `null` y la búsqueda sigue en segundo plano para el próximo mensaje.
 */
export const ubicacionRapida = (ms = 1500): Promise<Coordenadas | null> =>
  conPlazo(ubicacionActual(), ms, null);

/** Olvida la posición guardada (al cerrar sesión). */
export const olvidarUbicacion = () => {
  cache = null;
};

/* ------------------------------------------- "ya se le preguntó" (Inicio) */

/**
 * La hoja de ubicación se muestra UNA vez por persona en este teléfono: tras
 * crear la cuenta, o al iniciar sesión sin haberla concedido nunca. Se guarda
 * la lista de ids de usuario a los que ya se les preguntó.
 */
const PREGUNTADA = '@ubicacion_preguntada';

const leerPreguntadas = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(PREGUNTADA);
    const lista: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(lista) ? lista.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

export const yaSePreguntoUbicacion = async (usuarioId: string): Promise<boolean> =>
  (await leerPreguntadas()).includes(usuarioId);

export const marcarUbicacionPreguntada = async (usuarioId: string): Promise<void> => {
  const lista = await leerPreguntadas();
  if (lista.includes(usuarioId)) return;
  await AsyncStorage.setItem(PREGUNTADA, JSON.stringify([...lista, usuarioId])).catch(
    () => undefined
  );
};
