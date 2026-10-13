import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { radius } from '../constants/spacing';
import { asistente } from '../constants/asistente';
import { useLayout } from '../hooks/useLayout';
import { Button, IconTile, Txt } from './ui';

interface PermisoUbicacionProps {
  estado: 'pendiente' | 'bloqueado';
  onPedir: () => void;
  onAbrirAjustes: () => void;
  /** Si se pasa, muestra "Ahora no". */
  onCerrar?: () => void;
  /** `sage` para un aviso más discreto; `white` por defecto. */
  tono?: 'white' | 'sage';
  /** Ocupado mientras se muestra el diálogo del sistema. */
  ocupado?: boolean;
}

/**
 * Explica para qué es la ubicación antes del diálogo del sistema. Si el
 * permiso quedó bloqueado, lleva a Ajustes. Mostrar sólo en `pendiente`/`bloqueado`.
 */
export const PermisoUbicacion: React.FC<PermisoUbicacionProps> = ({
  estado,
  onPedir,
  onAbrirAjustes,
  onCerrar,
  tono = 'white',
  ocupado = false,
}) => {
  const bloqueado = estado === 'bloqueado';
  const sage = tono === 'sage';
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
          name="pin"
          bg={sage ? colors.surface : colors.sage}
          color={colors.forest}
          rounded={22}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={15} weight="semibold" accessibilityRole="header">
            {bloqueado ? 'La ubicación está desactivada' : 'Centros de ayuda cerca de ti'}
          </Txt>
          <Txt size={13} leading={1.4} color={sage ? colors.inkOnSage : colors.inkSoft}>
            {bloqueado
              ? `Para recomendarte los centros de salud mental más cercanos a ti, actívala en Ajustes › Ubicación y vuelve aquí.`
              : `Para recomendarte los centros de salud mental más cercanos a ti, ${asistente.nombre} necesita saber dónde estás mientras usas la app. No se comparte con nadie.`}
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
            accessibilityHint="Puedes activarla más tarde desde tu perfil"
          />
        )}
        <Button
          label={bloqueado ? 'Abrir ajustes' : 'Permitir'}
          size="md"
          grow={!apilar}
          loading={ocupado}
          onPress={bloqueado ? onAbrirAjustes : onPedir}
          accessibilityHint={
            bloqueado
              ? 'Abre los ajustes del teléfono para activar la ubicación'
              : 'Muestra el aviso del sistema para permitir la ubicación'
          }
        />
      </View>
    </View>
  );
};

interface PermisoUbicacionHojaProps extends Omit<PermisoUbicacionProps, 'onCerrar' | 'tono'> {
  visible: boolean;
  onCerrar: () => void;
}

/**
 * La misma tarjeta como hoja inferior sobre el fondo oscurecido (Inicio tras
 * crear la cuenta, y Chat cuando el backend pide la ubicación).
 */
export const PermisoUbicacionHoja: React.FC<PermisoUbicacionHojaProps> = ({
  visible,
  onCerrar,
  ...tarjeta
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCerrar}>
      <View style={{ flex: 1, backgroundColor: colors.scrim, paddingTop: insets.top }}>
        {/* Tocar fuera = "Ahora no". */}
        <Pressable
          style={{ flex: 1 }}
          onPress={onCerrar}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
        <ScrollView
          bounces={false}
          style={{ flexGrow: 0, flexShrink: 1 }}
          contentContainerStyle={{
            alignItems: 'center',
            paddingLeft: insets.left + 16,
            paddingRight: insets.right + 16,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
          }}>
          <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 480 }}>
            <PermisoUbicacion {...tarjeta} onCerrar={onCerrar} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
