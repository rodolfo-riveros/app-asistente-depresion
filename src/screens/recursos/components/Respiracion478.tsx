import React, { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Button, Txt } from '../../../components/ui';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/spacing';
import { useLayout } from '../../../hooks/useLayout';
import { toqueLigero } from '../enlaces';

const FASES = [
  { etiqueta: 'Inhala', detalle: 'por la nariz', segundos: 4 },
  { etiqueta: 'Retén', detalle: 'el aire', segundos: 7 },
  { etiqueta: 'Exhala', detalle: 'por la boca', segundos: 8 },
] as const;

const CICLOS = 4;
const ESCALA_MIN = 0.55;
/** Diámetro del diseño; se ajusta con `useLayout` (más pequeño en 360×640, algo mayor en tablet). */
const DIAMETRO_BASE = 200;

interface Estado {
  fase: number;
  restante: number;
  ciclo: number;
}

/**
 * Temporizador guiado 4-7-8: el círculo crece al inhalar, se queda quieto al
 * retener y se encoge al exhalar. Cuatro ciclos y se detiene solo.
 *
 * Se detiene al cerrar la hoja (`activo = false`), al pasar la app a segundo
 * plano y al desmontarse; sólo hay un `setTimeout` vivo a la vez y siempre se
 * limpia. Un toque háptico ligero marca cada cambio de fase, para poder
 * seguirlo con los ojos cerrados.
 */
export const Respiracion478: React.FC<{ activo?: boolean }> = ({ activo = true }) => {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [terminado, setTerminado] = useState(false);
  const escala = useSharedValue(ESCALA_MIN);
  const reducirMovimiento = useReducedMotion();
  const { escala: escalar, compacto, tablet } = useLayout();
  const diametro = tablet ? 232 : escalar(compacto ? 172 : DIAMETRO_BASE);

  // Hoja cerrándose: se detiene ya, sin esperar a que se desmonte.
  if (!activo && estado) setEstado(null);

  // En segundo plano los temporizadores se congelan o se desfasan: mejor parar.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') setEstado(null);
    });
    return () => sub.remove();
  }, []);

  // Avanza un segundo cada vez.
  useEffect(() => {
    if (!estado) return;
    const t = setTimeout(() => {
      if (estado.restante > 1) {
        setEstado({ ...estado, restante: estado.restante - 1 });
        return;
      }
      const siguiente = estado.fase + 1;
      if (siguiente < FASES.length) {
        toqueLigero();
        setEstado({ ...estado, fase: siguiente, restante: FASES[siguiente].segundos });
      } else if (estado.ciclo < CICLOS) {
        toqueLigero();
        setEstado({ fase: 0, restante: FASES[0].segundos, ciclo: estado.ciclo + 1 });
      } else {
        toqueLigero();
        setEstado(null);
        setTerminado(true);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [estado]);

  // Anima el círculo al cambiar de fase.
  const fase = estado?.fase;
  const ciclo = estado?.ciclo;
  useEffect(() => {
    if (fase === undefined) {
      escala.value = withTiming(ESCALA_MIN, { duration: 600 });
      return;
    }
    if (reducirMovimiento) return;
    if (fase === 0) {
      escala.value = withTiming(1, {
        duration: FASES[0].segundos * 1000,
        easing: Easing.inOut(Easing.ease),
      });
    } else if (fase === 2) {
      escala.value = withTiming(ESCALA_MIN, {
        duration: FASES[2].segundos * 1000,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [fase, ciclo, escala, reducirMovimiento]);

  useEffect(() => () => cancelAnimation(escala), [escala]);

  const estiloCirculo = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  const empezar = () => {
    setTerminado(false);
    setEstado({ fase: 0, restante: FASES[0].segundos, ciclo: 1 });
  };
  const detener = () => setEstado(null);

  const actual = estado ? FASES[estado.fase] : null;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        padding: 20,
        alignItems: 'center',
        gap: 16,
      }}>
      <View
        style={{
          width: diametro,
          height: diametro,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessible
        accessibilityRole="timer"
        accessibilityLiveRegion="polite"
        accessibilityLabel={
          actual
            ? `${actual.etiqueta} ${actual.detalle}, ${estado?.restante} segundos. Ciclo ${estado?.ciclo} de ${CICLOS}`
            : terminado
              ? 'Ejercicio terminado'
              : 'Temporizador de respiración detenido'
        }>
        <View
          style={{
            position: 'absolute',
            width: diametro,
            height: diametro,
            borderRadius: diametro / 2,
            backgroundColor: colors.peachPale,
          }}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: diametro,
              height: diametro,
              borderRadius: diametro / 2,
              backgroundColor: colors.peachSoft,
            },
            estiloCirculo,
          ]}
        />
        {actual ? (
          <View style={{ alignItems: 'center' }}>
            <Txt size={22} weight="bold" tracking={-0.3} maxFontSizeMultiplier={1.2}>
              {actual.etiqueta}
            </Txt>
            <Txt
              size={compacto ? 36 : 40}
              weight="bold"
              tracking={-1}
              color={colors.inkOnAccent}
              maxFontSizeMultiplier={1.2}>
              {estado?.restante}
            </Txt>
            <Txt size={12.5} color={colors.inkSoft}>
              {actual.detalle}
            </Txt>
          </View>
        ) : (
          <Txt
            size={15}
            weight="semibold"
            align="center"
            maxFontSizeMultiplier={1.2}
            style={{ maxWidth: diametro * 0.7 }}>
            {terminado ? 'Bien hecho. Respira normal un momento.' : '4 · 7 · 8'}
          </Txt>
        )}
      </View>

      <Txt size={13} color={colors.inkSoft} align="center">
        {estado
          ? `Ciclo ${estado.ciclo} de ${CICLOS}`
          : 'Inhala 4 · retén 7 · exhala 8. Cuatro ciclos.'}
      </Txt>

      {estado ? (
        <Button label="Detener" variant="outline" size="md" icon="stop" onPress={detener} />
      ) : (
        <Button
          label={terminado ? 'Repetir' : 'Empezar'}
          size="md"
          icon={terminado ? 'refresh' : 'play'}
          onPress={empezar}
        />
      )}
    </View>
  );
};
