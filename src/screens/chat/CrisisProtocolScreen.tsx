import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Linking, Pressable, View } from 'react-native';
import * as Location from 'expo-location';
import { Button, Card, Icon, IconButton, IconTile, Screen, Title, Txt } from '../../components/ui';
import { colors } from '../../constants/colors';
import { radius, sizes } from '../../constants/spacing';
import { lineaAyuda } from '../../constants/asistente';
import type { RootScreenProps } from '../../navigation/types';
import { useLayout } from '../../hooks/useLayout';
import { CUSCO_HEALTH_CENTERS } from '../../services/location';
import { MentalHealthCenter } from '../../types/chat';
import { abrirMapa, copiarNumero, llamar } from '../recursos/enlaces';

type Coordenadas = { lat: number; lon: number };
/**
 * - `denegado`: dijo que no, pero se puede volver a preguntar.
 * - `bloqueado`: el sistema ya no muestra el diálogo → sólo desde Ajustes.
 * - `sin-senal`: permiso concedido pero el GPS está apagado o no responde.
 */
type EstadoUbicacion = 'inicial' | 'buscando' | 'lista' | 'denegado' | 'bloqueado' | 'sin-senal';

/** Sin red el GPS puede tardar mucho: pasado este plazo se usa la última posición conocida. */
const PLAZO_UBICACION_MS = 12000;

/** Resuelve `null` si la promesa no termina a tiempo (sin dejar el temporizador colgado). */
const conPlazo = <T,>(promesa: Promise<T>, ms: number): Promise<T | null> => {
  let id: ReturnType<typeof setTimeout> | undefined;
  const plazo = new Promise<null>((resolve) => {
    id = setTimeout(() => resolve(null), ms);
  });
  return Promise.race([promesa, plazo]).finally(() => clearTimeout(id));
};

/** Distancia en km entre dos puntos (fórmula del haversine). */
const distanciaKm = (a: Coordenadas, b: Coordenadas) => {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

const formatoKm = (km: number) =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;

const AVISOS_UBICACION: Partial<Record<EstadoUbicacion, string>> = {
  inicial:
    'Si lo permites, tu ubicación se usa sólo en este teléfono para ordenar los centros por cercanía. No se guarda ni se envía.',
  lista: 'Ordenados del más cercano al más lejano según tu ubicación.',
  denegado: 'Sin permiso de ubicación te mostramos la lista general de Cusco.',
  bloqueado:
    'El permiso de ubicación está desactivado para esta app. Puedes activarlo en Ajustes; mientras tanto, esta es la lista general de Cusco.',
  'sin-senal':
    'No pudimos obtener tu ubicación (revisa que el GPS esté encendido). Te mostramos la lista general de Cusco.',
};

/**
 * Protocolo de crisis. Es la pantalla más crítica: todo lo esencial (números,
 * centros, direcciones) es local y funciona sin conexión.
 */
export const CrisisProtocolScreen: React.FC<RootScreenProps<'CrisisProtocol'>> = ({
  navigation,
}) => {
  const { anchoContenido, fontScale } = useLayout();
  /**
   * Ancho "efectivo" con la fuente del sistema: en 360 px, o en cualquier
   * teléfono con fuente al 130 %, "Llamar al 113" + "Copiar" no caben en fila
   * → la llamada ocupa todo el ancho (un toque, sin cortes) y "Copiar" va debajo.
   */
  const apilar = anchoContenido / Math.min(Math.max(fontScale, 1), 1.35) < 380;
  const fila = apilar ? ('column' as const) : ('row' as const);
  const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null);
  const [estadoUbicacion, setEstadoUbicacion] = useState<EstadoUbicacion>('inicial');
  const buscando = estadoUbicacion === 'buscando';

  const centros = useMemo(() => {
    const base: (MentalHealthCenter & { km?: number })[] = CUSCO_HEALTH_CENTERS.map((c) => ({
      ...c,
      km:
        ubicacion && c.lat != null && c.lon != null
          ? distanciaKm(ubicacion, { lat: c.lat, lon: c.lon })
          : undefined,
    }));
    // Los que no tienen coordenadas verificadas van al final, sin distancia.
    return ubicacion ? base.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity)) : base;
  }, [ubicacion]);

  const pedirUbicacion = useCallback(async () => {
    setEstadoUbicacion('buscando');
    try {
      let permiso = await Location.getForegroundPermissionsAsync();
      if (!permiso.granted && permiso.canAskAgain) {
        permiso = await Location.requestForegroundPermissionsAsync();
      }
      if (!permiso.granted) {
        setEstadoUbicacion(permiso.canAskAgain ? 'denegado' : 'bloqueado');
        return;
      }
      const pos =
        (await conPlazo(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          PLAZO_UBICACION_MS
        )) ?? (await Location.getLastKnownPositionAsync());
      if (pos) {
        setUbicacion({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setEstadoUbicacion('lista');
      } else {
        setEstadoUbicacion('sin-senal');
      }
    } catch {
      // GPS apagado o servicio no disponible: la lista general sigue ahí.
      setEstadoUbicacion('sin-senal');
    }
  }, []);

  // Si la persona fue a Ajustes y activó el permiso, al volver se ordena sola.
  useEffect(() => {
    if (estadoUbicacion !== 'bloqueado') return;
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') return;
      Location.getForegroundPermissionsAsync()
        .then((permiso) => {
          if (permiso.granted) pedirUbicacion();
        })
        .catch(() => undefined);
    });
    return () => sub.remove();
  }, [estadoUbicacion, pedirUbicacion]);

  const abrirAjustes = () => {
    Linking.openSettings().catch(() => undefined);
  };

  const volver = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainApp');
  };

  const aviso = AVISOS_UBICACION[estadoUbicacion];

  return (
    <Screen scroll gap={14} edges={['top', 'left', 'right', 'bottom']}>
      {/* Cabecera */}
      <View style={{ marginLeft: -10 }}>
        <IconButton name="back" accessibilityLabel="Volver" onPress={volver} />
      </View>
      <View style={{ gap: 6 }}>
        <Title>Estamos contigo</Title>
        <Txt size={15} leading={1.45} color={colors.inkSoft}>
          Si estás pasando por un momento muy difícil, no tienes que atravesarlo en soledad. Estas
          líneas atienden gratis y con personas preparadas para escucharte.
        </Txt>
      </View>

      {/* Línea 113: la llamada principal, a un toque */}
      <Card tone="danger" gap={12}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconTile name="phone" bg={colors.surface} color={colors.dangerInk} strokeWidth={2} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt size={18} weight="bold" color={colors.dangerInk} accessibilityRole="header">
              {lineaAyuda.etiqueta}
            </Txt>
            <Txt size={12.5} color={colors.dangerInkSoft}>
              MINSA · Orientación psicológica, 24 horas
            </Txt>
          </View>
        </View>
        <Txt size={14} leading={1.45} color={colors.dangerInkSoft}>
          Servicio gratuito de escucha y contención emocional atendido por psicólogos del Estado.
          Marca 113 y elige la opción 5.
        </Txt>
        <View style={{ flexDirection: fila, gap: 8 }}>
          <Button
            label="Llamar al 113"
            icon="phone"
            size={apilar ? 'lg' : 'md'}
            grow={!apilar}
            accessibilityHint="Abre el teléfono con el 113. Luego elige la opción 5."
            onPress={() => llamar(lineaAyuda.telefono)}
          />
          <Button
            label="Copiar"
            icon="copy"
            variant="secondary"
            size="md"
            accessibilityHint="Copia el número 113"
            onPress={() => copiarNumero(lineaAyuda.telefono)}
          />
        </View>
      </Card>

      {/* SAMU 106 */}
      <Card gap={12}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconTile name="heart" bg={colors.peachPale} color={colors.ink} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt size={16} weight="bold" accessibilityRole="header">
              SAMU 106
            </Txt>
            <Txt size={12.5} color={colors.inkSoft}>
              Atención médica de urgencia · 24 horas
            </Txt>
          </View>
        </View>
        <Txt size={14} leading={1.45} color={colors.inkSoft}>
          Si tu vida o la de otra persona corre peligro ahora mismo, llama al 106 o acude a la
          emergencia más cercana.
        </Txt>
        <View style={{ flexDirection: fila, gap: 8 }}>
          <Button
            label="Llamar al 106"
            icon="phone"
            variant="outline"
            size="md"
            grow={!apilar}
            onPress={() => llamar('106')}
          />
          <Button
            label="Copiar"
            icon="copy"
            variant="outline"
            size="md"
            accessibilityHint="Copia el número 106"
            onPress={() => copiarNumero('106')}
          />
        </View>
      </Card>

      {/* Centros de salud mental */}
      <View style={{ gap: 8, marginTop: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Txt
            size={15}
            weight="semibold"
            accessibilityRole="header"
            style={{ flexGrow: 1, flexShrink: 1, flexBasis: 160 }}>
            Centros de salud mental en Cusco
          </Txt>
          <Pressable
            onPress={pedirUbicacion}
            disabled={buscando}
            accessibilityRole="button"
            accessibilityLabel="Usar mi ubicación para ordenar los centros por cercanía"
            accessibilityState={{ busy: buscando, disabled: buscando }}
            style={({ pressed }) => ({
              minHeight: sizes.touch,
              paddingHorizontal: 12,
              borderRadius: radius.full,
              backgroundColor: colors.sage,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              opacity: pressed || buscando ? 0.7 : 1,
            })}>
            <Icon name="pin" size={16} color={colors.forest} strokeWidth={2} />
            <Txt size={13} weight="semibold" color={colors.forest}>
              {buscando ? 'Buscando…' : 'Usar mi ubicación'}
            </Txt>
          </Pressable>
        </View>
        {aviso ? (
          <Txt size={12.5} color={colors.inkSoft} leading={1.4} accessibilityLiveRegion="polite">
            {aviso}
          </Txt>
        ) : null}
        {estadoUbicacion === 'bloqueado' && (
          <Button
            label="Abrir Ajustes"
            variant="outline"
            size="sm"
            accessibilityHint="Abre los ajustes de la app para activar la ubicación"
            onPress={abrirAjustes}
          />
        )}

        {centros.map((c) => (
          <Card key={c.id} rounded={radius.lg} gap={10}>
            <Txt size={15} weight="semibold">
              {c.nombre}
            </Txt>
            <View style={{ gap: 6 }}>
              <Fila icono="pin" texto={c.direccion} />
              <Fila icono="clock" texto={c.horario} />
              {c.km !== undefined && <Fila icono="arrowRight" texto={`A ${formatoKm(c.km)}`} />}
            </View>
            <View style={{ flexDirection: fila, gap: 8 }}>
              {c.telefono && (
                <Button
                  label={c.telefono as string}
                  icon="phone"
                  variant="outline"
                  size="sm"
                  grow={!apilar}
                  accessibilityHint={`Llama a ${c.nombre}`}
                  onPress={() => llamar(c.telefono as string)}
                />
              )}
              <Button
                label="Cómo llegar"
                icon="pin"
                variant="outline"
                size="sm"
                grow={!apilar}
                accessibilityHint={`Abre ${c.nombre} en Google Maps`}
                onPress={() => abrirMapa(c)}
              />
            </View>
          </Card>
        ))}
      </View>

      <Button label="Volver" variant="outline" onPress={volver} style={{ marginTop: 8 }} />
    </Screen>
  );
};

const Fila: React.FC<{ icono: 'pin' | 'clock' | 'arrowRight'; texto: string }> = ({
  icono,
  texto,
}) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
    {/* Arriba (no centrado): las direcciones largas ocupan 2–3 líneas con fuente grande. */}
    <View style={{ paddingTop: 1 }}>
      <Icon name={icono} size={16} color={colors.inkSoft} />
    </View>
    <Txt size={13} color={colors.inkSoft} leading={1.35} style={{ flex: 1 }}>
      {texto}
    </Txt>
  </View>
);
