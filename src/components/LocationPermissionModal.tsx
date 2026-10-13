import React from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { radius } from '../constants/spacing';
import { useLayout } from '../hooks/useLayout';
import { Button, Card, IconTile, Txt } from './ui';

interface LocationPermissionModalProps {
  visible: boolean;
  onGrant: () => void;
  onDeny: () => void;
}

/** Pregunta antes de pedir la ubicación (el backend la solicita en crisis). */
export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  visible,
  onGrant,
  onDeny,
}) => {
  const insets = useSafeAreaInsets();
  const { ancho, fontScale } = useLayout();
  // Dos botones de ≈ 130 px no caben con letra grande en 360 px: se apilan
  // (la acción principal arriba, como en los diálogos de Android).
  const apilar = ancho < 400 && fontScale >= 1.15;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onDeny}>
      <View style={{ flex: 1, backgroundColor: colors.scrim }}>
        <ScrollView
          bounces={false}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: insets.left + 24,
            paddingRight: insets.right + 24,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          }}>
          <Card
            rounded={radius.card}
            padding={22}
            gap={14}
            style={{ width: '100%', maxWidth: 360, alignItems: 'center' }}>
            <View
              accessibilityViewIsModal
              style={{ alignSelf: 'stretch', alignItems: 'center', gap: 14 }}>
              <IconTile name="pin" size={52} rounded={26} iconSize={24} />
              <Txt
                size={20}
                weight="bold"
                tracking={-0.3}
                align="center"
                accessibilityRole="header">
                Compartir tu ubicación
              </Txt>
              <Txt size={14} leading={1.45} color={colors.inkSoft} align="center">
                Así puedo mostrarte los centros de salud mental más cercanos en Cusco. Solo se usa
                para esta búsqueda.
              </Txt>
              <View
                style={{
                  flexDirection: apilar ? 'column-reverse' : 'row',
                  gap: 10,
                  alignSelf: 'stretch',
                  marginTop: 4,
                }}>
                <Button
                  label="Ahora no"
                  variant="outline"
                  size="md"
                  grow={!apilar}
                  onPress={onDeny}
                />
                <Button label="Sí, compartir" size="md" grow={!apilar} onPress={onGrant} />
              </View>
            </View>
          </Card>
        </ScrollView>
      </View>
    </Modal>
  );
};
