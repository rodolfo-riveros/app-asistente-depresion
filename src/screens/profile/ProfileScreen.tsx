import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, Chip, Divider, Icon, Screen, Title, Toggle, Txt } from '../../components/ui';
import { PermisoNotificaciones } from '../../components/PermisoNotificaciones';
import { asistente } from '../../constants/asistente';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/spacing';
import { useAuth } from '../../hooks/useAuth';
import { ANCHO_MAXIMO, useLayout } from '../../hooks/useLayout';
import { usePermisoNotificaciones } from '../../hooks/usePermisoNotificaciones';
import { usePermisoUbicacion } from '../../hooks/usePermisoUbicacion';
import { cadaFranja, recordatorio } from '../../services/recordatorio';
import type { TabScreenProps } from '../../navigation/types';
import { Diagnostico, diagnosticoService } from '../../services/diagnostico';
import { Perfil, perfilService } from '../../services/perfil';
import {
  PersonaConfianza,
  Preferencias,
  PREFERENCIAS_INICIALES,
  preferencias as preferenciasStore,
} from '../../utils/preferencias';
import { haptico, mensajeDe } from '../actividades/actividadesUtils';
import { EditarPerfilHoja } from './components/EditarPerfilHoja';
import { Hoja } from './components/Hoja';
import { PersonaConfianzaHoja } from './components/PersonaConfianzaHoja';
import { VozAjuste } from './components/VozAjuste';

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** "septiembre de 2026" a partir de una fecha ISO; `null` si no es válida. */
const mesAnio = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;
  return `${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
};

/** Horas del recordatorio, en pasos de 30 min. */
const pasos = (desde: number, hasta: number) =>
  Array.from({ length: (hasta - desde) * 2 + 1 }, (_, i) => {
    const min = desde * 60 + i * 30;
    return `${String(Math.floor(min / 60)).padStart(2, '0')}:${min % 60 === 0 ? '00' : '30'}`;
  });
const HORAS_NOCHE = pasos(19, 23);
const HORAS_MANANA = pasos(7, 10);

/** "Cada noche a las 21:00". */
const textoHora = (hora: string) => {
  const cada = cadaFranja(hora);
  return `${cada.charAt(0).toUpperCase()}${cada.slice(1)} a las ${hora}`;
};

/* ------------------------------------------------------------- Piezas */

/**
 * ¿Caben las 3 estadísticas en fila? "conversaciones" es una sola palabra
 * (≈ 7,3 caracteres de 11,5 px por em): si la celda no la aloja con la fuente
 * del sistema actual, se apilan como filas (cifra + etiqueta) en vez de
 * cortar la palabra a mitad.
 */
const statsEnFila = (anchoContenido: number, fontScale: number) => {
  // Pantalla (20 + 20) + tarjeta (16 + 16) + 2 huecos de 8 = 88; padding de celda 20.
  const celda = (Math.min(anchoContenido, ANCHO_MAXIMO) - 88) / 3 - 20;
  return celda >= 86 * Math.min(fontScale, 1.35);
};

const Stat: React.FC<{
  valor: string;
  etiqueta: string;
  cargando: boolean;
  /** Apilada: cifra y etiqueta en una fila a lo ancho (pantallas estrechas / fuente grande). */
  apilada: boolean;
}> = ({ valor, etiqueta, cargando, apilada }) => (
  <View
    accessible
    accessibilityLabel={cargando ? `${etiqueta}: cargando` : `${valor} ${etiqueta}`}
    style={{
      flex: apilada ? undefined : 1,
      minWidth: 0,
      backgroundColor: colors.background,
      borderRadius: radius.md,
      paddingHorizontal: apilada ? 14 : 10,
      paddingVertical: 10,
      gap: apilada ? 10 : 2,
      flexDirection: apilada ? 'row' : 'column',
      alignItems: apilada ? 'center' : 'stretch',
    }}>
    {cargando ? (
      <View style={{ height: 26, justifyContent: 'center', alignItems: 'flex-start' }}>
        <ActivityIndicator size="small" color={colors.moss} />
      </View>
    ) : (
      <Txt size={20} weight="bold" numberOfLines={1} style={apilada ? { minWidth: 32 } : undefined}>
        {valor}
      </Txt>
    )}
    <Txt
      size={apilada ? 13 : 11.5}
      color={colors.inkSoft}
      numberOfLines={apilada ? 1 : 2}
      style={apilada ? { flex: 1 } : undefined}>
      {etiqueta}
    </Txt>
  </View>
);

const FilaAjuste: React.FC<{
  titulo: string;
  detalle: string;
  children: React.ReactNode;
  onPress?: () => void;
  /** Hace tocable sólo el subtítulo (p. ej. la hora), sin chocar con el interruptor. */
  onPressDetalle?: () => void;
  detalleLabel?: string;
}> = ({ titulo, detalle, children, onPress, onPressDetalle, detalleLabel }) => {
  const contenido = (
    <>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt size={14.5} weight="semibold">
          {titulo}
        </Txt>
        {onPressDetalle ? (
          <Pressable
            onPress={onPressDetalle}
            accessibilityRole="button"
            accessibilityLabel={detalleLabel ?? detalle}
            hitSlop={{ top: 8, bottom: 12, left: 8, right: 8 }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              gap: 4,
              minHeight: 24,
              opacity: pressed ? 0.6 : 1,
            })}>
            <Icon name="clock" size={13} color={colors.forest} strokeWidth={2} />
            <Txt size={12.5} weight="medium" color={colors.forest}>
              {detalle}
            </Txt>
            <Icon name="chevronDown" size={13} color={colors.forest} strokeWidth={2} />
          </Pressable>
        ) : (
          <Txt size={12.5} color={colors.inkSoft}>
            {detalle}
          </Txt>
        )}
      </View>
      {children}
    </>
  );
  const estilo = {
    minHeight: 60,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingVertical: 8,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${titulo}. ${detalle}`}
        // Android: onda; iOS: opacidad.
        android_ripple={{ color: colors.ripple }}
        style={({ pressed }) => [
          estilo,
          { opacity: pressed && Platform.OS !== 'android' ? 0.7 : 1 },
        ]}>
        {contenido}
      </Pressable>
    );
  }
  return <View style={estilo}>{contenido}</View>;
};

/* ------------------------------------------------------------ Pantalla */

export const ProfileScreen: React.FC<TabScreenProps<'PerfilTab'>> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { anchoContenido, compacto, escala, fontScale } = useLayout();
  const avatar = compacto ? 52 : escala(56);
  const apilarStats = !statsEnFila(anchoContenido, fontScale);

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null);
  const [prefs, setPrefs] = useState<Preferencias>(PREFERENCIAS_INICIALES);

  const [cargandoStats, setCargandoStats] = useState(true);
  const [errorStats, setErrorStats] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const [editando, setEditando] = useState(false);
  const [editandoPersona, setEditandoPersona] = useState(false);
  const [eligiendoHora, setEligiendoHora] = useState(false);

  const permiso = usePermisoNotificaciones();
  const permisoUbicacion = usePermisoUbicacion();

  /** Preferencias y persona de confianza viven en el teléfono: no esperan a la red. */
  const cargarLocal = useCallback(async () => {
    setPrefs(await preferenciasStore.obtener());
  }, []);

  /** El primer `await` va antes de cualquier setState (regla del linter en efectos). */
  const cargarServidor = useCallback(async () => {
    const [p, d] = await Promise.allSettled([
      perfilService.obtener(),
      diagnosticoService.obtener(),
    ]);

    if (p.status === 'fulfilled') {
      setPerfil(p.value);
      setErrorPerfil(null);
    } else {
      setErrorPerfil(`No se pudo cargar tu perfil. ${mensajeDe(p.reason)}`);
    }

    if (d.status === 'fulfilled') {
      setDiagnostico(d.value);
      setErrorStats(false);
    } else {
      setErrorStats(true);
    }
    setCargandoStats(false);
  }, []);

  const cargar = useCallback(
    () => Promise.all([cargarLocal(), cargarServidor()]),
    [cargarLocal, cargarServidor]
  );

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const refrescar = async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  };

  /* --------------------------------------------------------- Acciones */

  /**
   * El selector del sistema (Photo Picker en Android 13+, PHPicker en iOS) no
   * necesita permiso de galería: sólo comparte la foto que eliges. Por eso no se
   * pide `requestMediaLibraryPermissionsAsync` (además, `READ_EXTERNAL_STORAGE`
   * está bloqueado en app.json y en Android ≤ 12 la petición se denegaría
   * siempre). Si aun así el sistema niega el acceso, se explica y se ofrece Ajustes.
   */
  const cambiarFoto = async () => {
    if (subiendoFoto) return;

    let elegida: ImagePicker.ImagePickerResult;
    try {
      elegida = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
    } catch {
      Alert.alert(
        'No se pudieron abrir tus fotos',
        'Para elegir una foto de perfil, la app necesita ver tus fotos. Sólo se usa la que ' +
          'elijas. Puedes permitirlo en los Ajustes del teléfono.',
        [
          { text: 'Ahora no', style: 'cancel' },
          {
            text: 'Abrir Ajustes',
            onPress: () =>
              Linking.openSettings().catch(() =>
                Alert.alert('No se pudo abrir Ajustes', 'Ábrelos desde el menú del teléfono.')
              ),
          },
        ]
      );
      return;
    }
    if (elegida.canceled || !elegida.assets?.[0]?.uri) return;

    setSubiendoFoto(true);
    try {
      setPerfil(await perfilService.subirFoto(elegida.assets[0].uri));
      haptico.exito();
    } catch (e) {
      Alert.alert('No se pudo subir la foto', mensajeDe(e));
    } finally {
      setSubiendoFoto(false);
    }
  };

  /** Guarda una preferencia de forma optimista y la revierte si falla. */
  const cambiarPreferencia = async (cambios: Partial<Preferencias>) => {
    const anterior = prefs;
    haptico.seleccion();
    setPrefs((p) => ({ ...p, ...cambios }));
    try {
      const nuevas = await preferenciasStore.guardar(cambios);
      setPrefs(nuevas);
      // Reprograma (o cancela) los avisos con lo recién guardado. No lanza.
      recordatorio.sincronizar(nuevas);
    } catch {
      setPrefs(anterior);
      Alert.alert('No se pudo guardar', 'Inténtalo de nuevo.');
    }
  };

  /**
   * Activar el recordatorio pide el permiso del sistema (el interruptor y su
   * subtítulo ya explican para qué). Si se niega, el interruptor queda apagado.
   */
  const cambiarRecordatorio = async (activar: boolean) => {
    if (!activar) {
      cambiarPreferencia({ recordatorioDiario: false });
      return;
    }
    let estado = permiso.estado === 'cargando' ? await permiso.refrescar() : permiso.estado;
    if (estado === 'pendiente') estado = await permiso.pedir();
    // `no-disponible` (web, Expo Go): se guarda la preferencia igualmente.
    if (estado === 'concedido' || estado === 'no-disponible') {
      cambiarPreferencia({ recordatorioDiario: true });
      return;
    }
    const motivo =
      `Sin notificaciones, ${asistente.nombre} no puede preguntarte cómo estás ` +
      `${cadaFranja(prefs.horaRecordatorio)}. El recordatorio queda apagado.`;
    if (estado === 'bloqueado') {
      Alert.alert(
        'Notificaciones desactivadas',
        `${motivo} Si cambias de idea, actívalas en Ajustes › Notificaciones.`,
        [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Abrir ajustes', onPress: permiso.abrirAjustes },
        ]
      );
    } else {
      Alert.alert('Sin permiso para avisarte', `${motivo} Puedes activarlo cuando quieras.`, [
        { text: 'Entendido' },
      ]);
    }
  };

  const permitirNotificaciones = async () => {
    if ((await permiso.pedir()) === 'concedido') recordatorio.sincronizar(prefs);
  };

  const elegirHora = (hora: string) => {
    setEligiendoHora(false);
    if (hora !== prefs.horaRecordatorio) cambiarPreferencia({ horaRecordatorio: hora });
  };

  const guardarPersona = async (persona: PersonaConfianza | null) => {
    setPrefs(await preferenciasStore.guardar({ personaConfianza: persona }));
  };

  const llamarPersona = (persona: PersonaConfianza) => {
    Linking.openURL(`tel:${persona.telefono}`).catch(() =>
      Alert.alert(
        'No se pudo abrir el teléfono',
        `Marca a mano a ${persona.nombre}: ${persona.telefono}`
      )
    );
  };

  const verPrivacidad = () => navigation.navigate('Legal', { seccion: 'privacidad' });

  const confirmarLogout = () =>
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        // Sin sesión no debe llegar ningún recordatorio a nombre de la asistente.
        onPress: () => {
          recordatorio.cancelarTodo().finally(() => logout());
        },
      },
    ]);

  /* ------------------------------------------------------------ Datos */

  const nombre = perfil?.nombre?.trim() || user?.nombre?.trim() || 'Tu perfil';
  const inicial = nombre.charAt(0).toUpperCase();
  const desde = mesAnio(diagnostico?.actividad.primera_conversacion);
  const subtitulo = desde
    ? `Con ${asistente.nombre} desde ${desde}`
    : perfil?.email || user?.email || `Aún no has hablado con ${asistente.nombre}`;

  const cargando = cargandoStats && !diagnostico;
  const valor = (n: number | undefined) => (errorStats && !diagnostico ? '—' : String(n ?? 0));
  const persona = prefs.personaConfianza;

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={refrescar}
          tintColor={colors.forest}
          colors={[colors.forest]}
        />
      }>
      <Title>Perfil</Title>

      {errorPerfil && !perfil && (
        <Card tone="danger" rounded={radius.lg} padding={14} gap={4}>
          <Txt size={13.5} weight="semibold" color={colors.dangerInk}>
            {errorPerfil}
          </Txt>
          <Txt size={12.5} color={colors.dangerInk}>
            Desliza hacia abajo para reintentar.
          </Txt>
        </Card>
      )}

      {/* Identidad + estadísticas */}
      <Card gap={16}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable
            onPress={cambiarFoto}
            accessibilityRole="button"
            accessibilityLabel="Cambiar foto de perfil"
            accessibilityHint="Abre tus fotos; sólo se usa la que elijas"
            accessibilityState={{ busy: subiendoFoto }}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <View
              style={{
                width: avatar,
                height: avatar,
                borderRadius: avatar / 2,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
              {perfil?.foto_url ? (
                <Image
                  source={{ uri: perfil.foto_url }}
                  style={{ width: avatar, height: avatar }}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Txt size={22} weight="bold">
                  {inicial}
                </Txt>
              )}
              {subiendoFoto && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: colors.scrim,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <ActivityIndicator color={colors.white} />
                </View>
              )}
            </View>
            <View
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: colors.ink,
                borderWidth: 2,
                borderColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon name="camera" size={11} color={colors.onDark} strokeWidth={2.2} />
            </View>
          </Pressable>

          <View style={{ flex: 1, gap: 2 }}>
            <Txt size={17} weight="bold" numberOfLines={1}>
              {nombre}
            </Txt>
            <Txt size={13} color={colors.inkSoft} numberOfLines={2}>
              {subtitulo}
            </Txt>
          </View>

          <Pressable
            onPress={() => setEditando(true)}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
            hitSlop={4}
            style={({ pressed }) => ({
              minHeight: 44,
              paddingHorizontal: 4,
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}>
            <Txt size={13.5} weight="semibold">
              Editar
            </Txt>
          </Pressable>
        </View>

        <View style={{ flexDirection: apilarStats ? 'column' : 'row', gap: 8 }}>
          <Stat
            cargando={cargando}
            apilada={apilarStats}
            valor={valor(diagnostico?.actividad.conversaciones)}
            etiqueta={
              diagnostico?.actividad.conversaciones === 1 ? 'conversación' : 'conversaciones'
            }
          />
          <Stat
            cargando={cargando}
            apilada={apilarStats}
            valor={valor(diagnostico?.actividad.actividades_completadas)}
            etiqueta={
              diagnostico?.actividad.actividades_completadas === 1
                ? 'actividad hecha'
                : 'actividades hechas'
            }
          />
          <Stat
            cargando={cargando}
            apilada={apilarStats}
            valor={valor(diagnostico?.evaluaciones.length)}
            etiqueta={diagnostico?.evaluaciones.length === 1 ? 'chequeo' : 'chequeos'}
          />
        </View>
        {errorStats && !diagnostico && (
          <Txt size={12.5} color={colors.inkSoft}>
            No pude cargar tus datos. Desliza hacia abajo para reintentar.
          </Txt>
        )}
      </Card>

      {/* Persona de confianza */}
      {persona ? (
        <Card tone="sage" gap={12}>
          <View style={{ gap: 4 }}>
            <Txt size={15} weight="semibold">
              Persona de confianza
            </Txt>
            <Txt size={13} color={colors.inkOnSage} leading={1.35}>
              {persona.nombre} · {persona.telefono}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              label="Llamar"
              icon="phone"
              size="sm"
              grow
              onPress={() => llamarPersona(persona)}
            />
            <Button
              label="Cambiar"
              variant="secondary"
              size="sm"
              onPress={() => setEditandoPersona(true)}
            />
          </View>
        </Card>
      ) : (
        <Card tone="sage" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt size={15} weight="semibold">
              Persona de confianza
            </Txt>
            <Txt size={13} color={colors.inkOnSage} leading={1.35}>
              Alguien a quien puedas avisar con un toque si lo necesitas.
            </Txt>
          </View>
          <Button label="Añadir" size="sm" onPress={() => setEditandoPersona(true)} />
        </Card>
      )}

      {/* Ajustes */}
      <Card padding={0} gap={0} style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
        <FilaAjuste
          titulo="Recordatorio diario"
          detalle={textoHora(prefs.horaRecordatorio)}
          onPressDetalle={() => setEligiendoHora(true)}
          detalleLabel={`Hora del recordatorio: ${prefs.horaRecordatorio}. Cambiar`}>
          <Toggle
            value={prefs.recordatorioDiario}
            onChange={cambiarRecordatorio}
            accessibilityLabel="Recordatorio diario"
          />
        </FilaAjuste>
        <Divider />
        <FilaAjuste titulo="Notificaciones discretas" detalle="Sin texto en la pantalla bloqueada">
          <Toggle
            value={prefs.notificacionesDiscretas}
            onChange={(v) => cambiarPreferencia({ notificacionesDiscretas: v })}
            accessibilityLabel="Notificaciones discretas"
          />
        </FilaAjuste>
        <Divider />
        <VozAjuste />
        <Divider />
        <FilaAjuste
          titulo="Ubicación"
          detalle={
            permisoUbicacion.estado === 'concedido'
              ? 'Activada · para recomendarte centros cercanos'
              : permisoUbicacion.estado === 'bloqueado'
                ? 'Desactivada en los ajustes del teléfono'
                : permisoUbicacion.estado === 'pendiente'
                  ? 'Para recomendarte centros de salud mental cercanos'
                  : 'Comprobando…'
          }>
          {permisoUbicacion.estado === 'concedido' ? (
            <Icon name="check" size={20} color={colors.forest} strokeWidth={2} />
          ) : permisoUbicacion.estado === 'bloqueado' ? (
            <Button
              label="Abrir ajustes"
              size="sm"
              variant="outline"
              onPress={permisoUbicacion.abrirAjustes}
              accessibilityHint="Abre los ajustes del teléfono para activar la ubicación"
            />
          ) : permisoUbicacion.estado === 'pendiente' ? (
            <Button
              label="Permitir"
              size="sm"
              onPress={() => permisoUbicacion.pedir()}
              accessibilityHint="Muestra el aviso del sistema para permitir la ubicación"
            />
          ) : null}
        </FilaAjuste>
        <Divider />
        <FilaAjuste
          titulo="Privacidad y datos"
          detalle="Qué se guarda y dónde"
          onPress={verPrivacidad}>
          <Icon name="chevronRight" size={18} color={colors.ink} strokeWidth={2} />
        </FilaAjuste>
      </Card>

      {prefs.recordatorioDiario &&
        (permiso.estado === 'pendiente' || permiso.estado === 'bloqueado') && (
          <PermisoNotificaciones
            estado={permiso.estado}
            hora={prefs.horaRecordatorio}
            onPedir={permitirNotificaciones}
            onAbrirAjustes={permiso.abrirAjustes}
          />
        )}

      <Button label="Cerrar sesión" variant="outline" size="md" onPress={confirmarLogout} />

      <EditarPerfilHoja
        visible={editando}
        perfil={perfil}
        onClose={() => setEditando(false)}
        onGuardado={setPerfil}
      />
      <PersonaConfianzaHoja
        visible={editandoPersona}
        persona={persona}
        onClose={() => setEditandoPersona(false)}
        onGuardar={guardarPersona}
      />
      <Hoja
        visible={eligiendoHora}
        titulo="Hora del recordatorio"
        onClose={() => setEligiendoHora(false)}>
        <Txt size={13.5} leading={1.4} color={colors.inkSoft}>
          {asistente.nombre} te escribirá una vez al día a esta hora.
        </Txt>
        {[
          { titulo: 'Por la noche', horas: HORAS_NOCHE },
          { titulo: 'Por la mañana', horas: HORAS_MANANA },
        ].map((grupo) => (
          <View key={grupo.titulo} style={{ gap: 8 }}>
            <Txt size={13} weight="semibold" color={colors.inkSoft} accessibilityRole="header">
              {grupo.titulo}
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {grupo.horas.map((h) => (
                <Chip
                  key={h}
                  label={h}
                  selected={h === prefs.horaRecordatorio}
                  onPress={() => elegirHora(h)}
                />
              ))}
            </View>
          </View>
        ))}
      </Hoja>
    </Screen>
  );
};
