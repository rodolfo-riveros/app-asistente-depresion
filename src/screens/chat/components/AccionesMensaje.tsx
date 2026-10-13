import React, { ReactNode } from 'react';
import { Alert, Linking, Platform, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Icon, IconName, IconTile, Txt } from '../../../components/ui';
import { ContactoConfianza } from '../../../components/ContactoConfianza';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/spacing';
import { useLayout } from '../../../hooks/useLayout';
import { llamar, toqueLigero } from '../../recursos/enlaces';
import type { Accion } from '../../../types/chat';

/**
 * Botones que la asistente adjunta a una respuesta (v4, "Chat como amiga"):
 * música (Spotify / YouTube Music), recursos de la app, centros de salud
 * mental, búsqueda en Google Maps, llamadas y actividades.
 *
 * Todos los enlaces externos van con `openURL` + `catch` (sin `canOpenURL`,
 * que da falsos negativos sin declarar esquemas) y un Alert amable si fallan.
 */

/** Abre un enlace externo; si el teléfono no puede, lo explica con calma. */
const abrirEnlace = async (url: string, queAbre: string) => {
  toqueLigero();
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      `No se pudo abrir ${queAbre}`,
      'Puede que la app no esté instalada o que no haya conexión. Inténtalo de nuevo en un momento.'
    );
  }
};

const textoDistancia = (km?: number | null) => {
  if (km === null || km === undefined) return null;
  if (km < 1) return `A ${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  return `A ${km.toFixed(km < 10 ? 1 : 0).replace('.', ',')} km`;
};

/* --------------------------------------------------------------- piezas */

/** Fila tocable: onda en Android (recortada al radio), opacidad en iOS. ≥ 56 px. */
const FilaAccion: React.FC<{
  icono: IconName;
  fondoIcono: string;
  titulo: string;
  detalle: string;
  onPress: () => void;
  hint: string;
}> = ({ icono, fondoIcono, titulo, detalle, onPress, hint }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${titulo}. ${detalle}`}
    accessibilityHint={hint}
    android_ripple={{ color: colors.ripple }}
    style={({ pressed }) => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 56,
      paddingVertical: 8,
      paddingLeft: 8,
      paddingRight: 12,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.divider,
      opacity: Platform.OS === 'ios' && pressed ? 0.7 : 1,
    })}>
    <IconTile
      name={icono}
      bg={fondoIcono}
      color={colors.ink}
      size={40}
      rounded={12}
      iconSize={18}
    />
    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
      <Txt size={14} weight="semibold" numberOfLines={2}>
        {titulo}
      </Txt>
      <Txt size={12.5} color={colors.inkSoft} numberOfLines={2}>
        {detalle}
      </Txt>
    </View>
    <Icon name="chevronRight" size={16} color={colors.inkSoft} strokeWidth={2} />
  </Pressable>
);

/** Tarjeta con cabecera y botones en píldora (música, centros). */
const TarjetaAccion: React.FC<{
  icono: IconName;
  fondoIcono: string;
  titulo: string;
  detalle?: string | null;
  children: ReactNode;
}> = ({ icono, fondoIcono, titulo, detalle, children }) => (
  <View
    style={{
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.divider,
      padding: 12,
      gap: 10,
    }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <IconTile
        name={icono}
        bg={fondoIcono}
        color={colors.ink}
        size={40}
        rounded={12}
        iconSize={18}
      />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Txt size={14} weight="semibold" numberOfLines={3}>
          {titulo}
        </Txt>
        {detalle ? (
          <Txt size={12.5} color={colors.inkSoft} leading={1.35} numberOfLines={3}>
            {detalle}
          </Txt>
        ) : null}
      </View>
    </View>
    {children}
  </View>
);

/** Botones de la tarjeta: en fila; apilados en 360 px o con fuente grande. */
const Botones: React.FC<{ apilar: boolean; children: ReactNode }> = ({ apilar, children }) => (
  <View style={{ flexDirection: apilar ? 'column' : 'row', gap: 8 }}>{children}</View>
);

/* ------------------------------------------------------------ principal */

interface AccionesMensajeProps {
  acciones: Accion[];
  /** Ancho máximo en px (lo calcula ChatScreen, algo más ancho que la burbuja). */
  anchoMaximo?: number;
}

export const AccionesMensaje: React.FC<AccionesMensajeProps> = React.memo(
  ({ acciones, anchoMaximo }) => {
    const navigation = useNavigation();
    const { compacto, fontScale } = useLayout();
    const apilar = compacto || fontScale > 1.15;

    if (acciones.length === 0) return null;

    const render = (a: Accion, i: number) => {
      const key = `${a.tipo}-${i}`;
      switch (a.tipo) {
        case 'musica':
          return (
            <TarjetaAccion
              key={key}
              icono="play"
              fondoIcono={colors.peachPale}
              titulo={a.titulo}
              detalle={a.busqueda !== a.titulo ? a.busqueda : null}>
              <Botones apilar={apilar}>
                <Button
                  label="Escuchar en Spotify"
                  size="sm"
                  grow={!apilar}
                  onPress={() => abrirEnlace(a.spotify_url, 'Spotify')}
                  accessibilityHint={`Busca «${a.busqueda}» en Spotify`}
                />
                <Button
                  label="YouTube Music"
                  size="sm"
                  variant="outline"
                  onPress={() => abrirEnlace(a.youtube_music_url, 'YouTube Music')}
                  accessibilityHint={`Busca «${a.busqueda}» en YouTube Music`}
                />
              </Botones>
            </TarjetaAccion>
          );

        case 'recurso':
          return (
            <FilaAccion
              key={key}
              icono="book"
              fondoIcono={colors.sage}
              titulo={a.titulo}
              detalle="Abrir en Recursos"
              hint="Abre la guía en la pestaña Recursos"
              onPress={() =>
                navigation.navigate('MainApp', {
                  screen: 'RecursosTab',
                  params: { abrir: a.recurso_id },
                })
              }
            />
          );

        case 'centro': {
          const distancia = textoDistancia(a.distancia_km);
          const detalle = [a.direccion, distancia].filter(Boolean).join(' · ');
          const telefono = a.telefono;
          return (
            <TarjetaAccion
              key={key}
              icono="pin"
              fondoIcono={colors.sage}
              titulo={a.titulo}
              detalle={detalle || null}>
              <Botones apilar={apilar}>
                <Button
                  label="Cómo llegar"
                  size="sm"
                  icon="pin"
                  grow={!apilar}
                  onPress={() => abrirEnlace(a.maps_url, 'el mapa')}
                  accessibilityHint="Abre la ruta en Google Maps"
                />
                {telefono ? (
                  <Button
                    label="Llamar"
                    size="sm"
                    icon="phone"
                    variant="outline"
                    grow={!apilar}
                    onPress={() => llamar(telefono)}
                    accessibilityHint={`Llama al ${telefono}`}
                  />
                ) : null}
              </Botones>
            </TarjetaAccion>
          );
        }

        case 'buscar_mapa':
          return (
            <FilaAccion
              key={key}
              icono="search"
              fondoIcono={colors.sage}
              titulo={a.titulo}
              detalle="Buscar en Google Maps"
              hint="Abre Google Maps con la búsqueda cerca de ti"
              onPress={() => abrirEnlace(a.maps_url, 'Google Maps')}
            />
          );

        case 'llamar':
          return (
            <FilaAccion
              key={key}
              icono="phone"
              fondoIcono={colors.dangerBg}
              titulo={a.titulo}
              detalle={`Llamar al ${a.telefono}`}
              hint="Abre el teléfono para llamar"
              onPress={() => llamar(a.telefono)}
            />
          );

        case 'contacto_confianza':
          // Se resuelve en el teléfono con la persona de confianza guardada (v5).
          return <ContactoConfianza key={key} titulo={a.titulo} />;

        case 'actividad':
          return (
            <FilaAccion
              key={key}
              icono="calendar"
              fondoIcono={colors.lavenderPale}
              titulo={a.titulo}
              detalle="Ver en Actividades"
              hint="Abre tus actividades"
              onPress={() => navigation.navigate('Actividades')}
            />
          );

        default:
          return null;
      }
    };

    return (
      <View
        style={{
          alignSelf: 'flex-start',
          width: '100%',
          maxWidth: anchoMaximo,
          gap: 8,
        }}>
        {acciones.map(render)}
      </View>
    );
  }
);
