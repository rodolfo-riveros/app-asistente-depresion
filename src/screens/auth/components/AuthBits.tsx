import React from 'react';
import { Alert, Linking, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import { Icon, Txt } from '../../../components/ui';
import { colors } from '../../../constants/colors';
import { radius, sizes } from '../../../constants/spacing';
import { lineaAyuda } from '../../../constants/asistente';

/* ------------------------------------------------------------ Utilidades */

/** Vibración corta de error (validación o fallo del servidor). Silenciosa si no hay hápticos. */
export const vibrarError = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
};

/**
 * Llama a la línea de ayuda. Si el dispositivo no puede marcar (tablet sin
 * SIM, simulador…), muestra el número para marcarlo a mano.
 */
export const llamarAyuda = async () => {
  try {
    await Linking.openURL(`tel:${lineaAyuda.telefono}`);
  } catch {
    Alert.alert(
      'No pudimos abrir el teléfono',
      `Marca ${lineaAyuda.telefono} desde cualquier teléfono (${lineaAyuda.etiqueta}). Es gratis y atiende las 24 horas.`
    );
  }
};

/* --------------------------------------------------------- Ilustración */

/**
 * Sol saliendo sobre dos colinas (Bienvenida). 184 px de alto en el diseño;
 * en teléfonos bajos la pantalla pasa una altura menor (con `slice` el SVG
 * recorta por arriba y el sol sigue apoyado en el horizonte).
 */
export const AmanecerIlustracion: React.FC<{ height?: number }> = ({ height = 184 }) => (
  <View
    accessible={false}
    importantForAccessibility="no-hide-descendants"
    style={{
      height,
      borderRadius: radius.hero,
      backgroundColor: colors.sage,
      overflow: 'hidden',
    }}>
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 342 184"
      preserveAspectRatio="xMidYMax slice"
      fill="none">
      <Circle cx={171} cy={150} r={78} fill={colors.accent} opacity={0.35} />
      <Circle cx={171} cy={150} r={52} fill={colors.accent} />
      <Path
        d="M0 140 C 70 108, 130 124, 190 136 S 300 120, 342 128 V184 H0Z"
        fill={colors.sageMid}
      />
      <Path d="M0 160 C 90 140, 170 168, 250 154 S 320 146, 342 152 V184 H0Z" fill={colors.moss} />
      <Circle cx={68} cy={46} r={3} fill={colors.background} />
      <Circle cx={270} cy={34} r={2.5} fill={colors.background} />
      <Circle cx={300} cy={70} r={2} fill={colors.background} />
    </Svg>
  </View>
);

/* ------------------------------------------------------------- Checkbox */

interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  accessibilityLabel: string;
  children: React.ReactNode;
}

/** Casilla 20×20 (tinta al marcar) con su texto; toda la fila es tocable (≥ 44 px). */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  accessibilityLabel,
  children,
}) => (
  <Pressable
    onPress={() => onChange(!checked)}
    accessibilityRole="checkbox"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ checked }}
    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: sizes.touch }}>
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: checked ? 0 : 1.5,
        borderColor: colors.inkSoft,
        backgroundColor: checked ? colors.ink : colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {checked && <Icon name="check" size={14} color={colors.onDark} strokeWidth={2.6} />}
    </View>
    <View style={{ flex: 1 }}>{children}</View>
  </Pressable>
);

/* ---------------------------------------------------- Medidor de fuerza */

export const PASSWORD_MIN = 6;

const niveles = ['Muy corta', 'Débil', 'Aceptable', 'Segura', 'Muy segura'] as const;

/** Puntuación 0–4 de una contraseña (longitud + variedad de caracteres). */
export const fuerzaContrasena = (pwd: string): number => {
  if (pwd.length < PASSWORD_MIN) return 0;
  let score = 1;
  if (pwd.length >= 10) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
  else if (/\d/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 0.5;
  return Math.min(4, Math.floor(score));
};

/** 4 segmentos de 4 px + texto "Segura · mínimo 6 caracteres". */
export const MedidorContrasena: React.FC<{ password: string }> = ({ password }) => {
  const score = fuerzaContrasena(password);
  const color = score <= 1 ? colors.dangerSolid : score === 2 ? colors.accent : colors.moss;
  const texto = password.length === 0 ? null : niveles[score];

  return (
    <View
      style={{ gap: 6 }}
      accessible
      accessibilityLabel={`Fuerza de la contraseña: ${texto ?? 'sin escribir'}. Mínimo ${PASSWORD_MIN} caracteres`}>
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i < score ? color : colors.border,
            }}
          />
        ))}
      </View>
      <Txt size={12} color={colors.inkSoft}>
        {texto ? `${texto} · ` : ''}mínimo {PASSWORD_MIN} caracteres
      </Txt>
    </View>
  );
};

/* ------------------------------------------------------- Enlace de pie */

/** "¿Ya tienes cuenta? Inicia sesión" — toda la línea es tocable. */
export const EnlacePie: React.FC<{ pregunta: string; accion: string; onPress: () => void }> = ({
  pregunta,
  accion,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="link"
    accessibilityLabel={`${pregunta} ${accion}`}
    style={({ pressed }) => ({
      minHeight: sizes.touch,
      justifyContent: 'center',
      opacity: pressed ? 0.7 : 1,
    })}>
    <Txt size={14} color={colors.inkSoft} align="center">
      {pregunta}{' '}
      <Txt size={14} weight="bold" color={colors.forest}>
        {accion}
      </Txt>
    </Txt>
  </Pressable>
);

/* ---------------------------------------------------- Error de servidor */

/** Aviso de error de la API (credenciales, red…), visible bajo el formulario. */
export const ErrorApi: React.FC<{ mensaje: string | null }> = ({ mensaje }) =>
  mensaje ? (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        backgroundColor: colors.dangerBg,
        borderRadius: radius.md,
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}>
      <Txt size={13.5} leading={1.4} color={colors.dangerInk}>
        {mensaje}
      </Txt>
    </View>
  ) : null;
