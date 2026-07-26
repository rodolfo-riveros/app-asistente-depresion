import { TextStyle } from 'react-native';

export const fonts = {
  family: 'PlusJakartaSans',

  sizes: {
    labelSm: 12,
    labelMd: 14,
    bodyMd: 16,
    bodyLg: 18,
    headlineMd: 24,
    headlineLg: 28,
    headlineXl: 32,
    headlineXxl: 40,
  },
  weights: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
  },

  lineHeight: {
    bodyMd: 24,
    bodyLg: 28,
    headlineMd: 36,
    headlineLg: 40,
    headlineXl: 48,
  },

  letterSpacing: {
    headlineXl: -0.32,
    headlineLg: -0.28,
    labelMd: 0.28,
  },
};
