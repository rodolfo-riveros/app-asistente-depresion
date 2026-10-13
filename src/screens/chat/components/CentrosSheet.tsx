import React from 'react';
import { Alert, Linking, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../constants/colors';
import { ANCHO_MAXIMO } from '../../../hooks/useLayout';
import { radius } from '../../../constants/spacing';
import { Card, Icon, IconButton, Txt } from '../../../components/ui';
import type { MentalHealthCenter } from '../../../types/chat';

/** Abre el marcador; si no hay app de teléfono, indica el número. */
const llamar = (telefono: string) =>
  Linking.openURL(`tel:${telefono.replace(/\s/g, '')}`).catch(() =>
    Alert.alert('No se pudo llamar', `Marca el ${telefono} desde tu teléfono.`)
  );

interface CentrosSheetProps {
  visible: boolean;
  centros: MentalHealthCenter[];
  onClose: () => void;
}

const Linea: React.FC<{ icon: 'pin' | 'clock' | 'phone'; texto: string; color?: string }> = ({
  icon,
  texto,
  color = colors.inkSoft,
}) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <Icon name={icon} size={14} color={color} strokeWidth={2} />
    <Txt size={13} color={color} style={{ flex: 1 }}>
      {texto}
    </Txt>
  </View>
);

/** Hoja inferior con los centros de salud mental de Cusco. */
export const CentrosSheet: React.FC<CentrosSheetProps> = ({ visible, centros, onClose }) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
        <View
          style={{
            maxHeight: '80%',
            // En tablet la hoja es una columna centrada, no una franja de 800 px.
            width: '100%',
            maxWidth: ANCHO_MAXIMO,
            alignSelf: 'center',
            backgroundColor: colors.background,
            borderTopLeftRadius: radius.hero,
            borderTopRightRadius: radius.hero,
            paddingTop: 10,
            // Modal translúcido: safe areas a mano (horizontal en apaisado, inferior siempre).
            paddingLeft: insets.left + 20,
            paddingRight: insets.right + 20,
            paddingBottom: Math.max(insets.bottom, 16),
          }}>
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
              marginBottom: 12,
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Txt
              size={20}
              weight="bold"
              tracking={-0.3}
              style={{ flex: 1 }}
              accessibilityRole="header">
              Centros de salud mental en Cusco
            </Txt>
            <IconButton name="close" accessibilityLabel="Cerrar" onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
            {centros.map((c) => (
              <Card key={c.id} rounded={radius.lg} gap={6}>
                <Txt size={15} weight="semibold">
                  {c.nombre}
                </Txt>
                <Linea icon="pin" texto={c.direccion} />
                <Linea icon="clock" texto={c.horario} />
                {c.telefono && (
                  <Pressable
                    onPress={() => llamar(c.telefono as string)}
                    accessibilityRole="button"
                    accessibilityLabel={`Llamar a ${c.nombre}`}
                    android_ripple={{ color: colors.ripple, foreground: true }}
                    style={({ pressed }) => ({
                      minHeight: 44,
                      justifyContent: 'center',
                      borderRadius: radius.sm,
                      overflow: 'hidden',
                      opacity: Platform.OS === 'ios' && pressed ? 0.7 : 1,
                    })}>
                    <Linea icon="phone" texto={c.telefono} color={colors.forest} />
                  </Pressable>
                )}
              </Card>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
