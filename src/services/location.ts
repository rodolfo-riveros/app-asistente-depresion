import * as Location from 'expo-location';
import { MentalHealthCenter } from '../types/chat';

export const CUSCO_HEALTH_CENTERS: MentalHealthCenter[] = [
  {
    id: 'c1',
    nombre: 'Centro de Salud Mental Comunitario Wanchaq',
    direccion: 'Av. Perú K-10, Wanchaq, Cusco',
    telefono: '084-245112',
    distanciaKm: 1.2,
    lat: -13.5226,
    lon: -71.9616,
    horario: 'Atención 24 Horas',
  },
  {
    id: 'c2',
    nombre: 'Hospital Antonio Lorena de Cusco',
    direccion: 'Plaza Belén s/n, Santiago, Cusco',
    telefono: '084-226511',
    distanciaKm: 2.5,
    lat: -13.5251,
    lon: -71.9845,
    horario: 'Urgencias 24 Horas',
  },
  {
    id: 'c3',
    nombre: 'Hospital Regional del Cusco',
    direccion: 'Av. de la Cultura 1420, Cusco',
    telefono: '084-227661',
    distanciaKm: 3.1,
    lat: -13.523,
    lon: -71.953,
    horario: 'Emergencias 24/7',
  },
  {
    id: 'c4',
    nombre: 'CSMC San Jerónimo - Cusco',
    direccion: 'Calle Clorinda Matto de Turner s/n, San Jerónimo',
    telefono: '084-274090',
    distanciaKm: 5.8,
    lat: -13.541,
    lon: -71.889,
    horario: '8:00 AM - 8:00 PM',
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
