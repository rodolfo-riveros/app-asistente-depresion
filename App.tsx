import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DefaultTheme,
  Theme,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SystemUI from 'expo-system-ui';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/constants/colors';
import { fontAssets } from './src/constants/typography';
import { app } from './src/constants/asistente';
import { useAuth } from './src/hooks/useAuth';
import { recordatorio } from './src/services/recordatorio';
import type { RootStackParamList } from './src/navigation/types';

const navigationTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.forest,
    background: colors.background,
    card: colors.surface,
    text: colors.ink,
    border: colors.divider,
    notification: colors.dangerInk,
  },
};

// Color de la ventana nativa que hay detrás de todas las pantallas. Sin esto,
// en cada transición se asomaba el azul noche del tema anterior.
SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});

// Handler de notificaciones y canales Android lo antes posible (antes de que
// llegue un recordatorio con la app abierta). No lanza en web ni en Expo Go.
recordatorio.configurar();

const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Recordatorio diario: reprograma al tener sesión y al volver a primer plano,
 * lo cancela al perderla, y al tocar la notificación abre Inicio (check-in).
 */
const GestorRecordatorio: React.FC<{ navegacionLista: boolean }> = ({ navegacionLista }) => {
  const { isAuthenticated, isLoading } = useAuth();
  // Toque pendiente de atender (ref) + contador para volver a evaluar el efecto.
  const abrirInicio = useRef(false);
  const [toques, setToques] = useState(0);
  const habiaSesion = useRef(false);

  useEffect(
    () =>
      recordatorio.alTocar(() => {
        abrirInicio.current = true;
        setToques((n) => n + 1);
      }),
    []
  );

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      habiaSesion.current = true;
      recordatorio.sincronizar();
      const sub = AppState.addEventListener('change', (s) => {
        if (s === 'active') recordatorio.sincronizar();
      });
      return () => sub.remove();
    }
    // Cierre de sesión (también por token vencido): sin recordatorios.
    if (habiaSesion.current) {
      habiaSesion.current = false;
      recordatorio.cancelarTodo();
    }
  }, [isAuthenticated, isLoading]);

  // Espera a que la navegación esté montada y haya sesión: la app pudo abrirse
  // en frío desde la notificación, con la sesión aún restaurándose.
  useEffect(() => {
    if (!abrirInicio.current || !navegacionLista || isLoading || !isAuthenticated) return;
    if (!navigationRef.isReady()) return;
    navigationRef.navigate('MainApp', { screen: 'InicioTab' });
    abrirInicio.current = false;
  }, [toques, navegacionLista, isLoading, isAuthenticated]);

  return null;
};

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font, ...fontAssets });
  const [navegacionLista, setNavegacionLista] = useState(false);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background }}>
      {/* Teclado coherente en Android edge-to-edge (SDK 56) e iOS. */}
      <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
        <ErrorBoundary>
          <AuthProvider>
            <ChatProvider>
              <NavigationContainer
                ref={navigationRef}
                onReady={() => setNavegacionLista(true)}
                theme={navigationTheme}
                documentTitle={{ formatter: () => app.nombre }}>
                <StatusBar style="dark" />
                <RootNavigator />
                <GestorRecordatorio navegacionLista={navegacionLista} />
              </NavigationContainer>
            </ChatProvider>
          </AuthProvider>
        </ErrorBoundary>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
