import { TextStyle } from 'react-native';

export const fonts = {
  sizes: {
    labelSm: 12,
    labelMd: 14,
    bodyMd: 16,
    bodyLg: 18,
    headlineMd: 24,
    headlineLg: 32,
    displayLgMobile: 40,
    displayLg: 64,
  },
  weights: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
  },
};
