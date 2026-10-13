import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, IconTile, IconName, Logo, Screen, Title, Txt } from '../../components/ui';
import { colors } from '../../constants/colors';
import { radius, sizes, spacing } from '../../constants/spacing';
import { asistente, lineaAyuda } from '../../constants/asistente';
import { useLayout } from '../../hooks/useLayout';
import type { RootScreenProps } from '../../navigation/types';
import { AmanecerIlustracion, Checkbox, llamarAyuda } from './components/AuthBits';

/** Cambia con cada arreglo para comprobar en el teléfono que llegó el código nuevo. */
const VERSION_PRUEBA = 'botones-v3 (sin NativeWind)';

const puntos: { icon: IconName; texto: string }[] = [
  { icon: 'lock', texto: 'Privado y cifrado. Tú decides qué se guarda.' },
  { icon: 'chat', texto: 'Escribe o habla por voz, como te sea más fácil.' },
  { icon: 'heart', texto: 'No reemplaza a un profesional: si lo necesitas, te conecta con uno.' },
];

/** Pantalla 1 · Bienvenida (sin sesión). */
export const WelcomeScreen: React.FC<RootScreenProps<'Bienvenida'>> = ({ navigation }) => {
  const [acepta, setAcepta] = useState(false);
  const [avisoConsentimiento, setAvisoConsentimiento] = useState(false);
  const { bajo, compacto, escala, fontScale } = useLayout();

  // En 375×667 / 360×640 la ilustración y los huecos se reducen para que todo
  // quepa sin desplazar con la fuente normal; con fuente grande, `scroll`.
  const ilustracion = bajo ? (fontScale > 1.1 ? 72 : 96) : compacto ? 140 : escala(184);
  const hueco = compacto ? 14 : 20;
  const pad = compacto ? 20 : spacing.screenForm;

  const empezar = () => {
    if (!acepta) {
      // En vez de un botón "muerto": se explica qué falta.
      setAvisoConsentimiento(true);
      return;
    }
    navigation.navigate('Register');
  };

  return (
    <Screen
      padding={0}
      gap={0}
      edges={['top', 'left', 'right', 'bottom']}
      contentStyle={{ paddingTop: 0, paddingBottom: 0 }}>
      {/* Contenido desplazable: en teléfonos bajos o con letra grande baja con scroll,
          pero las acciones de abajo quedan SIEMPRE visibles. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: pad,
          paddingTop: compacto ? 12 : 28,
          paddingBottom: 16,
          gap: hueco,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Cabecera */}
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
            {asistente.nombre} te escucha a cualquier hora y te ayuda a entender cómo te sientes,
            paso a paso.
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
      </ScrollView>

      {/* Pie fijo: consentimiento + acciones + ayuda */}
      <View
        style={{
          paddingHorizontal: pad,
          paddingTop: 10,
          paddingBottom: compacto ? 8 : 16,
          gap: compacto ? 8 : 10,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
          backgroundColor: colors.background,
        }}>
        <Checkbox
          checked={acepta}
          onChange={(v) => {
            setAcepta(v);
            if (v) setAvisoConsentimiento(false);
          }}
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

        {avisoConsentimiento && (
          <Txt size={12.5} color={colors.dangerInk} accessibilityLiveRegion="polite">
            Marca la casilla para aceptar los términos y continuar.
          </Txt>
        )}

        <Button
          label="Crear cuenta y empezar"
          iconRight="arrowRight"
          onPress={empezar}
          accessibilityHint={
            acepta ? 'Crea tu cuenta para empezar' : 'Primero acepta los términos y la privacidad'
          }
        />
        <Button
          label="Ya tengo cuenta · Iniciar sesión"
          variant="secondary"
          size="md"
          onPress={() => navigation.navigate('Login')}
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

        {/* Sólo en desarrollo: confirma qué versión del código está cargando el teléfono. */}
        {__DEV__ && (
          <Txt size={11} color={colors.inkSoft} align="center">
            versión de prueba · {VERSION_PRUEBA}
          </Txt>
        )}
      </View>
    </Screen>
  );
};
