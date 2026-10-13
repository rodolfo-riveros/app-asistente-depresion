import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { MENSAJE_DESPERTANDO } from '../services/api';
import { Txt } from './ui';

/**
 * Aviso tranquilo para el arranque en frío del servidor (Render puede tardar
 * hasta ~1 min la primera vez). Sólo aparece si hay una acción en curso
 * (`activo`) y una petición lleva > 4 s esperando.
 */
export const AvisoDespertando: React.FC<{ activo: boolean; align?: 'center' | 'left' }> = ({
  activo,
  align = 'center',
}) => {
  const { servidorDespertando } = useAuth();
  if (!activo || !servidorDespertando) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        gap: 8,
        paddingHorizontal: 8,
      }}>
      <ActivityIndicator size="small" color={colors.moss} />
      <Txt size={12.5} leading={1.4} color={colors.inkSoft} style={{ flexShrink: 1 }}>
        {MENSAJE_DESPERTANDO}
      </Txt>
    </View>
  );
};
