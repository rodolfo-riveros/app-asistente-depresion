import React, { forwardRef, useState } from 'react';
import { Pressable, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, sizes } from '../../constants/spacing';
import { fonts } from '../../constants/typography';
import { Icon } from './Icon';
import { Txt } from './Txt';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Texto de ayuda bajo el campo (si no hay error). */
  hint?: string;
  /** Muestra el botón de ojo para ver/ocultar la contraseña. */
  password?: boolean;
  /** Campo multilínea con altura libre. */
  multiline?: boolean;
}

/** Campo con etiqueta arriba, 52 px, radio 16, borde salvia. */
export const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, error, hint, password = false, multiline, style, onFocus, onBlur, ...rest }, ref) => {
    const [oculto, setOculto] = useState(true);
    const [foco, setFoco] = useState(false);

    return (
      <View style={{ gap: 6 }}>
        {label && (
          <Txt size={13} weight="semibold">
            {label}
          </Txt>
        )}
        <View style={{ justifyContent: 'center' }}>
          <TextInput
            ref={ref}
            placeholderTextColor={colors.inkSoft}
            maxFontSizeMultiplier={1.35}
            secureTextEntry={password && oculto}
            accessibilityLabel={label}
            multiline={multiline}
            onFocus={(e) => {
              setFoco(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFoco(false);
              onBlur?.(e);
            }}
            {...rest}
            style={[
              {
                minHeight: sizes.input,
                borderRadius: radius.input,
                borderWidth: foco || error ? 1.5 : 1,
                borderColor: error ? colors.dangerInk : foco ? colors.forest : colors.border,
                backgroundColor: colors.surface,
                paddingHorizontal: 16,
                paddingRight: password ? 52 : 16,
                paddingVertical: multiline ? 14 : 0,
                fontFamily: fonts.regular,
                fontSize: 15,
                color: colors.ink,
                textAlignVertical: multiline ? 'top' : 'center',
              },
              style,
            ]}
          />
          {password && (
            <Pressable
              onPress={() => setOculto((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={oculto ? 'Mostrar contraseña' : 'Ocultar contraseña'}
              hitSlop={4}
              style={{
                position: 'absolute',
                right: 4,
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon name={oculto ? 'eye' : 'eyeOff'} size={20} color={colors.inkSoft} />
            </Pressable>
          )}
        </View>
        {error ? (
          <Txt size={12.5} color={colors.dangerInk} accessibilityLiveRegion="polite">
            {error}
          </Txt>
        ) : hint ? (
          <Txt size={12} color={colors.inkSoft}>
            {hint}
          </Txt>
        ) : null}
      </View>
    );
  }
);
