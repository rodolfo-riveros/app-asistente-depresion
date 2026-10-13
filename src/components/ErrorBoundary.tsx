import React, { Component, ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../constants/colors';
import { lineaAyuda } from '../constants/asistente';
import { ANCHO_MAXIMO } from '../hooks/useLayout';
import { Button, LogoMark, Txt, llamarLineaAyuda } from './ui';

interface State {
  error: Error | null;
}

/**
 * Último recurso ante un fallo de renderizado: en vez de cerrar la app, muestra
 * una pantalla tranquila con opción de reintentar y la línea de ayuda a mano
 * (quien la usa puede estar pasando un mal momento).
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Error no controlado en la interfaz:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    // Safe area en los 4 bordes (no hay navegación ni tab bar debajo) y scroll
    // por si la fuente del sistema es grande en una pantalla de 360×640. En
    // tablet la columna se centra con el ancho máximo de la app.
    return (
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style="dark" />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          showsVerticalScrollIndicator={false}>
          <View
            style={{ width: '100%', maxWidth: ANCHO_MAXIMO - 80, alignSelf: 'center', gap: 16 }}>
            <LogoMark size={48} />
            <Txt
              size={26}
              weight="bold"
              tracking={-0.5}
              maxFontSizeMultiplier={1.2}
              accessibilityRole="header">
              Algo no salió bien
            </Txt>
            <Txt size={15} leading={1.45} color={colors.inkSoft}>
              La app tuvo un problema inesperado. Tus datos están a salvo. Prueba a volver a
              intentarlo.
            </Txt>
            <Button label="Reintentar" onPress={() => this.setState({ error: null })} />
            {/* Etiqueta corta: "Llamar a la Línea 113, opción 5" no cabe en un botón de
                360 px con fuente grande; la opción va en el texto de abajo. */}
            <Button
              label={`Llamar al ${lineaAyuda.telefono}`}
              variant="danger"
              size="md"
              icon="phone"
              accessibilityHint={`${lineaAyuda.etiqueta}. ${lineaAyuda.detalle}`}
              onPress={llamarLineaAyuda}
            />
            <Txt size={13} leading={1.4} color={colors.inkSoft} align="center">
              {`${lineaAyuda.etiqueta} · ${lineaAyuda.detalle}`}
            </Txt>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}
