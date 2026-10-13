import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Txt } from '../../../components/ui';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/spacing';

/**
 * Respuestas rápidas tipo encuesta (v5) bajo la ÚLTIMA respuesta de la
 * asistente. Con 2–3 opciones van como filas a todo el ancho (fáciles de tocar
 * y de leer); con más, como píldoras que parten línea. Todas ≥ 44 px.
 *
 * Tocar una envía ese texto como mensaje de la persona (ChatScreen) y las
 * opciones desaparecen porque el mensaje deja de ser el último. El campo de
 * texto sigue disponible para responder con sus propias palabras.
 */

interface RespuestasRapidasProps {
  opciones: string[];
  onElegir: (opcion: string) => void;
  /** Ancho máximo (el mismo que los botones de acción). */
  anchoMaximo?: number;
}

const ALTO_MINIMO = 44;

export const RespuestasRapidas: React.FC<RespuestasRapidasProps> = ({
  opciones,
  onElegir,
  anchoMaximo,
}) => {
  if (opciones.length === 0) return null;
  const enFilas = opciones.length <= 3;

  const elegir = (opcion: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onElegir(opcion);
  };

  return (
    <View
      accessibilityLabel="Respuestas rápidas"
      style={{
        alignSelf: 'flex-start',
        width: '100%',
        maxWidth: anchoMaximo,
        gap: 8,
        flexDirection: enFilas ? 'column' : 'row',
        flexWrap: enFilas ? 'nowrap' : 'wrap',
      }}>
      {opciones.map((opcion) => (
        <Pressable
          key={opcion}
          onPress={() => elegir(opcion)}
          accessibilityRole="button"
          accessibilityLabel={opcion}
          accessibilityHint="Envía esta respuesta"
          android_ripple={{ color: colors.ripple }}
          style={({ pressed }) => ({
            minHeight: ALTO_MINIMO,
            paddingVertical: 10,
            paddingHorizontal: enFilas ? 18 : 16,
            borderRadius: enFilas ? radius.lg : radius.full,
            overflow: 'hidden',
            borderWidth: 1.5,
            borderColor: colors.forest,
            backgroundColor: Platform.OS === 'ios' && pressed ? colors.sage : colors.surface,
            justifyContent: 'center',
            alignItems: enFilas ? 'flex-start' : 'center',
          })}>
          <Txt size={14.5} weight="semibold" color={colors.forest} numberOfLines={2}>
            {opcion}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
};
