import React from 'react';
import { View } from 'react-native';
import { colors } from '../../../constants/colors';
import { Txt } from '../../../components/ui';

/** Minutos sin mensajes a partir de los cuales se vuelve a poner la hora. */
const PAUSA_MIN = 60;

const mismoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const hora = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** "Hoy · 23:14", "Ayer · 08:02" o "12 oct · 19:40". */
export const etiquetaFecha = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);

  let dia: string;
  if (mismoDia(d, hoy)) dia = 'Hoy';
  else if (mismoDia(d, ayer)) dia = 'Ayer';
  else {
    dia = d
      .toLocaleDateString('es-PE', {
        day: 'numeric',
        month: 'short',
        ...(d.getFullYear() !== hoy.getFullYear() ? { year: 'numeric' } : {}),
      })
      .replace('.', '');
  }
  return `${dia} · ${hora(d)}`;
};

/** ¿Hay que poner un separador antes de este mensaje? */
export const necesitaSeparador = (actual: string, anterior?: string): boolean => {
  if (!anterior) return true;
  const a = new Date(actual);
  const b = new Date(anterior);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;
  return !mismoDia(a, b) || a.getTime() - b.getTime() >= PAUSA_MIN * 60_000;
};

export const SeparadorFecha: React.FC<{ etiqueta: string }> = ({ etiqueta }) => (
  <View
    style={{
      alignSelf: 'center',
      backgroundColor: colors.surfaceMuted,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 10,
    }}>
    <Txt size={12} color={colors.inkSoft}>
      {etiqueta}
    </Txt>
  </View>
);
