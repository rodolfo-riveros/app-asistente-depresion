import * as Location from 'expo-location';
import { MentalHealthCenter } from '../types/chat';

/**
 * Centros de salud mental de Cusco.
 *
 * SÓLO datos con fuente oficial o institucional (revisados el 2026-10-12). Si un
 * dato no se pudo verificar se deja en null: nunca inventar teléfonos ni
 * coordenadas — en crisis, un número equivocado es peligroso. Revisar cada
 * cierto tiempo (los teléfonos cambian) y confirmar llamando.
 */
export const CUSCO_HEALTH_CENTERS: MentalHealthCenter[] = [
  {
    id: 'csmc-cusco',
    nombre: 'Centro de Salud Mental Comunitario Cusco',
    direccion: 'Calle Osvaldo Baca 211, Urb. Magisterio (cerca al Parque El Trébol), Wanchaq',
    telefono: '991069763',
    lat: null,
    lon: null,
    horario: 'Lunes a sábado, 7:00 a. m. – 7:00 p. m.',
    fuente: 'Minsa · gob.pe/10942 (Centros de Salud Mental Comunitaria)',
  },
  {
    id: 'csmc-santiago',
    nombre: 'Centro de Salud Mental Comunitario Santiago',
    direccion: 'Calle Reverendo Padre Manya s/n (ex Terminal de Quillabamba), Santiago',
    telefono: '084386029',
    lat: null,
    lon: null,
    horario: 'Consultar horario por teléfono',
    fuente: 'Directorio institucional (amlq.org.pe)',
  },
  {
    id: 'hospital-regional',
    nombre: 'Hospital Regional del Cusco',
    direccion: 'Av. de la Cultura s/n, Wanchaq',
    telefono: '084227661',
    lat: null,
    lon: null,
    horario: 'Emergencias 24 horas',
    fuente: 'gob.pe › Hospital Regional Cusco › Sedes',
  },
  {
    id: 'hospital-lorena',
    nombre: 'Hospital Antonio Lorena',
    direccion: 'Calle Carlos Ugarte s/n, Urb. Primavera, Huancaro, Santiago',
    telefono: '084224712',
    lat: null,
    lon: null,
    horario: 'Emergencias 24 horas',
    fuente: 'gob.pe › Hospital Antonio Lorena › Contacto (central telefónica)',
  },
];

export const locationService = {
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.error('Error requesting location permission:', e);
      return false;
    }
  },

  async getCurrentLocation(): Promise<{ lat: number; lon: number } | null> {
    try {
      const isGranted = await this.requestPermission();
      if (!isGranted) return null;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return {
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
      };
    } catch (e) {
      console.error('Error getting current location:', e);
      return null;
    }
  },

  getNearbyCenters(): MentalHealthCenter[] {
    return CUSCO_HEALTH_CENTERS;
  },
};
