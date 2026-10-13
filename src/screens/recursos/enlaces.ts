import { Alert, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

/**
 * Llamadas, mapas y portapapeles con red de seguridad.
 *
 * Se usa `openURL` + `catch` en lugar de `canOpenURL`: sin declarar
 * `LSApplicationQueriesSchemes` (iOS) o `<queries>` (Android 11+), `canOpenURL`
 * devuelve falsos negativos y bloquearía una llamada de crisis que sí funciona.
 * Si la apertura falla (tablet sin SIM, simulador, sin app de mapas), se ofrece
 * copiar el número o la dirección. Nada de esto necesita conexión a internet.
 */

/** Toque háptico ligero; nunca debe romper la acción principal. */
export const toqueLigero = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
};

const copiar = async (texto: string): Promise<boolean> => {
  try {
    await Clipboard.setStringAsync(texto);
    return true;
  } catch {
    return false;
  }
};

/** Copia un número y avisa; si el portapapeles falla, pide marcarlo a mano. */
export const copiarNumero = async (numero: string) => {
  const ok = await copiar(numero);
  Alert.alert(
    ok ? 'Número copiado' : 'No se pudo copiar',
    ok
      ? `El ${numero} está en tu portapapeles. Pégalo en la app de teléfono.`
      : `Marca el ${numero} desde la app de teléfono.`
  );
};

/** Abre el marcador con el número. Si no se puede, ofrece copiarlo. */
export const llamar = async (numero: string) => {
  toqueLigero();
  const limpio = numero.replace(/[^\d+]/g, '');
  try {
    await Linking.openURL(`tel:${limpio}`);
  } catch {
    Alert.alert(
      'No se pudo abrir el teléfono',
      `Marca el ${numero} desde la app de teléfono de este u otro dispositivo.`,
      [
        { text: 'Copiar número', onPress: () => void copiarNumero(numero) },
        { text: 'Entendido', style: 'cancel' },
      ]
    );
  }
};

/** Abre Google Maps (app o navegador). Si falla, ofrece copiar la dirección. */
export const abrirMapa = async (lugar: {
  nombre: string;
  direccion: string;
  lat: number | null;
  lon: number | null;
}) => {
  // Sin coordenadas verificadas se busca por nombre y dirección (más seguro que un punto inventado).
  const consulta =
    lugar.lat != null && lugar.lon != null
      ? `${lugar.lat},${lugar.lon}`
      : encodeURIComponent(`${lugar.nombre}, ${lugar.direccion}, Cusco, Perú`);
  const url = `https://www.google.com/maps/search/?api=1&query=${consulta}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('No se pudo abrir el mapa', `${lugar.nombre}\n${lugar.direccion}`, [
      {
        text: 'Copiar dirección',
        onPress: async () => {
          const ok = await copiar(`${lugar.nombre}, ${lugar.direccion}`);
          if (!ok) Alert.alert('No se pudo copiar', lugar.direccion);
        },
      },
      { text: 'Entendido', style: 'cancel' },
    ]);
  }
};
