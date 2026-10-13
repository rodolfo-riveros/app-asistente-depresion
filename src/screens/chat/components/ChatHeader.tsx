import React from 'react';
import { View } from 'react-native';
import { colors } from '../../../constants/colors';
import { asistente } from '../../../constants/asistente';
import { HelpButton, IconButton, Txt } from '../../../components/ui';
import { useLayout } from '../../../hooks/useLayout';

/** Avatar de la asistente: círculo salvia con un sol melocotón. */
export const AvatarAsistente: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.sage,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
    <View
      style={{
        width: size * 0.45,
        height: size * 0.45,
        borderRadius: size * 0.225,
        backgroundColor: colors.accent,
      }}
    />
  </View>
);

interface ChatHeaderProps {
  escribiendo: boolean;
  onBack: () => void;
  onVoz: () => void;
  onAyuda: () => void;
}

/**
 * La cabecera mide siempre 72 px (diseño): con la fuente del sistema al 130 %
 * los textos se limitan a 1,2× y a una línea para que nombre + estado quepan
 * en dos líneas sin empujar los botones. En pantallas estrechas (360 px) el
 * avatar baja a 36 px para dejar sitio al nombre.
 */
const TOPE_FUENTE = 1.2;

/** Cabecera de 72 px: volver, asistente, modo voz y "Ayuda ya". */
export const ChatHeader: React.FC<ChatHeaderProps> = ({ escribiendo, onBack, onVoz, onAyuda }) => {
  const { compacto } = useLayout();

  return (
    <View
      style={{
        height: 72,
        flexShrink: 0,
        paddingLeft: compacto ? 4 : 8,
        paddingRight: compacto ? 10 : 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: compacto ? 6 : 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        backgroundColor: colors.background,
      }}>
      <IconButton name="back" accessibilityLabel="Volver al inicio" onPress={onBack} />
      <AvatarAsistente size={compacto ? 36 : 40} />
      <View
        style={{ flex: 1, minWidth: 0, gap: 2 }}
        accessible
        accessibilityRole="header"
        accessibilityLabel={`${asistente.nombre}, ${escribiendo ? 'escribiendo' : 'aquí contigo'}`}>
        <Txt
          size={16}
          weight="bold"
          numberOfLines={1}
          ellipsizeMode="tail"
          maxFontSizeMultiplier={TOPE_FUENTE}>
          {asistente.nombre}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: colors.moss,
              flexShrink: 0,
            }}
          />
          <Txt
            size={12.5}
            color={colors.inkSoft}
            numberOfLines={1}
            maxFontSizeMultiplier={TOPE_FUENTE}
            style={{ flexShrink: 1 }}>
            {escribiendo ? 'Escribiendo…' : 'Aquí contigo'}
          </Txt>
        </View>
      </View>
      <IconButton
        name="wave"
        accessibilityLabel="Hablar por voz"
        bg={colors.surface}
        iconSize={20}
        onPress={onVoz}
      />
      <HelpButton variant="compact" onPress={onAyuda} style={{ flexShrink: 0 }} />
    </View>
  );
};
