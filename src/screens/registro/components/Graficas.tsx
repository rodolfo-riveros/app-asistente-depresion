import React, { useState } from 'react';
import { LayoutChangeEvent, useWindowDimensions, View } from 'react-native';
import { Txt } from '../../../components/ui';
import { colors, moodScale } from '../../../constants/colors';
import type { EvaluacionResumen } from '../../../services/diagnostico';

/* ------------------------------------------------------- Ánimo semanal */

export interface DiaAnimo {
  dia: string;
  letra: string;
  valor: number | null;
}

const NOMBRES_DIA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Alto máximo de barra (diseño: 62; con las letras debajo la zona mide ~84). */
const ALTO_BARRA = 62;
const ALTO_SIN_DATO = 6;
/** Ancho máximo de una barra: en tablet las columnas no se vuelven bloques. */
const ANCHO_MAX_BARRA = 40;

/** `valor` 0–4 → proporción 0.2–1 (así "Muy mal" sigue siendo visible). */
const proporcion = (valor: number) => (valor + 1) / moodScale.length;

/** Mismos umbrales que el diseño: alto acento, medio salvia media, bajo salvia clara. */
const colorBarra = (v: number) =>
  v > 0.7 ? colors.accent : v > 0.42 ? colors.sageMid : colors.sageLight;

/** "29 sep – 5 oct" para la semana (lunes a domingo) que contiene `hoy`. */
export const rangoSemana = (hoy: Date = new Date()): string => {
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const fmt = (d: Date) => `${d.getDate()} ${MESES[d.getMonth()]}`;
  return `${fmt(lunes)} – ${fmt(domingo)}`;
};

/**
 * Frase resumen calculada sólo con lo registrado: cuántos días, el mejor y el
 * más difícil. Sin datos, invita a marcar el ánimo desde Inicio.
 */
export const resumenSemana = (dias: DiaAnimo[]): string => {
  const con = dias
    .map((d, i) => ({ ...d, nombre: NOMBRES_DIA[i] }))
    .filter((d): d is DiaAnimo & { nombre: string; valor: number } => d.valor != null);

  if (con.length === 0) {
    return 'Aún no has marcado cómo te sientes esta semana. Hazlo desde Inicio y aquí irás viendo tu semana.';
  }
  const etiqueta = (v: number) => (moodScale[v]?.label ?? 'sin registro').toLowerCase();
  if (con.length === 1) {
    const d = con[0];
    return `Esta semana marcaste tu ánimo un día: el ${d.nombre} te sentiste ${etiqueta(d.valor)}.`;
  }

  const mejor = con.reduce((a, b) => (b.valor > a.valor ? b : a));
  const peor = con.reduce((a, b) => (b.valor < a.valor ? b : a));
  const base = `Marcaste tu ánimo ${con.length} de 7 días.`;
  if (mejor.valor === peor.valor) {
    return `${base} Te has sentido ${etiqueta(mejor.valor)} de forma bastante pareja.`;
  }
  return `${base} El ${mejor.nombre} fue tu mejor día (${etiqueta(mejor.valor)}) y el ${peor.nombre}, el más difícil (${etiqueta(peor.valor)}).`;
};

/**
 * Ancho real de la gráfica (medido con `onLayout`). Hasta medirlo es `null` y
 * las barras ocupan su columna; después se limitan su ancho y el hueco.
 */
const useAnchoMedido = () => {
  const [ancho, setAncho] = useState<number | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    setAncho((prev) => (prev === w ? prev : w));
  };
  return { ancho, onLayout };
};

/** Hueco entre columnas proporcional al ancho de cada una (4–12 px). */
const huecoPara = (ancho: number | null, columnas: number) =>
  ancho == null ? 8 : Math.max(4, Math.min(12, Math.round(ancho / columnas / 5)));

/**
 * 7 barras verticales de lunes a domingo. Días sin dato: barra mínima neutra.
 * La zona de barras tiene alto fijo y las letras van debajo en flujo normal:
 * con la fuente del sistema al 130 % crecen hacia abajo, no sobre las barras.
 */
export const BarrasSemana: React.FC<{ dias: DiaAnimo[] }> = ({ dias }) => {
  const { ancho, onLayout } = useAnchoMedido();
  const n = Math.max(dias.length, 1);
  const gap = huecoPara(ancho, n);
  const columna = ancho != null ? (ancho - gap * (n - 1)) / n : null;
  const anchoBarra = columna != null ? Math.min(columna, ANCHO_MAX_BARRA) : undefined;

  return (
    <View
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Ánimo de la semana: ${dias
        .map(
          (d, i) =>
            `${NOMBRES_DIA[i]} ${d.valor != null ? (moodScale[d.valor]?.label ?? 'sin registro') : 'sin registro'}`
        )
        .join(', ')}`}
      style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap, alignItems: 'flex-end', height: ALTO_BARRA }}>
        {dias.map((d) => {
          const v = d.valor != null ? proporcion(d.valor) : null;
          return (
            <View key={d.dia} style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: anchoBarra ?? '100%',
                  borderRadius: 10,
                  height: v != null ? Math.round(v * ALTO_BARRA) : ALTO_SIN_DATO,
                  backgroundColor: v != null ? colorBarra(v) : colors.neutralPale,
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap }}>
        {dias.map((d) => (
          <Txt
            key={d.dia}
            size={12}
            color={colors.inkSoft}
            align="center"
            numberOfLines={1}
            style={{ flex: 1 }}>
            {d.letra}
          </Txt>
        ))}
      </View>
    </View>
  );
};

/* ------------------------------------------------- Evolución Hamilton */

const ALTO_EVOLUCION = 96;

export const fechaBreve = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
};

/**
 * Ancho aproximado de "12 oct" (11.5 px) con la fuente del sistema. Si la
 * columna es más estrecha (8 evaluaciones en 360 px, o fuente al 130 %), la
 * fecha se parte en dos líneas (día / mes) en vez de cortarse con "…".
 */
const anchoFecha = (fontScale: number) => 11.5 * 3.4 * Math.min(fontScale, 1.35);

/** Columnas con el puntaje de cada evaluación; la última resaltada en acento. */
export const GraficaEvolucion: React.FC<{ evaluaciones: EvaluacionResumen[] }> = ({
  evaluaciones,
}) => {
  const { fontScale } = useWindowDimensions();
  const { ancho, onLayout } = useAnchoMedido();
  const n = Math.max(evaluaciones.length, 1);
  const gap = huecoPara(ancho, n);
  const columna = ancho != null ? (ancho - gap * (n - 1)) / n : null;
  const fechaEnDosLineas = columna != null && columna < anchoFecha(fontScale);
  const maximo = Math.max(...evaluaciones.map((e) => e.score), 1);

  return (
    <View
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Evolución del puntaje: ${evaluaciones
        .map((e) => `${fechaBreve(e.fecha)} ${e.score} puntos`)
        .join(', ')}`}
      style={{ flexDirection: 'row', gap, alignItems: 'flex-end' }}>
      {evaluaciones.map((e, i) => {
        const ultima = i === evaluaciones.length - 1;
        const fecha = fechaBreve(e.fecha);
        const [dia, mes] = fecha.split(' ');
        return (
          <View key={`${e.fecha}-${i}`} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <Txt
              size={12}
              weight={ultima ? 'semibold' : 'regular'}
              color={colors.inkSoft}
              numberOfLines={1}>
              {e.score}
            </Txt>
            <View
              style={{
                width: '100%',
                maxWidth: 36,
                borderRadius: 10,
                height: Math.max(6, Math.round((e.score / maximo) * ALTO_EVOLUCION)),
                backgroundColor: ultima ? colors.accent : colors.sageLight,
              }}
            />
            {fechaEnDosLineas && mes ? (
              <View style={{ alignItems: 'center' }}>
                <Txt size={11.5} color={colors.inkSoft} numberOfLines={1}>
                  {dia}
                </Txt>
                <Txt size={11.5} color={colors.inkSoft} numberOfLines={1}>
                  {mes}
                </Txt>
              </View>
            ) : (
              <Txt size={11.5} color={colors.inkSoft} numberOfLines={1}>
                {fecha}
              </Txt>
            )}
          </View>
        );
      })}
    </View>
  );
};
