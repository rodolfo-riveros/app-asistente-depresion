import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, RefreshControl, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Card,
  HelpButton,
  Icon,
  IconButton,
  IconName,
  IconTile,
  Screen,
  Title,
  Txt,
} from '../../components/ui';
import { colors, moodScale } from '../../constants/colors';
import { radius } from '../../constants/spacing';
import { asistente, lineaAyuda } from '../../constants/asistente';
import { useAuth } from '../../hooks/useAuth';
import { useLayout } from '../../hooks/useLayout';
import { Tocable } from './components/Tocable';
import { animo } from '../../utils/animo';
import { Actividad, actividadesService } from '../../services/actividades';
import { Diagnostico, diagnosticoService } from '../../services/diagnostico';
import type { TabScreenProps } from '../../navigation/types';
import { PermisoNotificaciones } from '../../components/PermisoNotificaciones';
import { usePermisoNotificaciones } from '../../hooks/usePermisoNotificaciones';
import { recordatorio } from '../../services/recordatorio';
import { Preferencias, preferencias } from '../../utils/preferencias';
import {
  DIAS_SEMANA,
  MESES,
  categoriaDe,
  fechaRelativa,
  haptico,
  mensajeDe,
  textoCuando,
} from '../actividades/actividadesUtils';

/** Llama a la línea de ayuda; si el dispositivo no puede (tablet, emulador), da el número. */
const llamarAyuda = () => {
  Linking.openURL(`tel:${lineaAyuda.telefono}`).catch(() =>
    Alert.alert(
      'No se pudo abrir el teléfono',
      `Marca ${lineaAyuda.etiqueta} desde cualquier teléfono. ${lineaAyuda.detalle}.`
    )
  );
};

/** "Ahora no" en el aviso de notificaciones: no se vuelve a mostrar en Inicio. */
const AVISO_NOTIF_CERRADO = '@aviso_notif_cerrado';

/* -------------------------------------------------------------- helpers */

const fechaLarga = (d: Date) => {
  const dia = DIAS_SEMANA[d.getDay()];
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
};

const saludoSegunHora = (d: Date) => {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'Buenos días';
  if (h >= 12 && h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const primerNombre = (nombre?: string | null) => nombre?.trim().split(/\s+/)[0] ?? '';

/** Resumen de una línea para la fila "Tu registro semanal". Sin cifras inventadas. */
const resumenRegistro = (diag: Diagnostico | null, diasConAnimo: number): string => {
  let base: string;
  if (diag?.ultima_evaluacion) {
    const cuando = fechaRelativa(diag.ultima_evaluacion.fecha);
    base = `Último chequeo: ${diag.ultima_evaluacion.nivel}${cuando ? ` · ${cuando}` : ''}`;
  } else if (diag && diag.progreso.registrados > 0) {
    base = `Chequeo en curso · ${diag.progreso.registrados} de ${diag.progreso.total}`;
  } else {
    base = 'Aún sin chequeo completo';
  }
  if (diasConAnimo > 0) {
    base += ` · ánimo ${diasConAnimo} ${diasConAnimo === 1 ? 'día' : 'días'}`;
  }
  return base;
};

/** Pendientes primero por fecha (las que no tienen fecha, al final). */
const ordenarPorFecha = (lista: Actividad[]) =>
  [...lista].sort((a, b) => {
    const ta = a.para_cuando ? new Date(a.para_cuando).getTime() : Infinity;
    const tb = b.para_cuando ? new Date(b.para_cuando).getTime() : Infinity;
    return ta - tb;
  });

/* ----------------------------------------------------------- componentes */

const MoodCheckIn: React.FC<{
  valor: number | null;
  onElegir: (v: number) => void;
  compacto: boolean;
}> = ({ valor, onElegir, compacto }) => {
  const orbe = compacto ? 24 : 28;
  return (
    <Card gap={12} padding={compacto ? 12 : 16}>
      <Txt size={15} weight="semibold" accessibilityRole="header">
        ¿Cómo te sientes ahora?
      </Txt>
      <View
        style={{ flexDirection: 'row', gap: compacto ? 4 : 6, alignItems: 'stretch' }}
        accessibilityRole="radiogroup">
        {moodScale.map((m, i) => {
          const activo = valor === i;
          // "Muy mal"/"Muy bien" pueden partir en dos líneas; "Regular" no:
          // con fuente grande en 360 px se encoge un poco en lugar de cortarse.
          const unaPalabra = !m.label.includes(' ');
          return (
            <Pressable
              key={m.label}
              onPress={() => onElegir(i)}
              accessibilityRole="radio"
              accessibilityLabel={m.label}
              accessibilityState={{ checked: activo }}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                minHeight: 72,
                borderRadius: radius.input,
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 6,
                paddingTop: 12,
                paddingBottom: 8,
                paddingHorizontal: 2,
                borderWidth: activo ? 1.5 : 1,
                borderColor: activo ? colors.ink : colors.transparent,
                backgroundColor: activo ? colors.background : colors.surface,
                opacity: pressed ? 0.8 : 1,
              })}>
              <View
                style={{
                  width: orbe,
                  height: orbe,
                  borderRadius: orbe / 2,
                  backgroundColor: m.color,
                }}
              />
              <Txt
                size={11.5}
                align="center"
                leading={1.2}
                numberOfLines={unaPalabra ? 1 : 2}
                adjustsFontSizeToFit={unaPalabra}
                minimumFontScale={0.75}>
                {m.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
};

const TarjetaModo: React.FC<{
  titulo: string;
  texto: string;
  icono: IconName;
  fondo: string;
  fondoIcono: string;
  colorTitulo: string;
  colorTexto: string;
  colorIcono: string;
  ripple: string;
  /** Alto mínimo (168 en el diseño, escalado); crece si la fuente es grande. */
  alto: number;
  onPress: () => void;
  hint: string;
}> = (p) => (
  <Tocable
    onPress={p.onPress}
    accessibilityLabel={`${p.titulo}. ${p.texto}`}
    accessibilityHint={p.hint}
    rounded={radius.card}
    bg={p.fondo}
    ripple={p.ripple}
    pressedOpacity={0.88}
    style={{ flex: 1, minWidth: 0, minHeight: p.alto }}
    contentStyle={{ padding: 16, gap: 12, justifyContent: 'space-between' }}>
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: p.fondoIcono,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name={p.icono} size={22} color={p.colorIcono} />
    </View>
    <View style={{ gap: 4 }}>
      <Txt size={17} weight="bold" color={p.colorTitulo}>
        {p.titulo}
      </Txt>
      <Txt size={12.5} leading={1.35} color={p.colorTexto}>
        {p.texto}
      </Txt>
    </View>
  </Tocable>
);

const TONOS_PARA_HOY = [colors.peachPale, colors.sage];

/* ---------------------------------------------------------------- pantalla */

export const InicioScreen: React.FC<TabScreenProps<'InicioTab'>> = ({ navigation }) => {
  const { user } = useAuth();
  const { compacto, bajo, escala } = useLayout();
  // Tarjetas Escribir/Hablar: 168 en el diseño; más bajas en teléfonos pequeños.
  const altoModo = bajo ? 140 : compacto ? 152 : escala(168);
  const [ahora, setAhora] = useState(() => new Date());
  const [animoHoy, setAnimoHoy] = useState<number | null>(null);
  const [pendientes, setPendientes] = useState<Actividad[]>([]);
  const [errorActividades, setErrorActividades] = useState<string | null>(null);
  const [diag, setDiag] = useState<Diagnostico | null>(null);
  const [errorDiag, setErrorDiag] = useState<string | null>(null);
  const [diasConAnimo, setDiasConAnimo] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [prefs, setPrefs] = useState<Preferencias | null>(null);
  // `true` hasta leer AsyncStorage: así el aviso no parpadea si ya se cerró.
  const [avisoCerrado, setAvisoCerrado] = useState(true);
  const permiso = usePermisoNotificaciones();

  /** Datos del dispositivo: no esperan a la red (el ánimo se ve al instante sin conexión). */
  const cargarLocal = useCallback(async () => {
    const [hoy, semana, p, cerrado] = await Promise.allSettled([
      animo.deHoy(),
      animo.semanaActual(),
      preferencias.obtener(),
      AsyncStorage.getItem(AVISO_NOTIF_CERRADO),
    ]);
    setAhora(new Date());
    if (hoy.status === 'fulfilled') setAnimoHoy(hoy.value);
    if (semana.status === 'fulfilled') {
      setDiasConAnimo(semana.value.filter((d) => d.valor !== null).length);
    }
    if (p.status === 'fulfilled') setPrefs(p.value);
    setAvisoCerrado(cerrado.status === 'fulfilled' && cerrado.value === '1');
  }, []);

  const permitirNotificaciones = async () => {
    if ((await permiso.pedir()) === 'concedido') recordatorio.sincronizar();
  };

  const cerrarAvisoNotif = () => {
    setAvisoCerrado(true);
    AsyncStorage.setItem(AVISO_NOTIF_CERRADO, '1').catch(() => undefined);
  };

  /** El primer `await` va antes de cualquier setState (regla del linter en efectos). */
  const cargarServidor = useCallback(async () => {
    const [acts, ficha] = await Promise.allSettled([
      actividadesService.listar('pendientes'),
      diagnosticoService.obtener(),
    ]);

    if (acts.status === 'fulfilled') {
      setPendientes(ordenarPorFecha(acts.value));
      setErrorActividades(null);
    } else {
      setErrorActividades(mensajeDe(acts.reason));
    }
    if (ficha.status === 'fulfilled') {
      setDiag(ficha.value);
      setErrorDiag(null);
    } else {
      setErrorDiag(mensajeDe(ficha.reason));
    }
    setCargando(false);
  }, []);

  const cargar = useCallback(
    () => Promise.all([cargarLocal(), cargarServidor()]),
    [cargarLocal, cargarServidor]
  );

  // Se recarga al volver: lo acordado en el chat o el chequeo nuevo aparecen solos.
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const refrescar = () => {
    setRefrescando(true);
    cargar().finally(() => setRefrescando(false));
  };

  const elegirAnimo = async (valor: number) => {
    const previo = animoHoy;
    if (valor !== previo) haptico.seleccion();
    setAnimoHoy(valor);
    try {
      await animo.guardar(valor);
      const semana = await animo.semanaActual();
      setDiasConAnimo(semana.filter((d) => d.valor !== null).length);
    } catch {
      setAnimoHoy(previo);
      Alert.alert(
        'No se pudo guardar',
        'Tu ánimo no se guardó en el teléfono. Inténtalo de nuevo.'
      );
    }
  };

  const nombre = primerNombre(user?.nombre);
  const saludo = saludoSegunHora(ahora);
  const subtituloRegistro = cargando
    ? 'Cargando tu resumen…'
    : errorDiag && !diag
      ? diasConAnimo > 0
        ? `Chequeos sin conexión · ánimo ${diasConAnimo} ${diasConAnimo === 1 ? 'día' : 'días'}`
        : 'No se pudieron cargar tus chequeos. Toca para abrirlo.'
      : resumenRegistro(diag, diasConAnimo);
  const paraHoy = pendientes.slice(0, 2);

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
      {/* Cabecera */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={13} color={colors.inkSoft}>
            {fechaLarga(ahora)}
          </Txt>
          <Title numberOfLines={2}>{nombre ? `${saludo}, ${nombre}` : saludo}</Title>
        </View>
        <IconButton
          name="user"
          iconSize={20}
          bg={colors.sage}
          accessibilityLabel="Perfil"
          onPress={() => navigation.navigate('PerfilTab')}
        />
      </View>

      <MoodCheckIn valor={animoHoy} onElegir={elegirAnimo} compacto={compacto} />

      {/* Escribir / Hablar */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TarjetaModo
          titulo="Escribir"
          texto={`Sigue donde lo dejaste con ${asistente.nombre}`}
          icono="chat"
          fondo={colors.ink}
          fondoIcono={colors.forest}
          colorIcono={colors.onDark}
          colorTitulo={colors.onDark}
          colorTexto={colors.onDarkMuted}
          ripple={colors.rippleOnDark}
          alto={altoModo}
          hint="Abre el chat"
          onPress={() => navigation.navigate('Chat')}
        />
        <TarjetaModo
          titulo="Hablar"
          texto="Cuando escribir cuesta, solo habla"
          icono="mic"
          fondo={colors.accent}
          fondoIcono={colors.peachSoft}
          colorIcono={colors.ink}
          colorTitulo={colors.ink}
          colorTexto={colors.inkOnAccent}
          ripple={colors.ripple}
          alto={altoModo}
          hint="Abre el modo voz"
          onPress={() => navigation.navigate('Voz')}
        />
      </View>

      {/* Registro semanal */}
      <Tocable
        onPress={() => navigation.navigate('RegistroTab')}
        accessibilityLabel={`Tu registro semanal. ${subtituloRegistro}`}
        rounded={radius.card}
        contentStyle={{
          paddingVertical: 14,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}>
        <IconTile name="chart" strokeWidth={2} />
        <View style={{ flex: 1, gap: 3 }}>
          <Txt size={15} weight="semibold">
            Tu registro semanal
          </Txt>
          <Txt size={12.5} color={colors.inkSoft}>
            {subtituloRegistro}
          </Txt>
        </View>
        <Icon name="chevronRight" size={18} strokeWidth={2} />
      </Tocable>

      {/* Para hoy */}
      <View style={{ gap: 10 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt size={15} weight="semibold" accessibilityRole="header">
            Para hoy
          </Txt>
          <Pressable
            onPress={() => navigation.navigate('Actividades')}
            accessibilityRole="button"
            accessibilityLabel="Ver todas tus actividades"
            hitSlop={12}
            style={{ minHeight: 32, justifyContent: 'center' }}>
            <Txt size={13} weight="semibold" color={colors.forest}>
              Ver todo
            </Txt>
          </Pressable>
        </View>

        {cargando ? (
          <View style={{ height: 72, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : paraHoy.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {paraHoy.map((a, i) => (
              <Tocable
                key={a.id}
                onPress={() => navigation.navigate('Actividades')}
                accessibilityLabel={`${a.titulo}. ${textoCuando(a)}`}
                rounded={radius.lg}
                bg={TONOS_PARA_HOY[i % TONOS_PARA_HOY.length]}
                style={{ flex: 1, minWidth: 0 }}
                contentStyle={{ padding: 12, gap: 4 }}>
                <Txt size={14} weight="semibold" numberOfLines={2}>
                  {a.titulo}
                </Txt>
                <Txt size={12} color={colors.inkSoft} numberOfLines={2}>
                  {`${categoriaDe(a.categoria).etiqueta} · ${textoCuando(a).toLowerCase()}`}
                </Txt>
              </Tocable>
            ))}
          </View>
        ) : (
          <Tocable
            rounded={radius.lg}
            contentStyle={{ padding: 12, gap: 4 }}
            onPress={() => navigation.navigate('Actividades')}
            accessibilityLabel={
              errorActividades
                ? 'No se pudieron cargar tus actividades'
                : 'Nada pendiente por ahora'
            }>
            <Txt size={14} weight="semibold">
              {errorActividades
                ? 'No se pudieron cargar tus actividades'
                : 'Nada pendiente por ahora'}
            </Txt>
            <Txt size={12} color={colors.inkSoft} leading={1.4}>
              {errorActividades
                ? 'Desliza hacia abajo para reintentar.'
                : `Cuando acuerdes un paso pequeño con ${asistente.nombre}, aparecerá aquí.`}
            </Txt>
          </Tocable>
        )}
      </View>

      {/* Recordatorio activo pero sin permiso: aviso discreto y descartable. */}
      {prefs?.recordatorioDiario &&
        !avisoCerrado &&
        (permiso.estado === 'pendiente' || permiso.estado === 'bloqueado') && (
          <PermisoNotificaciones
            tono="sage"
            estado={permiso.estado}
            hora={prefs.horaRecordatorio}
            onPedir={permitirNotificaciones}
            onAbrirAjustes={permiso.abrirAjustes}
            onCerrar={cerrarAvisoNotif}
          />
        )}

      <HelpButton variant="bar" onPress={llamarAyuda} style={{ marginTop: 'auto' }} />
    </Screen>
  );
};
