import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button, IconTile, IconName, Logo, Screen, Title, Txt } from '../../components/ui';
import { colors } from '../../constants/colors';
import { radius, sizes, spacing } from '../../constants/spacing';
import { asistente, lineaAyuda } from '../../constants/asistente';
import { useLayout } from '../../hooks/useLayout';
import type { RootScreenProps } from '../../navigation/types';
import { AmanecerIlustracion, Checkbox, llamarAyuda } from './components/AuthBits';

const puntos: { icon: IconName; texto: string }[] = [
  { icon: 'lock', texto: 'Privado y cifrado. Tú decides qué se guarda.' },
  { icon: 'chat', texto: 'Escribe o habla por voz, como te sea más fácil.' },
  { icon: 'heart', texto: 'No reemplaza a un profesional: si lo necesitas, te conecta con uno.' },
];

/** Pantalla 1 · Bienvenida (sin sesión). */
export const WelcomeScreen: React.FC<RootScreenProps<'Bienvenida'>> = ({ navigation }) => {
  const [acepta, setAcepta] = useState(false);
  const { bajo, compacto, escala, fontScale } = useLayout();

  // En 375×667 / 360×640 la ilustración y los huecos se reducen para que todo
  // quepa sin desplazar con la fuente normal; con fuente grande, `scroll`.
  const ilustracion = bajo ? (fontScale > 1.1 ? 72 : 96) : compacto ? 140 : escala(184);
  const hueco = compacto ? 14 : 20;

  return (
    <Screen
      scroll
      padding={compacto ? 20 : spacing.screenForm}
      gap={hueco}
      edges={['top', 'left', 'right', 'bottom']}
      contentStyle={{ paddingTop: compacto ? 12 : 28, paddingBottom: compacto ? 12 : 24 }}>
      {/* Cabecera */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo />
        <Pressable
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
          hitSlop={4}
          style={({ pressed }) => ({
            minHeight: sizes.touch,
            paddingHorizontal: 4,
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}>
          <Txt size={14} weight="semibold">
            Iniciar sesión
          </Txt>
        </Pressable>
      </View>

      <AmanecerIlustracion height={ilustracion} />

      {/* Titular */}
      <View style={{ gap: compacto ? 6 : 10 }}>
        <Title size={bajo ? 28 : compacto ? 30 : 34} tracking={-0.8} leading={1.08}>
          {'Habla.\nAquí nadie te juzga.'}
        </Title>
        <Txt size={compacto ? 15 : 16} leading={1.45} color={colors.inkSoft}>
          {asistente.nombre} te escucha a cualquier hora y te ayuda a entender cómo te sientes, paso
          a paso.
        </Txt>
      </View>

      {/* Puntos clave */}
      <View style={{ gap: compacto ? 10 : 14 }}>
        {puntos.map((p) => (
          <View key={p.icon} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <IconTile
              name={p.icon}
              bg={colors.surface}
              size={compacto ? 36 : 40}
              iconSize={compacto ? 18 : 20}
              rounded={radius.sm}
            />
            <Txt size={compacto ? 14 : 15} leading={1.35} style={{ flex: 1 }}>
              {p.texto}
            </Txt>
          </View>
        ))}
      </View>

      {/* Consentimiento + CTA + ayuda */}
      <View style={{ marginTop: 'auto', gap: compacto ? 8 : 14 }}>
        <Checkbox
          checked={acepta}
          onChange={setAcepta}
          accessibilityLabel="Acepto los términos y la política de privacidad">
          <Txt size={13} color={colors.inkSoft}>
            Acepto los{' '}
            <Txt
              size={13}
              weight="semibold"
              color={colors.forest}
              accessibilityRole="link"
              suppressHighlighting
              onPress={() => navigation.navigate('Legal', { seccion: 'terminos' })}>
              términos
            </Txt>{' '}
            y la{' '}
            <Txt
              size={13}
              weight="semibold"
              color={colors.forest}
              accessibilityRole="link"
              suppressHighlighting
              onPress={() => navigation.navigate('Legal', { seccion: 'privacidad' })}>
              política de privacidad
            </Txt>
          </Txt>
        </Checkbox>

        <Button
          label="Empezar a conversar"
          iconRight="arrowRight"
          disabled={!acepta}
          onPress={() => navigation.navigate('Register')}
          accessibilityHint={
            acepta ? 'Crea tu cuenta para empezar' : 'Primero acepta los términos y la privacidad'
          }
        />

        <Pressable
          onPress={llamarAyuda}
          accessibilityRole="button"
          accessibilityLabel={`¿Estás en peligro? Llamar a la ${lineaAyuda.etiqueta}. Gratis, las 24 horas.`}
          style={({ pressed }) => ({
            minHeight: sizes.touch,
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}>
          <Txt size={12.5} leading={1.4} color={colors.inkSoft} align="center">
            ¿Estás en peligro? Llama a la{' '}
            <Txt size={12.5} weight="bold">
              {lineaAyuda.etiqueta}
            </Txt>
            . Gratis, las 24 horas.
          </Txt>
        </Pressable>
      </View>
    </Screen>
  );
};
