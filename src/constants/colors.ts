/**
 * Paleta "Aliento" — claro, salvia y melocotón.
 *
 * Fuente única de verdad de color: ningún componente debe escribir un hex
 * a mano. Los valores salen tal cual del diseño (`notas/diseño-fuente/`).
 * `tailwind.config.js` replica estas claves para usarlas con `className`.
 */
export const colors = {
  // Fondos y superficies
  background: '#F3F4EF',
  surface: '#FFFFFF',
  surfaceMuted: '#E8EBE3',
  sage: '#DDE6DC',
  sageMid: '#9DB5A3',
  sageLight: '#C3D3C5',
  sagePale: '#C9D3C5',
  peachPale: '#FBEBDF',
  peachSoft: '#F6D2B8',
  lavenderPale: '#E6E1F1',
  neutralPale: '#E8E3DC',

  // Verdes de marca
  forest: '#2F4A3E',
  moss: '#5E7F6E',
  stone: '#8E9C95',

  // Texto
  ink: '#1F2A26',
  inkSoft: '#4C5853',
  inkOnSage: '#3D4944',
  inkOnAccent: '#3A2A1F',
  onDark: '#F3F4EF',
  onDarkMuted: '#C9D3CD',

  // Acento (melocotón por defecto)
  accent: '#E8A87C',

  // Bordes
  border: '#D5DBD2',
  divider: '#E1E4DC',
  dividerSoft: '#EDEFE9',
  toggleOff: '#C9D0C6',

  // Ayuda / crisis
  dangerBg: '#F6DCD3',
  dangerInk: '#7A2E1E',
  dangerInkSoft: '#5C2A1E',
  dangerSolid: '#E9967A',

  // Modo voz (oscuro)
  voiceBg: '#22302B',
  voiceSurface: '#2E3E38',
  voiceRing: '#3F4F45',
  voiceMuted: '#B9C6BE',

  /** Onda táctil de Android (android_ripple) sobre superficies claras y oscuras. */
  ripple: 'rgba(47, 74, 62, 0.12)',
  rippleOnDark: 'rgba(243, 244, 239, 0.16)',

  white: '#FFFFFF',
  transparent: 'transparent',
  scrim: 'rgba(31, 42, 38, 0.45)',
  shadow: '#1F2A26',
} as const;

/** Escala de ánimo del check-in de Inicio (de "Muy mal" a "Muy bien"). */
export const moodScale = [
  { label: 'Muy mal', color: '#8E9C95' },
  { label: 'Mal', color: '#AFC0B4' },
  { label: 'Regular', color: '#C9D3C5' },
  { label: 'Bien', color: '#EFC6A4' },
  { label: 'Muy bien', color: '#E8A87C' },
] as const;

export type ColorToken = keyof typeof colors;
