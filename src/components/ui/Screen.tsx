import React, { ReactNode } from 'react';
import {
  Platform,
  RefreshControlProps,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { ANCHO_MAXIMO } from '../../hooks/useLayout';

interface ScreenProps {
  children: ReactNode;
  /** Envuelve el contenido en un ScrollView (pantallas largas). */
  scroll?: boolean;
  /** Padding lateral: 20 en pestañas, 24 en formularios. */
  padding?: number;
  /** Separación vertical entre hijos directos. */
  gap?: number;
  /** Fondo (crema por defecto; `voiceBg` en modo voz). */
  bg?: string;
  /** Barra de estado clara u oscura. */
  statusBar?: 'dark' | 'light';
  /** Bordes con safe area. Las pestañas no necesitan `bottom` (lo pone la tab bar). */
  edges?: Edge[];
  /**
   * Pantalla con campos de texto. Con `scroll`, el contenido se desplaza solo
   * para que el campo enfocado quede siempre por encima del teclado; sin
   * `scroll`, el contenido se encoge para dejarle sitio.
   */
  keyboard?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Distancia entre el campo enfocado y el borde superior del teclado. */
const MARGEN_TECLADO = 24;

/**
 * Contenedor de pantalla: safe area + fondo crema + padding del diseño.
 * El teclado lo gestiona `react-native-keyboard-controller` (fiable en Android
 * edge-to-edge, donde el `KeyboardAvoidingView` de React Native falla).
 */
export const Screen: React.FC<ScreenProps> = ({
  children,
  scroll = false,
  padding = spacing.screen,
  gap = spacing.stack,
  bg = colors.background,
  statusBar = 'dark',
  edges = ['top', 'left', 'right'],
  keyboard = false,
  refreshControl,
  contentStyle,
}) => {
  // En tablets y en horizontal el contenido no se estira: columna centrada.
  const inner: ViewStyle = {
    paddingHorizontal: padding,
    paddingTop: 24,
    paddingBottom: 16,
    gap,
    width: '100%',
    maxWidth: ANCHO_MAXIMO,
    alignSelf: 'center',
  };
  const scrollProps = {
    style: { flex: 1 },
    contentContainerStyle: [inner, { flexGrow: 1 }, contentStyle],
    keyboardShouldPersistTaps: 'handled' as const,
    // 'interactive' no existe en Android: allí el teclado se cierra al arrastrar.
    keyboardDismissMode: Platform.OS === 'ios' ? ('interactive' as const) : ('on-drag' as const),
    showsVerticalScrollIndicator: false,
    refreshControl,
  };

  let body: ReactNode;
  if (scroll && keyboard) {
    body = (
      <KeyboardAwareScrollView bottomOffset={MARGEN_TECLADO} {...scrollProps}>
        {children}
      </KeyboardAwareScrollView>
    );
  } else if (scroll) {
    body = <ScrollView {...scrollProps}>{children}</ScrollView>;
  } else if (keyboard) {
    body = (
      <KeyboardAvoidingView behavior="padding" style={[{ flex: 1 }, inner, contentStyle]}>
        {children}
      </KeyboardAvoidingView>
    );
  } else {
    body = <View style={[{ flex: 1 }, inner, contentStyle]}>{children}</View>;
  }

  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar style={statusBar} />
      {body}
    </SafeAreaView>
  );
};
