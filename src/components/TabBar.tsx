import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '../constants/colors';
import { ANCHO_MAXIMO } from '../hooks/useLayout';
import { Icon, IconName } from './ui/Icon';
import { Txt } from './ui/Txt';

const tabs: Record<string, { label: string; icon: IconName }> = {
  InicioTab: { label: 'Inicio', icon: 'home' },
  RegistroTab: { label: 'Registro', icon: 'chart' },
  RecursosTab: { label: 'Recursos', icon: 'book' },
  PerfilTab: { label: 'Perfil', icon: 'user' },
};

/** Alto de la fila de pestañas (icono + etiqueta), igual en todos los teléfonos. */
const FILA = 54;
const PADDING_TOP = 6;
/** Margen inferior cuando el sistema no reserva nada abajo (Android sin edge-to-edge, web). */
const PADDING_BOTTOM_SIN_INSET = 12;

/**
 * Margen inferior según plataforma:
 * - iOS con home indicator (inset 34): el inset ya trae aire de sobra; se
 *   recorta un poco para quedar cerca de la barra nativa (49 + 34).
 * - Android con gestos (≈ 24) o con 3 botones (≈ 48): la barra del sistema se
 *   dibuja encima (edge-to-edge), así que se respeta el inset completo + 6.
 */
const paddingInferior = (inset: number) => {
  if (inset <= 0) return PADDING_BOTTOM_SIN_INSET;
  if (Platform.OS === 'ios') return Math.max(inset - 8, 8);
  return inset + 6;
};

/** Barra inferior blanca de 4 pestañas con borde superior fino (diseño Aliento). */
export const TabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const paddingBottom = paddingInferior(insets.bottom);

  return (
    <View
      style={{
        height: PADDING_TOP + FILA + paddingBottom,
        paddingTop: PADDING_TOP,
        paddingBottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
      }}>
      {/* En tablets las pestañas no se reparten por 800 px: fila centrada. */}
      <View
        accessibilityRole="tablist"
        style={{
          flex: 1,
          flexDirection: 'row',
          width: '100%',
          maxWidth: ANCHO_MAXIMO,
          alignSelf: 'center',
          paddingHorizontal: 12,
        }}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const tab = tabs[route.name];
          const tint = focused ? colors.ink : colors.inkSoft;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              android_ripple={{ color: colors.ripple, borderless: true, radius: FILA / 2 + 4 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Icon name={tab.icon} size={22} color={tint} strokeWidth={focused ? 2 : 1.8} />
              {/* Etiqueta de una palabra: no puede partir, así que se encoge con fuente grande. */}
              <Txt
                size={11.5}
                weight={focused ? 'bold' : 'regular'}
                color={tint}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                maxFontSizeMultiplier={1.25}>
                {tab.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
