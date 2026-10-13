import React from 'react';
import { View } from 'react-native';
import { HamiltonResult } from '../types/chat';
import { colors } from '../constants/colors';
import { formatters } from '../utils/formatters';
import { SCORE_MAXIMO } from '../services/diagnostico';
import { Card, Divider, Txt } from './ui';
import { fraseNivel, SeveridadSegmentos } from '../screens/registro/components/Severidad';

interface ResultCardProps {
  resultado: HamiltonResult;
}

/** Resultado de una evaluación Hamilton con el estilo Aliento (tarjeta blanca plana). */
export const ResultCard: React.FC<ResultCardProps> = ({ resultado }) => (
  <Card gap={14}>
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
      }}>
      <Txt size={15} weight="semibold">
        Chequeo de ánimo
      </Txt>
      <View
        style={{
          backgroundColor: colors.sage,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          maxWidth: '100%',
        }}>
        <Txt size={12} weight="semibold" color={colors.forest}>
          Hamilton · {resultado.nivel}
        </Txt>
      </View>
    </View>

    <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
      {/* La cifra grande escala poco con la fuente del sistema: el texto de al lado sí. */}
      <Txt
        size={40}
        weight="bold"
        tracking={-1}
        maxFontSizeMultiplier={1.2}
        style={{ lineHeight: 44 }}>
        {resultado.score}
      </Txt>
      <Txt size={14} color={colors.inkSoft} style={{ flexShrink: 1 }}>
        de {SCORE_MAXIMO} · {fraseNivel(resultado.nivel, resultado.score)}
      </Txt>
    </View>

    <SeveridadSegmentos nivel={resultado.nivel} score={resultado.score} />

    {resultado.fecha ? (
      <Txt size={12.5} color={colors.inkSoft}>
        {formatters.formatDate(resultado.fecha)}
      </Txt>
    ) : null}

    {resultado.interpretacion ? (
      <>
        <Divider />
        <View style={{ gap: 6 }}>
          <Txt size={14} weight="semibold">
            Qué significa
          </Txt>
          <Txt size={14} color={colors.inkSoft} leading={1.45}>
            {resultado.interpretacion}
          </Txt>
        </View>
      </>
    ) : null}

    {resultado.recomendaciones?.length ? (
      <>
        <Divider />
        <View style={{ gap: 10 }}>
          <Txt size={14} weight="semibold">
            Recomendaciones
          </Txt>
          {resultado.recomendaciones.map((rec, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  marginTop: 6,
                  backgroundColor: colors.moss,
                  flexShrink: 0,
                }}
              />
              <Txt size={14} leading={1.4} style={{ flex: 1 }}>
                {rec}
              </Txt>
            </View>
          ))}
        </View>
      </>
    ) : null}

    <Txt size={12.5} color={colors.inkSoft} leading={1.4}>
      Es una orientación, no un diagnóstico. Solo un profesional puede evaluarte.
    </Txt>
  </Card>
);
