import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import { KeyboardAwareScrollView, KeyboardController } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, Title } from '../../../components/ui';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { ANCHO_MAXIMO } from '../../../hooks/useLayout';

interface HojaProps {
  visible: boolean;
  titulo: string;
  onClose: () => void;
  children: ReactNode;
}

/** Espacio entre el campo enfocado y el borde superior del teclado. */
const MARGEN_TECLADO = 24;
/** Franja de velo que siempre queda visible arriba (para poder cerrar tocando fuera). */
const VELO_MINIMO = 48;
/** Arrastre (px) o velocidad a partir de los cuales soltar la hoja la cierra. */
const UMBRAL_CIERRE = 90;
const VELOCIDAD_CIERRE = 0.9;

/**
 * Hoja inferior crema sobre velo oscuro (perfil, persona de confianza, nuevo acuerdo).
 *
 * Teclado: todo el modal es un `KeyboardAwareScrollView` de keyboard-controller
 * con la hoja pegada abajo. Al enfocar un campo, el contenido sube lo justo para
 * dejarlo por encima del teclado (la hoja "se levanta" si es corta y se desplaza
 * si es alta). No se combina con un `KeyboardAvoidingView`: compensarían dos veces.
 *
 * Cierre: botón ×, tocar el velo, atrás de Android (`onRequestClose`) o
 * arrastrar hacia abajo desde el asa/cabecera (como las hojas nativas de iOS y
 * Android). En tablets la hoja no se estira: ancho máximo `ANCHO_MAXIMO`, centrada.
 */
export const Hoja: React.FC<HojaProps> = ({ visible, titulo, onClose, children }) => {
  const insets = useSafeAreaInsets();
  const { height: altoVentana } = useWindowDimensions();
  // Valor animado estable (useState perezoso: no se lee un ref durante el render).
  const [desplazamiento] = useState(() => new Animated.Value(0));

  // Entrada: la hoja sube desde abajo mientras el velo aparece (fade del Modal).
  useEffect(() => {
    if (!visible) return;
    desplazamiento.setValue(altoVentana);
    Animated.timing(desplazamiento, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, altoVentana, desplazamiento]);

  const arrastre = useMemo(
    () =>
      PanResponder.create({
        // Sólo gestos claramente verticales hacia abajo: un toque sigue llegando al botón ×.
        onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onMoveShouldSetPanResponderCapture: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => KeyboardController.dismiss(),
        onPanResponderMove: (_, g) => desplazamiento.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_, g) => {
          if (g.dy > UMBRAL_CIERRE || g.vy > VELOCIDAD_CIERRE) {
            Animated.timing(desplazamiento, {
              toValue: altoVentana,
              duration: 180,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }).start(() => onClose());
          } else {
            Animated.spring(desplazamiento, {
              toValue: 0,
              bounciness: 0,
              useNativeDriver: true,
            }).start();
          }
        },
        onPanResponderTerminate: () =>
          Animated.spring(desplazamiento, {
            toValue: 0,
            bounciness: 0,
            useNativeDriver: true,
          }).start(),
      }),
    [desplazamiento, altoVentana, onClose]
  );

  /** Tocar el velo con el teclado abierto sólo lo cierra; sin teclado, cierra la hoja. */
  const tocarVelo = () => {
    if (KeyboardController.isVisible()) KeyboardController.dismiss();
    else onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.scrim }}>
        <KeyboardAwareScrollView
          bottomOffset={MARGEN_TECLADO}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          // Sin rebote: si la hoja no necesita desplazarse, el arrastre del asa
          // no compite con el scroll en iOS.
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
          <Pressable
            style={{ flexGrow: 1, minHeight: insets.top + VELO_MINIMO }}
            onPress={tocarVelo}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
          />
          <Animated.View
            accessibilityViewIsModal
            style={{
              width: '100%',
              maxWidth: ANCHO_MAXIMO,
              alignSelf: 'center',
              backgroundColor: colors.background,
              borderTopLeftRadius: radius.hero,
              borderTopRightRadius: radius.hero,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
              transform: [{ translateY: desplazamiento }],
            }}>
            {/* Asa + cabecera: zona de arrastre para cerrar. */}
            <View {...arrastre.panHandlers}>
              <View
                style={{
                  alignSelf: 'center',
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                }}
              />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingLeft: spacing.screenForm,
                  paddingRight: 12,
                  paddingTop: 8,
                }}>
                <Title size={22} style={{ flexShrink: 1 }} accessibilityRole="header">
                  {titulo}
                </Title>
                <IconButton name="close" accessibilityLabel="Cerrar" onPress={onClose} />
              </View>
            </View>
            <View
              style={{
                paddingLeft: spacing.screenForm,
                paddingRight: spacing.screenForm,
                paddingTop: 8,
                gap: spacing.stack,
              }}>
              {children}
            </View>
          </Animated.View>
        </KeyboardAwareScrollView>
      </View>
    </Modal>
  );
};
