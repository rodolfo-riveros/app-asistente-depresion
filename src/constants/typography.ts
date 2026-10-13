import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';

/**
 * Figtree en cuatro pesos. En Android `fontWeight` no elige el archivo de la
 * fuente, así que cada peso es una familia distinta: usa `fonts.*` (o el
 * componente `<Txt weight>`), nunca `fontWeight` a secas.
 */
export const fontAssets = {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
};

export const fonts = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
} as const;

export type FontWeight = keyof typeof fonts;
