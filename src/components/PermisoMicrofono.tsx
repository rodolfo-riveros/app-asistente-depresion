import React from 'react';
import { View } from 'react-native';
import { colors } from '../constants/colors';
import { radius } from '../constants/spacing';
import { asistente } from '../constants/asistente';
import { EstadoPermiso } from '../hooks/usePermisoMicrofono';
import { Button, IconTile, Txt } from './ui';

interface PermisoMicrofonoProps {
  estado: Exclude<EstadoPermiso, 'concedido' | 'cargando'>;
  onPedir: () => void;
  onAbrirAjustes: () => void;
  /** `dark` para el modo voz, `light` para el resto. */
  tono?: 'light' | 'dark';
}

/**
 * Explica para qué se usa el micrófono antes de que salga el diálogo del
 * sistema (las tiendas lo exigen y la gente acepta más cuando entiende el
 * motivo). Si el permiso quedó bloqueado, lleva a Ajustes.
 */
export const PermisoMicrofono: React.FC<PermisoMicrofonoProps> = ({
  estado,
  onPedir,
  onAbrirAjustes,
  tono = 'light',
}) => {
  const oscuro = tono === 'dark';
  const bloqueado = estado === 'bloqueado';

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        width: '100%',
        borderRadius: radius.card,
        padding: 16,
        gap: 12,
        backgroundColor: oscuro ? colors.voiceSurface : colors.surface,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconTile
          name="mic"
          bg={oscuro ? colors.voiceRing : colors.sage}
          color={oscuro ? colors.onDark : colors.forest}
          rounded={22}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={15} weight="semibold" color={oscuro ? colors.onDark : colors.ink}>
            {bloqueado ? 'El micrófono está desactivado' : 'Necesito tu micrófono'}
          </Txt>
          <Txt size={13} leading={1.4} color={oscuro ? colors.voiceMuted : colors.inkSoft}>
            {bloqueado
              ? 'Actívalo en Ajustes › Permisos › Micrófono y vuelve aquí.'
              : `Solo se usa mientras hablas con ${asistente.nombre}, para convertir tu voz en texto. No se graba nada más.`}
          </Txt>
        </View>
      </View>
      <Button
        label={bloqueado ? 'Abrir ajustes' : 'Permitir micrófono'}
        size="md"
        variant={oscuro ? 'accent' : 'primary'}
        onPress={bloqueado ? onAbrirAjustes : onPedir}
      />
    </View>
  );
};
