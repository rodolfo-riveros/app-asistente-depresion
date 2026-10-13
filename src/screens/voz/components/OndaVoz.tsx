import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../../constants/colors';
import type { FaseVoz } from './fases';

/** Alturas de las 24 barras tal cual el diseño (px). */
const ALTURAS = [
  8, 14, 22, 30, 18, 36, 26, 12, 20, 34, 40, 28, 16, 24, 38, 30, 18, 10, 22, 32, 20, 14, 10, 6,
];
const ALTO = 40;
const MIN = 4 / ALTO;

/** Cuánto se mueve cada barra en cada fase (amplitud y velocidad). */
const RITMO: Record<FaseVoz, { alto: number; bajo: number; ms: number }> = {
  esperando: { alto: 0.55, bajo: 0.35, ms: 1400 },
  grabando: { alto: 1, bajo: 0.3, ms: 340 },
  transcribiendo: { alto: 0.35, bajo: 0.2, ms: 700 },
  pensando: { alto: 0.35, bajo: 0.2, ms: 700 },
  hablando: { alto: 0.9, bajo: 0.35, ms: 420 },
  silenciado: { alto: 0, bajo: 0, ms: 400 },
  preparando: { alto: 0, bajo: 0, ms: 400 },
  sinPermiso: { alto: 0, bajo: 0, ms: 400 },
};

/** Fases sin micrófono: las barras quedan planas. */
const PLANAS: FaseVoz[] = ['silenciado', 'preparando', 'sinPermiso'];

const Barra: React.FC<{ altura: number; indice: number; fase: FaseVoz }> = ({
  altura,
  indice,
  fase,
}) => {
  const factor = useSharedValue(altura / ALTO);

  useEffect(() => {
    cancelAnimation(factor);
    const base = altura / ALTO;
    const { alto, bajo, ms } = RITMO[fase];

    if (PLANAS.includes(fase)) {
      factor.value = withTiming(MIN, { duration: ms });
      return;
    }

    // Duración ligeramente distinta por barra para que no se muevan en bloque.
    const dur = ms + ((indice * 37) % 5) * 40;
    factor.value = withDelay(
      (indice % 6) * 60,
      withRepeat(
        withSequence(
          withTiming(Math.max(MIN, base * alto + (fase === 'grabando' ? 0.15 : 0)), {
            duration: dur,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(Math.max(MIN, base * bajo), {
            duration: dur,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1
      )
    );

    return () => cancelAnimation(factor);
  }, [fase, altura, indice, factor]);

  const estilo = useAnimatedStyle(() => ({ transform: [{ scaleY: Math.min(1, factor.value) }] }));

  return (
    <Animated.View
      style={[{ width: 4, height: ALTO, borderRadius: 2, backgroundColor: colors.sageMid }, estilo]}
    />
  );
};

/** 24 barras de onda que acompañan la fase de la conversación. */
export const OndaVoz: React.FC<{ fase: FaseVoz }> = ({ fase }) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={{ height: ALTO, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    {ALTURAS.map((h, i) => (
      <Barra key={i} altura={h} indice={i} fase={fase} />
    ))}
  </View>
);
