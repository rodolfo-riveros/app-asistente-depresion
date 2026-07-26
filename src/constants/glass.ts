import { ViewStyle } from 'react-native';
import { colors } from './colors';

export type GlassLevel = 'low' | 'base' | 'high';

export const glassTint = 'dark' as const;

interface GlassLayer {
  blur: number;
  fill: string;
  border: string;
}

export const glass: Record<GlassLevel, GlassLayer> = {
  low: {
    blur: 8,
    fill: 'rgba(255, 255, 255, 0.01)',
    border: 'rgba(255, 255, 255, 0.05)',
  },
  base: {
    blur: 10,
    fill: 'rgba(255, 255, 255, 0.015)',
    border: 'rgba(255, 255, 255, 0.06)',
  },
  high: {
    blur: 14,
    fill: 'rgba(255, 255, 255, 0.02)',
    border: 'rgba(255, 255, 255, 0.08)',
  },
};

export const glassShadow: Record<GlassLevel, ViewStyle> = {
  low: {
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 0,
  },
  base: {
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 1,
  },
  high: {
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
};

export const glassHighlightGradient = [colors.glassHighlight, 'rgba(255, 255, 255, 0)'] as const;

export const glassGlow = (color: string, radius = 16): ViewStyle => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.35,
  shadowRadius: radius,
  elevation: 4,
});
