import React from 'react';
import { Pressable, View } from 'react-native';
import { colors } from '../../../constants/colors';
import { Icon, ProgressBar, Txt } from '../../../components/ui';
import type { ProgresoTest } from '../../../services/diagnostico';

/**
 * Tarjeta fina con el avance del chequeo (escala de Hamilton). Los datos
 * vienen de `diagnosticoService`: no hay opciones de respuesta porque el
 * backend conduce la escala de forma conversacional.
 */
export const ProgresoChequeo: React.FC<{ progreso: ProgresoTest }> = ({ progreso }) => (
  <View
    accessible
    accessibilityLabel={`Chequeo de ánimo: ${progreso.registrados} de ${progreso.total} temas`}
    style={{
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.sage,
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap: 10,
    }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Txt size={12} weight="semibold" color={colors.forest} tracking={0.6}>
        CHEQUEO DE ÁNIMO
      </Txt>
      <Txt size={12} color={colors.inkSoft}>
        {progreso.registrados} de {progreso.total}
      </Txt>
    </View>
    <ProgressBar value={progreso.total ? progreso.registrados / progreso.total : 0} />
  </View>
);

/** Enlace "Anotado en tu registro · Ver" tras una respuesta que sumó al chequeo. */
export const AnotadoEnRegistro: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="link"
    accessibilityLabel="Anotado en tu registro. Ver registro"
    hitSlop={8}
    style={({ pressed }) => ({
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      minHeight: 32,
      opacity: pressed ? 0.7 : 1,
    })}>
    <Icon name="check" size={14} color={colors.forest} strokeWidth={2.2} />
    <Txt size={12.5} color={colors.forest}>
      Anotado en tu registro ·{' '}
      <Txt
        size={12.5}
        weight="semibold"
        color={colors.forest}
        style={{ textDecorationLine: 'underline' }}>
        Ver
      </Txt>
    </Txt>
  </Pressable>
);
