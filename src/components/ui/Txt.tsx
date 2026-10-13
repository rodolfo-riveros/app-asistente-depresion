import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { fonts, FontWeight } from '../../constants/typography';

interface TxtProps extends TextProps {
  /** Tamaño en px (el diseño usa 11.5 – 40). */
  size?: number;
  weight?: FontWeight;
  color?: string;
  /** Interlineado como factor (1.45 = 145 %). */
  leading?: number;
  /** Tracking en px (negativo en titulares). */
  tracking?: number;
  align?: TextStyle['textAlign'];
}

/**
 * Texto base de la app con Figtree. Úsalo en lugar de `<Text>` para que el
 * peso cargue la familia correcta en Android.
 */
export const Txt: React.FC<TxtProps> = ({
  size = 15,
  weight = 'regular',
  color = colors.ink,
  leading,
  tracking,
  align,
  style,
  maxFontSizeMultiplier = 1.35,
  ...rest
}) => (
  <Text
    // Respeta el tamaño de letra del sistema (accesibilidad) pero con techo,
    // para que una fuente al 200 % no rompa tarjetas y botones.
    maxFontSizeMultiplier={maxFontSizeMultiplier}
    {...rest}
    style={[
      {
        fontFamily: fonts[weight],
        fontSize: size,
        color,
        lineHeight: leading ? Math.round(size * leading) : undefined,
        letterSpacing: tracking,
        textAlign: align,
        // Android añade relleno vertical propio a cada fuente: sin esto Figtree
        // queda descentrada en botones y píldoras respecto a iOS.
        includeFontPadding: false,
      },
      style,
    ]}
  />
);

/** Titular de pantalla (28 px, bold, tracking -0.6). Escala menos con la fuente del sistema. */
export const Title: React.FC<TxtProps> = (props) => (
  <Txt
    size={28}
    weight="bold"
    tracking={-0.6}
    accessibilityRole="header"
    maxFontSizeMultiplier={1.2}
    {...props}
  />
);
