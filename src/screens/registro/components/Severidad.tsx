import React from 'react';
import { View } from 'react-native';
import { colors } from '../../../constants/colors';

/**
 * Niveles de la escala de Hamilton (HDRS-17, 0–52) tal como los devuelve el
 * backend. El diseño mostraba PHQ-9 con 5 tramos; aquí son 4 (ver Decisiones).
 */
export const NIVELES_HAMILTON = [
  { nivel: 'Sin depresión', frase: 'sin señales relevantes', hasta: 7 },
  { nivel: 'Depresión leve', frase: 'señales leves', hasta: 13 },
  { nivel: 'Depresión moderada', frase: 'señales moderadas', hasta: 18 },
  { nivel: 'Depresión severa', frase: 'señales severas', hasta: 52 },
] as const;

/** Índice del tramo: primero por el nivel del backend; si no lo reconoce, por puntaje. */
export const indiceNivel = (nivel: string | undefined, score: number): number => {
  const porNombre = NIVELES_HAMILTON.findIndex((n) => n.nivel === nivel);
  if (porNombre >= 0) return porNombre;
  const porScore = NIVELES_HAMILTON.findIndex((n) => score <= n.hasta);
  return porScore >= 0 ? porScore : NIVELES_HAMILTON.length - 1;
};

export const fraseNivel = (nivel: string | undefined, score: number): string =>
  NIVELES_HAMILTON[indiceNivel(nivel, score)].frase;

/** Tramos ya superados en verdes graduales; el actual en acento con anillo; el resto neutro. */
const PREVIOS = [colors.sage, colors.sageLight, colors.sageMid];

/** Barra segmentada de severidad con el tramo actual resaltado. */
export const SeveridadSegmentos: React.FC<{ nivel?: string; score: number }> = ({
  nivel,
  score,
}) => {
  const actual = indiceNivel(nivel, score);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Tramo ${actual + 1} de ${NIVELES_HAMILTON.length}: ${NIVELES_HAMILTON[actual].nivel}`}
      style={{ flexDirection: 'row', gap: 4, paddingVertical: 4, paddingHorizontal: 4 }}>
      {NIVELES_HAMILTON.map((n, i) => (
        <View
          key={n.nivel}
          style={[
            {
              flex: 1,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                i < actual ? PREVIOS[i] : i === actual ? colors.accent : colors.neutralPale,
            },
            i === actual && { outlineWidth: 2, outlineColor: colors.ink, outlineOffset: 2 },
          ]}
        />
      ))}
    </View>
  );
};
