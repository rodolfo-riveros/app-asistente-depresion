import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

/**
 * Medidas adaptativas para Android e iOS.
 *
 * El diseño se dibujó a 390×844 (iPhone 14). En la práctica la app corre en
 * Android de 360 px de ancho, iPhone SE (375×667), Pro Max (430×932) y tablets
 * Android. Reglas:
 * - `compacto`: pantallas bajas o estrechas → reducir ilustraciones y huecos.
 * - `tablet`: el lado corto ≥ 600 → el contenido se centra con `anchoMaximo`
 *   (no se estira una tarjeta de 900 px).
 * - `escala(n)`: escala moderada respecto al ancho de diseño, acotada al
 *   90–110 % para que nada se vea diminuto ni gigante. Úsala en tamaños
 *   "de ilustración" (orbes, alturas de tarjetas hero), NO en texto: el
 *   texto respeta el tamaño de fuente que la persona eligió en su teléfono.
 */

const ANCHO_DISENO = 390;
/** Ancho máximo del contenido en tablets / horizontal. */
export const ANCHO_MAXIMO = 560;

export interface Layout {
  ancho: number;
  alto: number;
  /** Ancho útil del contenido (limitado en tablets). */
  anchoContenido: number;
  compacto: boolean;
  /** Muy bajo (p. ej. iPhone SE, Android con barra de 3 botones): < 700 px. */
  bajo: boolean;
  tablet: boolean;
  horizontal: boolean;
  ios: boolean;
  android: boolean;
  escala: (n: number) => number;
  /** Multiplicador de fuente del sistema (accesibilidad). */
  fontScale: number;
}

export const calcularLayout = (ancho: number, alto: number, fontScale: number): Layout => {
  const ladoCorto = Math.min(ancho, alto);
  const tablet = ladoCorto >= 600;
  const anchoContenido = tablet ? Math.min(ancho, ANCHO_MAXIMO) : ancho;
  const factor = Math.min(1.1, Math.max(0.9, anchoContenido / ANCHO_DISENO));
  return {
    ancho,
    alto,
    anchoContenido,
    compacto: ancho < 370 || alto < 700,
    bajo: alto < 700,
    tablet,
    horizontal: ancho > alto,
    ios: Platform.OS === 'ios',
    android: Platform.OS === 'android',
    escala: (n: number) => Math.round(n * factor),
    fontScale,
  };
};

export const useLayout = (): Layout => {
  const { width, height, fontScale } = useWindowDimensions();
  return useMemo(() => calcularLayout(width, height, fontScale), [width, height, fontScale]);
};
