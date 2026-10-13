import React from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { asistente } from '../constants/asistente';
import { radius } from '../constants/spacing';
import { Button, Card, IconTile, IconName, Txt } from './ui';

interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
}

const puntos: { icon: IconName; texto: string }[] = [
  { icon: 'chat', texto: 'Conversa libremente sobre cómo te sientes' },
  { icon: 'lock', texto: 'Espacio seguro y confidencial' },
  { icon: 'phone', texto: 'Recursos de apoyo y líneas de ayuda' },
];

/** Presentación de la asistente la primera vez que se abre el chat. */
export const WelcomeModal: React.FC<WelcomeModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.scrim }}>
        {/* Desplazable: en pantallas bajas (≈ 640 px) la tarjeta no se corta. */}
        <ScrollView
          bounces={false}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            // Modal translúcido: safe areas a mano (laterales en apaisado / notch).
            paddingLeft: insets.left + 24,
            paddingRight: insets.right + 24,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          }}>
          <Card
            rounded={radius.card}
            padding={24}
            gap={18}
            style={{ width: '100%', maxWidth: 360 }}>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.sage,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colors.accent,
                  }}
                />
              </View>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Txt size={24} weight="bold" tracking={-0.5} accessibilityRole="header">
                  Hola, soy {asistente.nombre}
                </Txt>
                <Txt size={14} color={colors.inkSoft} align="center">
                  {asistente.descripcion.charAt(0).toUpperCase() + asistente.descripcion.slice(1)}
                </Txt>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              {puntos.map((p) => (
                <View key={p.icon} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <IconTile name={p.icon} size={40} rounded={12} iconSize={18} />
                  <Txt size={14.5} leading={1.35} style={{ flex: 1 }}>
                    {p.texto}
                  </Txt>
                </View>
              ))}
            </View>

            <Button label="Comenzar" onPress={onClose} />
          </Card>
        </ScrollView>
      </View>
    </Modal>
  );
};
