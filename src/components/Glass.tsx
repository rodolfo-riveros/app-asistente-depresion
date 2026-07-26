import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import {
  glass,
  glassShadow,
  glassHighlightGradient,
  glassTint,
  GlassLevel,
} from '../constants/glass';

interface GlassProps {
  children?: ReactNode;
  /** Elevación del cristal: `low` fondo, `base` tarjetas, `high` modales. */
  level?: GlassLevel;
  /** Estilo del contenedor exterior (layout, márgenes, tamaño). */
  style?: StyleProp<ViewStyle>;
  /** Estilo del contenido interior (padding, dirección). */
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  /** Radios por esquina (burbujas de chat, hojas inferiores). Anula `radius`. */
  radiusStyle?: ViewStyle;
  /** Color del borde cuando la superficie está activa/enfocada o semantizada. */
  borderColor?: string;
  /** Halo de color detrás del cristal (estado activo, severidad). */
  glowColor?: string;
  /** Oculta el hairline superior (útil en barras pegadas al borde). */
  highlight?: boolean;
  pointerEvents?: ViewStyle['pointerEvents'];
}

/**
 * Primitiva de glassmorphism: blur + tinte + borde luminoso + hairline + sombra.
 * Es la ÚNICA forma permitida de crear una superficie de vidrio en la app.
 */
export const Glass: React.FC<GlassProps> = ({
  children,
  level = 'base',
  style,
  contentStyle,
  radius = spacing.borderRadiusXl,
  radiusStyle,
  borderColor,
  glowColor,
  highlight = true,
  pointerEvents,
}) => {
  const layer = glass[level];

  return (
    <View
      pointerEvents={pointerEvents}
      style={[
        glassShadow[level],
        glowColor ? { shadowColor: glowColor, shadowOpacity: 0.45, shadowRadius: 20 } : null,
        { borderRadius: radius },
        radiusStyle,
        style,
      ]}>
      <View style={[styles.clip, { borderRadius: radius }, radiusStyle]}>
        <BlurView
          intensity={layer.blur}
          tint={glassTint}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: layer.fill }]}
        />
        {highlight && (
          <LinearGradient
            pointerEvents="none"
            colors={glassHighlightGradient}
            style={styles.highlight}
          />
        )}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.border,
            { borderRadius: radius, borderColor: borderColor || layer.border },
            radiusStyle,
          ]}
        />
        <View style={contentStyle}>{children}</View>
      </View>
    </View>
  );
};

/**
 * Velo de fondo para modales: oscurece y difumina lo que hay detrás,
 * de modo que la tarjeta de vidrio siga leyéndose como cristal.
 */
export const GlassScrim: React.FC<{
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ children, style }) => (
  <View style={[styles.scrim, style]}>
    <BlurView
      intensity={24}
      tint={glassTint}
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    />
    {children}
  </View>
);

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  clip: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  border: {
    borderWidth: 1,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
