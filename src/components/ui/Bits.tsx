import React from 'react';
import { Alert, Linking, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../constants/colors';
import { radius, sizes } from '../../constants/spacing';
import { app, lineaAyuda } from '../../constants/asistente';
import { Icon, IconName } from './Icon';
import { Txt } from './Txt';

/* ------------------------------------------------------------------ Logo */

/** Isotipo de Aliento: sol saliendo sobre el horizonte. */
export const LogoMark: React.FC<{ size?: number; accent?: string }> = ({
  size = 34,
  accent = colors.accent,
}) => (
  <Svg width={size} height={size} viewBox="0 0 34 34" fill="none">
    <Circle cx={17} cy={17} r={17} fill={colors.ink} />
    <Path d="M8 22a9 9 0 0 1 18 0" stroke={accent} strokeWidth={2.4} strokeLinecap="round" />
    <Path d="M6 25h22" stroke={colors.onDark} strokeWidth={2} strokeLinecap="round" />
    <Path
      d="M17 8v3M10.5 10.5l2 2M23.5 10.5l-2 2"
      stroke={colors.onDark}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

/** Isotipo + palabra "aliento". */
export const Logo: React.FC = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
    <LogoMark />
    <Txt size={20} weight="bold" tracking={-0.3}>
      {app.nombre}
    </Txt>
  </View>
);

/* ------------------------------------------------------------- IconTile */

interface IconTileProps {
  name: IconName;
  /** Fondo del cuadro (blanco, salvia, melocotón…). */
  bg?: string;
  color?: string;
  size?: number;
  /** Radio: 12 en Bienvenida, 14 en filas, `size/2` para círculo. */
  rounded?: number;
  iconSize?: number;
  strokeWidth?: number;
}

/** Icono dentro de un cuadro redondeado de color (filas y tarjetas). */
export const IconTile: React.FC<IconTileProps> = ({
  name,
  bg = colors.sage,
  color = colors.forest,
  size = 44,
  rounded = 14,
  iconSize = 20,
  strokeWidth = 1.8,
}) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: rounded,
      backgroundColor: bg,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
    <Icon name={name} size={iconSize} color={color} strokeWidth={strokeWidth} />
  </View>
);

/* ------------------------------------------------------------ IconButton */

interface IconButtonProps {
  name: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  /** Fondo: transparente por defecto (flecha de volver), blanco o salvia. */
  bg?: string;
  color?: string;
  size?: number;
  iconSize?: number;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Botón circular de 44 px con un icono (volver, perfil, voz…). */
export const IconButton: React.FC<IconButtonProps> = ({
  name,
  onPress,
  accessibilityLabel,
  bg = colors.transparent,
  color = colors.ink,
  size = sizes.touch,
  iconSize = 22,
  bordered = false,
  style,
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    hitSlop={4}
    style={({ pressed }) => [
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        borderWidth: bordered ? 1 : 0,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      },
      style,
    ]}>
    <Icon name={name} size={iconSize} color={color} strokeWidth={2} />
  </Pressable>
);

/* ------------------------------------------------------------------ Chip */

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Píldora de filtro (Recursos, Actividades). */
export const Chip: React.FC<ChipProps> = ({ label, selected = false, onPress }) => (
  <Pressable
    onPress={onPress}
    hitSlop={{ top: 2, bottom: 2 }}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    style={{
      // 40 px visibles como en el diseño; el área táctil llega a 44 con hitSlop.
      minHeight: 40,
      paddingHorizontal: 16,
      borderRadius: 20,
      justifyContent: 'center',
      backgroundColor: selected ? colors.ink : colors.surface,
      borderWidth: selected ? 0 : 1,
      borderColor: colors.border,
    }}>
    <Txt
      size={13.5}
      weight={selected ? 'semibold' : 'regular'}
      color={selected ? colors.onDark : colors.ink}>
      {label}
    </Txt>
  </Pressable>
);

/* ----------------------------------------------------------- ProgressBar */

/** Barra fina de progreso (4 px). `value` entre 0 y 1. */
export const ProgressBar: React.FC<{
  value: number;
  color?: string;
  track?: string;
  height?: number;
}> = ({ value, color = colors.moss, track = colors.surfaceMuted, height = 4 }) => (
  <View
    accessibilityRole="progressbar"
    accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
    <View
      style={{
        width: `${Math.max(0, Math.min(1, value)) * 100}%`,
        height,
        borderRadius: height / 2,
        backgroundColor: color,
      }}
    />
  </View>
);

/* ------------------------------------------------------------ HelpButton */

/** Llama a la línea de ayuda; si el dispositivo no puede llamar (tablet, simulador), da el número. */
export const llamarLineaAyuda = async () => {
  try {
    await Linking.openURL(`tel:${lineaAyuda.telefono}`);
  } catch {
    Alert.alert(
      'No pudimos abrir el teléfono',
      `Marca ${lineaAyuda.telefono} desde cualquier teléfono (${lineaAyuda.etiqueta}). Es gratis y atiende las 24 horas.`
    );
  }
};

/**
 * Acceso a ayuda inmediata.
 * - `bar`: barra ancha "¿Necesitas ayuda ya? Línea 113, opción 5" (Inicio).
 * - `compact`: píldora "Ayuda ya" (cabecera de Chat y Voz).
 * Por defecto llama a la línea; pasa `onPress` para abrir el protocolo de crisis.
 */
export const HelpButton: React.FC<{
  variant?: 'bar' | 'compact';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}> = ({ variant = 'bar', onPress = llamarLineaAyuda, style }) => {
  if (variant === 'compact') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Ayuda ya"
        accessibilityHint="Abre las opciones de ayuda inmediata"
        hitSlop={6}
        style={({ pressed }) => [
          {
            height: 36,
            paddingHorizontal: 12,
            borderRadius: 18,
            backgroundColor: colors.dangerBg,
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
          },
          style,
        ]}>
        <Txt size={13} weight="bold" color={colors.dangerInk}>
          Ayuda ya
        </Txt>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`¿Necesitas ayuda ya? ${lineaAyuda.etiqueta}`}
      style={({ pressed }) => [
        {
          minHeight: sizes.buttonMd,
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: radius.full,
          backgroundColor: colors.dangerBg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}>
      <Icon name="phone" size={18} color={colors.dangerInk} strokeWidth={2} />
      <Txt
        size={14}
        weight="semibold"
        color={colors.dangerInk}
        align="center"
        style={{ flexShrink: 1 }}>
        ¿Necesitas ayuda ya? {lineaAyuda.etiqueta}
      </Txt>
    </Pressable>
  );
};

/* -------------------------------------------------------------- Divider */

export const Divider: React.FC<{ color?: string }> = ({ color = colors.dividerSoft }) => (
  <View style={{ height: 1, backgroundColor: color }} />
);
