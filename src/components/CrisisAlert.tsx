import React from 'react';
import { Alert, Linking, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { radius } from '../constants/spacing';
import { lineaAyuda } from '../constants/asistente';
import { ANCHO_MAXIMO } from '../hooks/useLayout';
import { Button, Card, IconButton, IconTile, Icon, Txt } from './ui';
import { ContactoConfianza } from './ContactoConfianza';

interface CrisisAlertProps {
  visible: boolean;
  onClose: () => void;
  onRequestLocation: () => void;
  /** Abre la pantalla completa del protocolo de crisis. */
  onOpenProtocol?: () => void;
}

/*
 * Sin `canOpenURL`: en Android 11+ devuelve `false` para `tel:` si el manifiesto
 * no declara `<queries>`. Se intenta abrir y, si falla (tablet sin línea,
 * simulador), se indica el número para marcarlo a mano.
 */
const llamar = (numero: string) =>
  Linking.openURL(`tel:${numero}`).catch(() =>
    Alert.alert('No se pudo llamar', `Marca el ${numero} desde tu teléfono.`)
  );

const LineaFila: React.FC<{ titulo: string; detalle: string; numero: string }> = ({
  titulo,
  detalle,
  numero,
}) => (
  <Pressable
    onPress={() => llamar(numero)}
    accessibilityRole="button"
    accessibilityLabel={`Llamar a ${titulo}`}
    accessibilityHint={detalle}
    android_ripple={{ color: colors.ripple, foreground: true }}
    style={({ pressed }) => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      minHeight: 56,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.dangerBg,
      opacity: Platform.OS === 'ios' && pressed ? 0.85 : 1,
    })}>
    <IconTile name="phone" bg={colors.surface} color={colors.dangerInk} rounded={22} />
    <View style={{ flex: 1, gap: 2 }}>
      <Txt size={15} weight="bold" color={colors.dangerInk}>
        {titulo}
      </Txt>
      <Txt size={12.5} color={colors.dangerInkSoft}>
        {detalle}
      </Txt>
    </View>
    <Icon name="chevronRight" size={18} color={colors.dangerInk} strokeWidth={2} />
  </Pressable>
);

/**
 * Hoja que aparece sobre el chat cuando el backend activa el protocolo de
 * crisis: líneas de ayuda a un toque, centros cercanos y protocolo completo.
 * Es un `Modal` para que el botón atrás de Android la cierre y quede por
 * encima del teclado.
 */
export const CrisisAlert: React.FC<CrisisAlertProps> = ({
  visible,
  onClose,
  onRequestLocation,
  onOpenProtocol,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.scrim,
          justifyContent: 'flex-end',
          // Modal translúcido (status y navegación): las safe areas se aplican a mano.
          paddingTop: insets.top + 12,
          paddingLeft: insets.left + 12,
          paddingRight: insets.right + 12,
          paddingBottom: Math.max(insets.bottom, 12),
        }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar aviso"
        />
        <Card
          rounded={radius.hero}
          padding={0}
          gap={0}
          // En tablet la hoja no se estira a 800 px: columna centrada.
          style={{
            flexShrink: 1,
            overflow: 'hidden',
            width: '100%',
            maxWidth: ANCHO_MAXIMO,
            alignSelf: 'center',
          }}>
          {/* En pantallas bajas (≈ 640 px) el contenido se desplaza en vez de cortarse. */}
          <ScrollView
            accessibilityViewIsModal
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Txt size={12} weight="semibold" color={colors.dangerInk} tracking={0.6}>
                  ESTAMOS CONTIGO
                </Txt>
                <Txt size={22} weight="bold" tracking={-0.4} accessibilityRole="header">
                  No tienes que pasar por esto a solas
                </Txt>
              </View>
              <IconButton name="close" accessibilityLabel="Cerrar aviso" onPress={onClose} />
            </View>
            <Txt size={14} leading={1.45} color={colors.inkSoft}>
              Si sientes que estás en peligro, habla ahora con alguien que puede ayudarte. Es gratis
              y confidencial.
            </Txt>

            <LineaFila
              titulo="Línea 113 · opción 5"
              detalle={lineaAyuda.detalle}
              numero={lineaAyuda.telefono}
            />
            <LineaFila titulo="SAMU 106" detalle="Urgencias médicas · 24 horas" numero="106" />

            {/* Persona de confianza (v5): un toque para llamarla o escribirle. */}
            <ContactoConfianza onAntesDeNavegar={onClose} />

            <Button
              label="Buscar centros cercanos en Cusco"
              icon="pin"
              variant="outline"
              size="md"
              onPress={onRequestLocation}
            />
            {onOpenProtocol && (
              <Button
                label="Ver todas las opciones de ayuda"
                variant="ghost"
                size="sm"
                onPress={onOpenProtocol}
              />
            )}
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
};
