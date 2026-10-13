import React from 'react';
import { View } from 'react-native';
import { colors } from '../constants/colors';
import { radius } from '../constants/spacing';
import { asistente } from '../constants/asistente';
import { cadaFranja } from '../services/recordatorio';
import { Button, IconTile, Txt } from './ui';
import { useLayout } from '../hooks/useLayout';

interface PermisoNotificacionesProps {
  estado: 'pendiente' | 'bloqueado';
  /** Hora del recordatorio (`HH:mm`) para decir "cada noche" / "cada mañana". */
  hora: string;
  onPedir: () => void;
  onAbrirAjustes: () => void;
  /** Si se pasa, muestra "Ahora no" (aviso descartable en Inicio). */
  onCerrar?: () => void;
  /** `sage` para un aviso más discreto; `white` por defecto. */
  tono?: 'white' | 'sage';
}

/**
 * Explica para qué son las notificaciones antes del diálogo del sistema. Si el
 * permiso quedó bloqueado, lleva a Ajustes. Mostrar sólo en `pendiente`/`bloqueado`.
 */
export const PermisoNotificaciones: React.FC<PermisoNotificacionesProps> = ({
  estado,
  hora,
  onPedir,
  onAbrirAjustes,
  onCerrar,
  tono = 'white',
}) => {
  const bloqueado = estado === 'bloqueado';
  const sage = tono === 'sage';
  const cada = cadaFranja(hora);
  // Teléfono estrecho + fuente grande: los dos botones no caben en fila sin cortar.
  const { compacto, fontScale } = useLayout();
  const apilar = compacto && fontScale > 1.15;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        width: '100%',
        borderRadius: radius.card,
        padding: 16,
        gap: 12,
        backgroundColor: sage ? colors.sage : colors.surface,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconTile
          name="clock"
          bg={sage ? colors.surface : colors.sage}
          color={colors.forest}
          rounded={22}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={15} weight="semibold">
            {bloqueado ? 'Las notificaciones están desactivadas' : 'Recordatorio diario'}
          </Txt>
          <Txt size={13} leading={1.4} color={sage ? colors.inkOnSage : colors.inkSoft}>
            {bloqueado
              ? `Para que ${asistente.nombre} te pregunte cómo estás ${cada}, actívalas en Ajustes › Notificaciones y vuelve aquí.`
              : `Para que ${asistente.nombre} te pregunte cómo estás ${cada}, necesito permiso para enviarte una notificación. Solo una al día, a la hora que elijas.`}
          </Txt>
        </View>
      </View>
      <View style={{ flexDirection: apilar ? 'column-reverse' : 'row', gap: 8 }}>
        {onCerrar && (
          <Button
            label="Ahora no"
            size="md"
            variant="ghost"
            onPress={onCerrar}
            accessibilityHint="Oculta este aviso"
          />
        )}
        <Button
          label={bloqueado ? 'Abrir ajustes' : 'Permitir'}
          size="md"
          grow={!apilar}
          onPress={bloqueado ? onAbrirAjustes : onPedir}
          accessibilityHint={
            bloqueado
              ? 'Abre los ajustes del teléfono para activar las notificaciones'
              : 'Muestra el aviso del sistema para permitir notificaciones'
          }
        />
      </View>
    </View>
  );
};
