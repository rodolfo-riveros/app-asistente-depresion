import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../../constants/colors';
import type { FaseVoz } from './fases';

interface OrbeVozProps {
  fase: FaseVoz;
  /** Factor de escala para pantallas bajas (1 = 260 px como el diseño). */
  escala?: number;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
}

const suave = Easing.inOut(Easing.sin);

/**
 * Orbe del modo voz: tres círculos concéntricos (260/200/140) y un núcleo
 * melocotón de 80 px que se mueve según la fase:
 * - esperando: respira despacio.
 * - grabando: pulsa más rápido y más amplio.
 * - transcribiendo / pensando: late suave y el aro interior se atenúa.
 * - hablando: ondula con un ritmo irregular, como la voz.
 * - silenciado: quieto y algo encogido.
 * - preparando / sinPermiso: quieto y atenuado hasta tener el micrófono.
 */
export const OrbeVoz: React.FC<OrbeVozProps> = ({
  fase,
  escala = 1,
  onPress,
  disabled,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const nucleo = useSharedValue(1);
  const aro = useSharedValue(1);
  const brillo = useSharedValue(0.55);

  useEffect(() => {
    cancelAnimation(nucleo);
    cancelAnimation(aro);
    cancelAnimation(brillo);

    switch (fase) {
      case 'grabando':
        nucleo.value = withRepeat(
          withSequence(
            withTiming(1.22, { duration: 520, easing: suave }),
            withTiming(0.98, { duration: 520, easing: suave })
          ),
          -1
        );
        aro.value = withRepeat(
          withSequence(
            withTiming(1.08, { duration: 780, easing: suave }),
            withTiming(1, { duration: 780, easing: suave })
          ),
          -1
        );
        brillo.value = withTiming(0.7, { duration: 300 });
        break;
      case 'transcribiendo':
      case 'pensando':
        nucleo.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 900, easing: suave }),
            withTiming(0.94, { duration: 900, easing: suave })
          ),
          -1
        );
        aro.value = withTiming(1, { duration: 400 });
        brillo.value = withRepeat(
          withSequence(
            withTiming(0.35, { duration: 900, easing: suave }),
            withTiming(0.6, { duration: 900, easing: suave })
          ),
          -1
        );
        break;
      case 'hablando':
        nucleo.value = withRepeat(
          withSequence(
            withTiming(1.14, { duration: 260, easing: suave }),
            withTiming(1.02, { duration: 200, easing: suave }),
            withTiming(1.18, { duration: 320, easing: suave }),
            withTiming(0.98, { duration: 280, easing: suave })
          ),
          -1
        );
        aro.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 640, easing: suave }),
            withTiming(0.99, { duration: 640, easing: suave })
          ),
          -1
        );
        brillo.value = withTiming(0.62, { duration: 300 });
        break;
      case 'preparando':
      case 'sinPermiso':
        nucleo.value = withTiming(0.92, { duration: 400 });
        aro.value = withTiming(1, { duration: 400 });
        brillo.value = withTiming(0.35, { duration: 400 });
        break;
      case 'silenciado':
        nucleo.value = withTiming(0.88, { duration: 400 });
        aro.value = withTiming(0.96, { duration: 400 });
        brillo.value = withTiming(0.3, { duration: 400 });
        break;
      case 'esperando':
      default:
        nucleo.value = withRepeat(
          withSequence(
            withTiming(1.08, { duration: 2200, easing: suave }),
            withTiming(0.97, { duration: 2200, easing: suave })
          ),
          -1
        );
        aro.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: 2200, easing: suave }),
            withTiming(1, { duration: 2200, easing: suave })
          ),
          -1
        );
        brillo.value = withTiming(0.55, { duration: 400 });
        break;
    }

    return () => {
      cancelAnimation(nucleo);
      cancelAnimation(aro);
      cancelAnimation(brillo);
    };
  }, [fase, nucleo, aro, brillo]);

  const estiloNucleo = useAnimatedStyle(() => ({ transform: [{ scale: nucleo.value }] }));
  const estiloAro = useAnimatedStyle(() => ({
    opacity: brillo.value,
    transform: [{ scale: aro.value }],
  }));

  const d1 = 260 * escala;
  const d2 = 200 * escala;
  const d3 = 140 * escala;
  const d4 = 80 * escala;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={{
        width: d1,
        height: d1,
        borderRadius: d1 / 2,
        backgroundColor: colors.voiceSurface,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          width: d2,
          height: d2,
          borderRadius: d2 / 2,
          backgroundColor: colors.voiceRing,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Animated.View
          style={[
            { width: d3, height: d3, borderRadius: d3 / 2, backgroundColor: colors.accent },
            estiloAro,
          ]}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: d4,
              height: d4,
              borderRadius: d4 / 2,
              backgroundColor: colors.accent,
            },
            estiloNucleo,
          ]}
        />
      </View>
    </Pressable>
  );
};
