import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Chip, Icon, IconButton, IconTile, Screen, Title, Txt } from '../../components/ui';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { fonts } from '../../constants/typography';
import { lineaAyuda } from '../../constants/asistente';
import type { TabScreenProps } from '../../navigation/types';
import { useLayout } from '../../hooks/useLayout';
import {
  Categoria,
  Recurso,
  categorias,
  coincide,
  ejercicios,
  etiquetaCategoria,
  guiaDepresion,
} from './contenido';
import { GuiaModal } from './components/GuiaModal';
import { llamar } from './enlaces';

/** Fondo del cuadro "play" de cada ejercicio, según su categoría. */
const fondoCategoria: Record<Categoria, string> = {
  respirar: colors.peachPale,
  ansiedad: colors.peachPale,
  dormir: colors.lavenderPale,
  animo: colors.sage,
};

/**
 * Ilustración de la tarjeta destacada: sol melocotón sobre una colina musgo.
 * Se dibuja en un `viewBox` de 110 y se escala con el ancho de la pantalla
 * (más pequeña en 360 px para dejar sitio al título con fuente grande).
 */
const Ilustracion: React.FC<{ tam: number }> = ({ tam }) => (
  <Svg
    width={tam}
    height={tam}
    viewBox="0 0 110 110"
    fill="none"
    style={{ flexShrink: 0, alignSelf: 'flex-end', marginBottom: -16, marginRight: -6 }}>
    <Circle cx={70} cy={80} r={46} fill={colors.accent} opacity={0.4} />
    <Circle cx={70} cy={80} r={28} fill={colors.accent} />
    <Path d="M0 96 C 30 84, 60 92, 110 86 V110 H0Z" fill={colors.moss} />
  </Svg>
);

/**
 * Fila o tarjeta pulsable con la respuesta nativa de cada sistema: onda
 * (`android_ripple`) recortada a las esquinas en Android, opacidad en iOS.
 */
const Pulsable: React.FC<{
  onPress: () => void;
  accessibilityLabel: string;
  bg: string;
  ripple: string;
  style: StyleProp<ViewStyle>;
  children: ReactNode;
}> = ({ onPress, accessibilityLabel, bg, ripple, style, children }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    android_ripple={{ color: ripple }}
    style={({ pressed }) => [
      { backgroundColor: bg, overflow: 'hidden' },
      style,
      Platform.OS === 'ios' && pressed && { opacity: 0.7 },
    ]}>
    {children}
  </Pressable>
);

/** Todos los recursos por id (para abrir uno desde un botón del chat). */
const porId = (id: string): Recurso | null =>
  [guiaDepresion, ...ejercicios].find((r) => r.id === id) ?? null;

export const RecursosScreen: React.FC<TabScreenProps<'RecursosTab'>> = ({ navigation, route }) => {
  const { escala, compacto } = useLayout();
  const [consulta, setConsulta] = useState('');
  const [categoria, setCategoria] = useState<Categoria | 'todo'>('todo');
  const [abierto, setAbierto] = useState<Recurso | null>(null);

  // `abrir` (desde el chat): abre esa guía. Se ajusta durante el render (estado
  // derivado de un parámetro) y luego se limpia el parámetro, así el mismo
  // recurso puede volver a abrirse más tarde desde otro mensaje.
  const pedido = route.params?.abrir;
  const [pedidoVisto, setPedidoVisto] = useState<string | undefined>(undefined);
  if (pedido !== pedidoVisto) {
    setPedidoVisto(pedido);
    const recurso = pedido ? porId(pedido) : null;
    if (recurso) setAbierto(recurso);
  }
  useEffect(() => {
    if (pedido) navigation.setParams({ abrir: undefined });
  }, [pedido, navigation]);

  const lista = useMemo(
    () => ejercicios.filter((e) => coincide(e, consulta, categoria)),
    [consulta, categoria]
  );
  const mostrarGuia = coincide(guiaDepresion, consulta, categoria);
  const sinResultados = lista.length === 0 && !mostrarGuia;

  const abrir = (r: Recurso) => {
    Keyboard.dismiss();
    setAbierto(r);
  };

  // Scroll propio (no el de `Screen`): el único campo está arriba, así que no
  // hace falta KeyboardAwareScrollView, y `on-drag` cierra el teclado al
  // desplazar también en Android (`interactive` sólo funciona en iOS). Tocar
  // una zona vacía lo cierra gracias a `keyboardShouldPersistTaps="handled"`.
  return (
    <Screen padding={0} gap={0} contentStyle={{ paddingTop: 0, paddingBottom: 0 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.screen,
          paddingTop: 24,
          paddingBottom: 24,
          gap: spacing.stack,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <Title>Recursos</Title>

        {/* Buscador */}
        <View style={{ justifyContent: 'center' }}>
          <TextInput
            value={consulta}
            onChangeText={setConsulta}
            onSubmitEditing={() => Keyboard.dismiss()}
            placeholder="Buscar ejercicios o guías"
            placeholderTextColor={colors.inkSoft}
            selectionColor={colors.forest}
            accessibilityLabel="Buscar ejercicios o guías"
            accessibilityRole="search"
            returnKeyType="search"
            enterKeyHint="search"
            inputMode="search"
            autoCorrect={false}
            autoCapitalize="none"
            autoComplete="off"
            maxLength={60}
            maxFontSizeMultiplier={1.35}
            style={{
              minHeight: 48,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              paddingLeft: 44,
              paddingRight: consulta ? 48 : 16,
              fontFamily: fonts.regular,
              fontSize: 15,
              color: colors.ink,
              // Android: sin el relleno propio de la fuente, el texto queda centrado como en iOS.
              paddingVertical: Platform.OS === 'android' ? 10 : 12,
              includeFontPadding: false,
              textAlignVertical: 'center',
            }}
          />
          <View pointerEvents="none" style={{ position: 'absolute', left: 16 }}>
            <Icon name="search" size={18} color={colors.inkSoft} strokeWidth={2} />
          </View>
          {consulta.length > 0 && (
            <IconButton
              name="close"
              iconSize={18}
              accessibilityLabel="Borrar búsqueda"
              onPress={() => setConsulta('')}
              style={{ position: 'absolute', right: 2 }}
            />
          )}
        </View>

        {/* Categorías */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -spacing.screen, flexGrow: 0 }}
          contentContainerStyle={{
            gap: 8,
            paddingHorizontal: spacing.screen,
            paddingVertical: 2,
            alignItems: 'center',
          }}
          // iOS: sin rebote lateral cuando las chips caben enteras (tablet).
          alwaysBounceHorizontal={false}
          // Android: sin el brillo de fin de scroll (no es nativo del diseño plano).
          overScrollMode="never">
          {categorias.map((c) => (
            <Chip
              key={c.id}
              label={c.etiqueta}
              selected={categoria === c.id}
              onPress={() => setCategoria(c.id)}
            />
          ))}
        </ScrollView>

        {/* Guía destacada */}
        {mostrarGuia && (
          <Pulsable
            onPress={() => abrir(guiaDepresion)}
            accessibilityLabel={`Guía de ${guiaDepresion.minutos} minutos: ${guiaDepresion.titulo}`}
            bg={colors.sage}
            ripple={colors.ripple}
            style={{
              minHeight: escala(compacto ? 116 : 128),
              borderRadius: radius.card,
              padding: 16,
              flexDirection: 'row',
              gap: 12,
            }}>
            <View style={{ flex: 1, justifyContent: 'space-between', gap: 10 }}>
              <Txt size={12} weight="bold" tracking={0.6} color={colors.forest}>
                {`GUÍA · ${guiaDepresion.minutos} MIN`}
              </Txt>
              <Txt size={18} weight="bold" leading={1.25} style={{ maxWidth: 240 }}>
                {guiaDepresion.titulo}
              </Txt>
            </View>
            <Ilustracion tam={escala(compacto ? 92 : 110)} />
          </Pulsable>
        )}

        {/* Ejercicios */}
        {lista.length > 0 && (
          <View style={{ gap: 8 }}>
            <Txt size={15} weight="semibold" accessibilityRole="header">
              Ejercicios
            </Txt>
            {lista.map((e) => (
              <Pulsable
                key={e.id}
                onPress={() => abrir(e)}
                accessibilityLabel={`${e.titulo}. ${etiquetaCategoria[e.categoria]}, ${e.minutos} minutos`}
                bg={colors.surface}
                ripple={colors.ripple}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 10,
                  minHeight: 64,
                  borderRadius: radius.lg,
                }}>
                <IconTile
                  name="play"
                  bg={fondoCategoria[e.categoria]}
                  color={colors.ink}
                  iconSize={16}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt size={14.5} weight="semibold">
                    {e.titulo}
                  </Txt>
                  <Txt size={12.5} color={colors.inkSoft}>
                    {`${etiquetaCategoria[e.categoria]} · ${e.minutos} min`}
                  </Txt>
                </View>
              </Pulsable>
            ))}
          </View>
        )}

        {/* Sin resultados */}
        {sinResultados && (
          <View
            accessibilityLiveRegion="polite"
            style={{
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
              padding: 20,
              alignItems: 'center',
              gap: 8,
            }}>
            <IconTile name="search" bg={colors.surfaceMuted} color={colors.inkSoft} />
            <Txt size={15} weight="semibold" align="center">
              No encontramos nada con esa búsqueda
            </Txt>
            <Txt size={13} color={colors.inkSoft} align="center" leading={1.4}>
              Prueba con otra palabra, como “dormir” o “calma”, o vuelve a ver todo.
            </Txt>
            <Pressable
              onPress={() => {
                setConsulta('');
                setCategoria('todo');
              }}
              accessibilityRole="button"
              hitSlop={8}
              style={{ minHeight: 44, justifyContent: 'center' }}>
              <Txt size={14} weight="semibold" color={colors.forest}>
                Ver todos los recursos
              </Txt>
            </Pressable>
          </View>
        )}

        {/* Ayuda profesional (siempre visible) */}
        <View style={{ gap: 8 }}>
          <Txt size={15} weight="semibold" accessibilityRole="header">
            Ayuda profesional
          </Txt>
          <Pulsable
            onPress={() => llamar(lineaAyuda.telefono)}
            accessibilityLabel={`Llamar a la ${lineaAyuda.etiqueta}. ${lineaAyuda.detalle}`}
            bg={colors.dangerBg}
            ripple={colors.ripple}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              minHeight: 60,
              borderRadius: radius.lg,
            }}>
            <Icon name="phone" size={22} color={colors.dangerInk} strokeWidth={2} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt size={14.5} weight="bold" color={colors.dangerInk}>
                {lineaAyuda.etiqueta}
              </Txt>
              <Txt size={12.5} color={colors.dangerInkSoft}>
                {lineaAyuda.detalle}
              </Txt>
            </View>
          </Pulsable>
          <Pulsable
            onPress={() => navigation.navigate('CrisisProtocol')}
            accessibilityLabel="Centros de salud mental cerca. Psicólogos y CSMC en tu zona"
            bg={colors.surface}
            ripple={colors.ripple}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              minHeight: 60,
              borderRadius: radius.lg,
            }}>
            <Icon name="pin" size={22} color={colors.forest} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt size={14.5} weight="semibold">
                Centros de salud mental cerca
              </Txt>
              <Txt size={12.5} color={colors.inkSoft}>
                Psicólogos y CSMC en tu zona
              </Txt>
            </View>
          </Pulsable>
        </View>
      </ScrollView>
      <GuiaModal recurso={abierto} onClose={() => setAbierto(null)} />
    </Screen>
  );
};
