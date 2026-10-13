import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { HelpButton, Icon, IconButton, IconName, Screen, Txt } from '../../components/ui';
import { PermisoMicrofono } from '../../components/PermisoMicrofono';
import { colors } from '../../constants/colors';
import { asistente } from '../../constants/asistente';
import { useChat } from '../../hooks/useChat';
import { useDictado } from '../../hooks/useDictado';
import { usePermisoMicrofono, type EstadoPermiso } from '../../hooks/usePermisoMicrofono';
import { useLayout } from '../../hooks/useLayout';
import { voz } from '../../services/voz';
import type { RootScreenProps } from '../../navigation/types';
import type { ChatMessage } from '../../types/chat';
import type { FaseVoz } from './components/fases';
import { OrbeVoz } from './components/OrbeVoz';
import { OndaVoz } from './components/OndaVoz';
import { NavigationBar } from 'expo-navigation-bar';

/* ----------------------------------------------------------------- Textos */

const TEXTOS: Record<FaseVoz, { titulo: string; detalle: string }> = {
  preparando: { titulo: 'Un momento…', detalle: 'Estoy preparando el micrófono.' },
  sinPermiso: {
    titulo: 'Esperando el micrófono',
    detalle: 'Para hablar conmigo necesito tu permiso.',
  },
  grabando: { titulo: 'Te estoy escuchando…', detalle: 'Tómate tu tiempo. No hay prisa.' },
  esperando: { titulo: 'Toca el círculo para hablar', detalle: 'Cuando quieras, aquí estoy.' },
  transcribiendo: { titulo: 'Un momento…', detalle: 'Estoy entendiendo lo que dijiste.' },
  pensando: { titulo: 'Pensando…', detalle: `${asistente.nombre} prepara su respuesta.` },
  hablando: {
    titulo: `${asistente.nombre} está hablando`,
    detalle: 'Toca el círculo si quieres interrumpir.',
  },
  silenciado: {
    titulo: 'En pausa',
    detalle: 'Micrófono y voz silenciados. Toca Reactivar para seguir.',
  },
};

const AYUDA_ORBE: Partial<Record<FaseVoz, string>> = {
  grabando: 'Toca el círculo cuando termines',
  sinPermiso: 'Explica para qué se usa el micrófono y pide el permiso',
};

const ETIQUETA_ORBE: Record<FaseVoz, string> = {
  preparando: 'Preparando el micrófono',
  sinPermiso: 'Permitir micrófono',
  grabando: 'Enviar lo que dijiste',
  esperando: 'Empezar a hablar',
  transcribiendo: 'Transcribiendo',
  pensando: `${asistente.nombre} está pensando`,
  hablando: 'Interrumpir y hablar',
  silenciado: 'Reactivar y hablar',
};

const mmss = (segundos: number) => {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const ultimoDe = (messages: ChatMessage[], role: ChatMessage['role']) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === role) return messages[i];
  }
  return null;
};

/** Háptico ligero; si el dispositivo no lo soporta, no pasa nada. */
const vibrar = (estilo = Haptics.ImpactFeedbackStyle.Light) => {
  Haptics.impactAsync(estilo).catch(() => undefined);
};

/* ------------------------------------------------------------ Controles */

const Control: React.FC<{
  icon: IconName;
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  size?: number;
  bg?: string;
  color?: string;
  iconSize?: number;
  strokeWidth?: number;
  activo?: boolean;
}> = ({
  icon,
  label,
  accessibilityLabel,
  onPress,
  size = 60,
  bg = colors.voiceSurface,
  color = colors.onDark,
  iconSize = 22,
  strokeWidth = 1.8,
  activo,
}) => (
  <View style={{ alignItems: 'center', gap: 8, minWidth: 72 }}>
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={activo === undefined ? undefined : { selected: activo }}
      hitSlop={8}
      // Android: onda circular sutil; iOS: baja la opacidad.
      android_ripple={{ color: colors.rippleOnDark, borderless: true, radius: size / 2 }}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: Platform.OS === 'ios' && pressed ? 0.75 : 1,
      })}>
      <Icon name={icon} size={iconSize} color={color} strokeWidth={strokeWidth} />
    </Pressable>
    <Txt
      size={12}
      color={colors.voiceMuted}
      numberOfLines={1}
      maxFontSizeMultiplier={1.2}
      importantForAccessibility="no"
      accessibilityElementsHidden>
      {label}
    </Txt>
  </View>
);

/* ---------------------------------------------------------------- Pantalla */

export const VozScreen: React.FC<RootScreenProps<'Voz'>> = ({ navigation }) => {
  const {
    messages,
    loading,
    sendMessage,
    protocoloCrisisActivo,
    testCompleto,
    resultado,
    restaurando,
  } = useChat();
  const dictado = useDictado();
  const permiso = usePermisoMicrofono();
  /*
   * Tamaños: se decide por el alto ÚTIL (sin barra de estado ni safe area
   * inferior), que es lo que de verdad hay entre la cabecera y los controles.
   * - mini: `bajo` de useLayout (iPhone SE, Android 360×640) o < 620 útiles →
   *   orbe al 62 %, Terminar 68 px, márgenes mínimos.
   * - compacta: < 740 útiles (Android 360×800 con 3 botones ≈ 728) o fuente del
   *   sistema ≥ 115 % en pantallas medianas (iPhone 14 al 130 %) → orbe al 80 %.
   * - `escala()` ajusta orbe y controles al ancho (90–110 %: 360 px → 240,
   *   tablet → 286). Los controles nunca entran al scroll: siempre visibles.
   */
  const { alto, bajo, escala, tablet, fontScale } = useLayout();
  const insets = useSafeAreaInsets();
  const altoUtil = alto - insets.top - insets.bottom;
  const mini = bajo || altoUtil < 620;
  const compacta = mini || altoUtil < 740 || (fontScale >= 1.15 && altoUtil < 820);
  const factorOrbe = (escala(260) / 260) * (mini ? 0.62 : compacta ? 0.8 : 1);

  const [hablando, setHablandoEstado] = useState(false);
  const [silenciado, setSilenciado] = useState(false);
  const [segundos, setSegundos] = useState(0);

  // Refs: los callbacks del TTS y de la grabación llegan tarde y necesitan el
  // estado más reciente, no el del render en que se crearon.
  const dictadoRef = useRef(dictado);
  const permisoRef = useRef<EstadoPermiso>(permiso.estado);
  const permisoPrevioRef = useRef<EstadoPermiso>(permiso.estado);
  const montadoRef = useRef(true);
  /**
   * El bucle hablar → escuchar está activo. Se corta al salir, al terminar y
   * al pasar a segundo plano (al volver, la pantalla queda en espera).
   */
  const activoRef = useRef(true);
  const silenciadoRef = useRef(false);
  const hablandoRef = useRef(false);
  /** Invalida los `onDone` de locuciones viejas (voz.callar dispara onStopped). */
  const turnoRef = useRef(0);
  /** Se envió un mensaje desde esta pantalla y su respuesta debe leerse. */
  const esperandoRespuestaRef = useRef(false);
  /** El permiso se concedió con la app en segundo plano: arrancar al volver. */
  const arranquePendienteRef = useRef(false);
  const crisisPreviaRef = useRef(protocoloCrisisActivo);
  const testPrevioRef = useRef(testCompleto);

  useEffect(() => {
    dictadoRef.current = dictado;
    permisoRef.current = permiso.estado;
  });

  const setHablando = useCallback((valor: boolean) => {
    hablandoRef.current = valor;
    setHablandoEstado(valor);
  }, []);

  /* ------------------------------------------------------ Bucle de voz */

  /** Corta la voz y deja el micrófono grabando (sólo con permiso concedido). */
  const escuchar = useCallback(async () => {
    if (!activoRef.current || silenciadoRef.current) return;
    turnoRef.current += 1;
    setHablando(false);
    await voz.callar();
    // Nunca se abre el micrófono (ni el diálogo del sistema) sin permiso:
    // primero se explica con la tarjeta de permiso.
    if (permisoRef.current !== 'concedido') return;
    await dictadoRef.current.cancelar();
    // Preparar antes de capturar evita que se coman las primeras sílabas.
    await dictadoRef.current.preparar();
    if (!montadoRef.current || !activoRef.current || silenciadoRef.current) return;
    if (AppState.currentState !== 'active') return;
    const empezo = await dictadoRef.current.iniciar();
    if (!montadoRef.current || !activoRef.current) {
      await dictadoRef.current.cancelar();
      return;
    }
    if (empezo) vibrar();
  }, [setHablando]);

  /** Lee un texto y, al terminar, vuelve a escuchar. */
  const hablar = useCallback(
    (texto: string) => {
      if (!activoRef.current || silenciadoRef.current) return;
      const turno = ++turnoRef.current;
      setHablando(true);
      voz.hablar(texto, () => {
        if (turno !== turnoRef.current || !montadoRef.current) return;
        setHablando(false);
        escuchar();
      });
    },
    [escuchar, setHablando]
  );

  /** Para todo: voz, grabación y bucle. */
  const detener = useCallback(async () => {
    activoRef.current = false;
    esperandoRespuestaRef.current = false;
    turnoRef.current += 1;
    setHablando(false);
    await voz.callar();
    await dictadoRef.current.cancelar().catch(() => undefined);
  }, [setHablando]);

  // Al abrir: si la conversación es nueva, saluda en voz alta (el TTS no
  // necesita micrófono); la escucha empieza cuando haya permiso.
  useEffect(() => {
    montadoRef.current = true;
    activoRef.current = true;
    const inicio = Date.now();
    const reloj = setInterval(() => setSegundos(Math.floor((Date.now() - inicio) / 1000)), 1000);

    const ultimo = messages[messages.length - 1];
    if (!restaurando && messages.length === 1 && ultimo?.role === 'assistant') {
      hablar(ultimo.content);
    }

    return () => {
      clearInterval(reloj);
      montadoRef.current = false;
      activoRef.current = false;
      turnoRef.current += 1;
      voz.callar();
      dictadoRef.current.cancelar().catch(() => undefined);
    };
    // Sólo al montar: el bucle sigue con refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El permiso pasa a concedido (al abrir, tras "Permitir" o al volver de
  // Ajustes) → empieza a escuchar. Si ya estaba concedido no se relanza: al
  // volver de segundo plano la pantalla queda en espera.
  useEffect(() => {
    const previo = permisoPrevioRef.current;
    permisoPrevioRef.current = permiso.estado;
    permisoRef.current = permiso.estado;
    if (permiso.estado !== 'concedido' || previo === 'concedido') return;
    if (!montadoRef.current || !navigation.isFocused()) return;
    if (AppState.currentState !== 'active') {
      // Android puede pasar a segundo plano mientras muestra el diálogo del
      // permiso: se arranca en cuanto la app vuelva a estar activa.
      arranquePendienteRef.current = true;
      return;
    }
    const d = dictadoRef.current;
    // Si está leyendo el saludo, la escucha empieza al terminar (onDone).
    if (silenciadoRef.current || hablandoRef.current || d.grabando || d.transcribiendo) return;
    activoRef.current = true;
    escuchar();
  }, [permiso.estado, escuchar, navigation]);

  // Segundo plano / interrupciones: se corta voz y micrófono (no queda nada
  // grabando) y al volver se espera a que la persona toque el círculo.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') {
        // Sólo se reanuda solo si el permiso se acaba de conceder (ver arriba).
        if (!arranquePendienteRef.current) return;
        arranquePendienteRef.current = false;
        if (!montadoRef.current || !navigation.isFocused()) return;
        if (permisoRef.current !== 'concedido' || silenciadoRef.current) return;
        activoRef.current = true;
        escuchar();
        return;
      }
      if (estado !== 'background') return;
      activoRef.current = false;
      esperandoRespuestaRef.current = false;
      turnoRef.current += 1;
      setHablando(false);
      voz.callar();
      dictadoRef.current.cancelar().catch(() => undefined);
    });
    return () => sub.remove();
  }, [setHablando, escuchar, navigation]);

  // Llega la respuesta de lo que se dijo aquí: se lee en alto.
  useEffect(() => {
    if (!esperandoRespuestaRef.current || loading) return;
    const ultimo = messages[messages.length - 1];
    if (ultimo?.role !== 'assistant') return;
    esperandoRespuestaRef.current = false;
    hablar(ultimo.content);
  }, [messages, loading, hablar]);

  // Crisis detectada durante la conversación → protocolo de crisis.
  useEffect(() => {
    if (protocoloCrisisActivo && !crisisPreviaRef.current) {
      detener();
      navigation.navigate('CrisisProtocol');
    }
    crisisPreviaRef.current = protocoloCrisisActivo;
  }, [protocoloCrisisActivo, detener, navigation]);

  // Se completó la escala → resultado.
  useEffect(() => {
    if (testCompleto && !testPrevioRef.current && resultado && !protocoloCrisisActivo) {
      detener();
      navigation.navigate('Result', { resultado });
    }
    testPrevioRef.current = testCompleto;
  }, [testCompleto, resultado, protocoloCrisisActivo, detener, navigation]);

  /* ---------------------------------------------------------- Acciones */

  const salir = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainApp');
  }, [navigation]);

  const terminar = useCallback(async () => {
    vibrar(Haptics.ImpactFeedbackStyle.Medium);
    await detener();
    salir();
  }, [detener, salir]);

  // Botón atrás de Android = Terminar (sólo mientras Voz está al frente).
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        terminar();
        return true;
      });
      return () => sub.remove();
    }, [terminar])
  );

  const pedirPermiso = async () => {
    // Corta el saludo para que el diálogo del sistema no compita con la voz.
    turnoRef.current += 1;
    setHablando(false);
    await voz.callar();
    activoRef.current = true;
    silenciadoRef.current = false;
    setSilenciado(false);
    // Al concederse, el efecto del permiso arranca la escucha.
    await permiso.pedir();
  };

  const alternarEscucha = async () => {
    if (permiso.estado === 'pendiente') return pedirPermiso();
    if (permiso.estado === 'bloqueado') return permiso.abrirAjustes();
    if (permiso.estado === 'cargando') return;

    const d = dictadoRef.current;
    if (d.grabando) {
      vibrar();
      const texto = await d.detenerYTranscribir();
      if (texto && montadoRef.current) {
        sendMessage(texto);
        // Si la app pasó a segundo plano mientras transcribía, el mensaje se
        // envía igual pero la respuesta no se lee sola.
        if (AppState.currentState === 'active') {
          activoRef.current = true;
          esperandoRespuestaRef.current = true;
        }
      }
      return;
    }
    if (d.transcribiendo || loading) return;
    silenciadoRef.current = false;
    setSilenciado(false);
    activoRef.current = true;
    await escuchar();
  };

  const alternarSilencio = async () => {
    if (silenciadoRef.current) {
      silenciadoRef.current = false;
      setSilenciado(false);
      activoRef.current = true;
      if (!loading && !dictadoRef.current.transcribiendo) await escuchar();
      return;
    }
    silenciadoRef.current = true;
    setSilenciado(true);
    turnoRef.current += 1;
    setHablando(false);
    await voz.callar();
    if (dictadoRef.current.grabando) await dictadoRef.current.cancelar();
  };

  const irAEscribir = async () => {
    await detener();
    const rutas = navigation.getState().routes;
    const anterior = rutas[rutas.length - 2];
    // Chat ya está debajo → se vuelve a él con el param (se actualiza);
    // si no, Voz se sustituye por Chat para no apilar pantallas.
    if (anterior?.name === 'Chat') navigation.popTo('Chat', { enfocar: true });
    else navigation.replace('Chat', { enfocar: true });
  };

  const pedirAyuda = async () => {
    await detener();
    navigation.navigate('CrisisProtocol');
  };

  /* ------------------------------------------------------------- Vista */

  const sinPermiso = permiso.estado === 'pendiente' || permiso.estado === 'bloqueado';

  const fase: FaseVoz = silenciado
    ? 'silenciado'
    : dictado.grabando
      ? 'grabando'
      : dictado.transcribiendo
        ? 'transcribiendo'
        : loading
          ? 'pensando'
          : hablando
            ? 'hablando'
            : permiso.estado === 'cargando'
              ? 'preparando'
              : sinPermiso
                ? 'sinPermiso'
                : 'esperando';

  const texto = TEXTOS[fase];
  const ocupado = fase === 'transcribiendo' || fase === 'pensando' || fase === 'preparando';
  const ultimoAsistente = ultimoDe(messages, 'assistant');
  const ultimoUsuario = ultimoDe(messages, 'user');
  const lineas = compacta ? 2 : 3;
  // Errores de grabación/transcripción (no los de permiso: eso lo explica la tarjeta).
  const errorVisible = dictado.error && fase === 'esperando' ? dictado.error : null;

  return (
    <Screen
      bg={colors.voiceBg}
      statusBar="light"
      edges={['top', 'left', 'right', 'bottom']}
      gap={0}
      contentStyle={{
        paddingTop: compacta ? 8 : 16,
        paddingBottom: compacta ? 12 : 24,
        alignItems: 'center',
      }}>
      {/* Android: iconos claros en la barra del sistema sobre el fondo oscuro.
          Al salir de la pantalla vuelve el estilo por defecto (oscuro sobre crema). */}
      <NavigationBar style="light" />
      {/* Cabecera */}
      <View
        style={{
          width: '100%',
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <IconButton
          name="chevronDown"
          accessibilityLabel="Cerrar modo voz"
          onPress={terminar}
          bg={colors.voiceSurface}
          color={colors.onDark}
          iconSize={20}
        />
        <View style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 2, paddingHorizontal: 8 }}>
          <Txt
            size={15}
            weight="semibold"
            color={colors.onDark}
            accessibilityRole="header"
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}>
            Hablando con {asistente.nombre}
          </Txt>
          <Txt
            size={12.5}
            color={colors.voiceMuted}
            maxFontSizeMultiplier={1.2}
            style={{ fontVariant: ['tabular-nums'] }}
            accessibilityLabel={`Duración ${mmss(segundos)}`}>
            {mmss(segundos)}
          </Txt>
        </View>
        <HelpButton variant="compact" onPress={pedirAyuda} />
      </View>

      {/* Zona central: se desplaza en pantallas muy bajas para que los
          controles de abajo sigan siempre visibles. */}
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          // En tablet el bloque central queda centrado en vertical, no pegado arriba.
          justifyContent: tablet ? 'center' : 'flex-start',
          paddingBottom: 8,
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Orbe */}
        <View style={{ marginTop: mini ? 12 : compacta ? 20 : 48 }}>
          <OrbeVoz
            fase={fase}
            escala={factorOrbe}
            onPress={alternarEscucha}
            disabled={ocupado}
            accessibilityLabel={ETIQUETA_ORBE[fase]}
            accessibilityHint={AYUDA_ORBE[fase]}
          />
        </View>

        {/* Estado */}
        <View
          accessibilityLiveRegion="polite"
          style={{ marginTop: mini ? 14 : compacta ? 20 : 28, alignItems: 'center', gap: 8 }}>
          <Txt
            size={mini ? 20 : 22}
            weight="semibold"
            tracking={-0.3}
            color={colors.onDark}
            align="center">
            {texto.titulo}
          </Txt>
          <Txt size={14} color={colors.voiceMuted} align="center">
            {texto.detalle}
          </Txt>
          {fase === 'grabando' ? (
            <Txt size={12.5} color={colors.voiceMuted} align="center">
              Toca el círculo cuando termines
            </Txt>
          ) : null}
          {errorVisible ? (
            <Txt size={13} color={colors.dangerSolid} align="center" accessibilityRole="alert">
              {errorVisible}
            </Txt>
          ) : null}
        </View>

        <View style={{ marginTop: mini ? 12 : compacta ? 16 : 22 }}>
          <OndaVoz fase={fase} />
        </View>

        {/* Permiso del micrófono (en lugar de la transcripción) */}
        {permiso.estado === 'pendiente' || permiso.estado === 'bloqueado' ? (
          <View style={{ marginTop: mini ? 12 : compacta ? 16 : 24, width: '100%' }}>
            <PermisoMicrofono
              tono="dark"
              estado={permiso.estado}
              onPedir={pedirPermiso}
              onAbrirAjustes={permiso.abrirAjustes}
            />
          </View>
        ) : ultimoAsistente || ultimoUsuario ? (
          /* Transcripción */
          <View
            style={{
              marginTop: mini ? 12 : compacta ? 16 : 24,
              width: '100%',
              backgroundColor: colors.voiceSurface,
              borderRadius: 20,
              paddingVertical: 14,
              paddingHorizontal: 16,
              gap: 10,
            }}>
            {ultimoAsistente ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Txt size={14} weight="semibold" color={colors.sage} leading={1.45}>
                  {asistente.nombre}
                </Txt>
                <Txt
                  size={14}
                  color={colors.voiceMuted}
                  leading={1.45}
                  numberOfLines={lineas}
                  style={{ flex: 1 }}>
                  {ultimoAsistente.content}
                </Txt>
              </View>
            ) : null}
            {ultimoUsuario ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Txt size={14} weight="semibold" color={colors.accent} leading={1.45}>
                  Tú
                </Txt>
                <Txt
                  size={14}
                  color={colors.onDark}
                  leading={1.45}
                  numberOfLines={lineas}
                  style={{ flex: 1 }}>
                  {ultimoUsuario.content}
                </Txt>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Controles: fuera del scroll, siempre visibles sobre la safe area. */}
      <View
        style={{
          paddingTop: compacta ? 12 : 16,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: mini ? 16 : 28,
        }}>
        <Control
          icon={silenciado ? 'volumeOff' : 'mic'}
          label={silenciado ? 'Reactivar' : 'Silenciar'}
          accessibilityLabel={
            silenciado ? 'Reactivar micrófono y voz' : 'Silenciar micrófono y voz'
          }
          onPress={alternarSilencio}
          size={escala(60)}
          activo={silenciado}
          bg={silenciado ? colors.onDark : colors.voiceSurface}
          color={silenciado ? colors.ink : colors.onDark}
        />
        <Control
          icon="close"
          label="Terminar"
          accessibilityLabel="Terminar conversación por voz"
          onPress={terminar}
          size={escala(mini ? 68 : 76)}
          bg={colors.dangerSolid}
          color={colors.ink}
          iconSize={26}
          strokeWidth={2.2}
        />
        <Control
          icon="keyboard"
          label="Escribir"
          accessibilityLabel="Cambiar a escribir en el chat"
          onPress={irAEscribir}
          size={escala(60)}
        />
      </View>
    </Screen>
  );
};
