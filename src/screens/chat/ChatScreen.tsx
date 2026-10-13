import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, KeyboardEvents } from 'react-native-keyboard-controller';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { ChatBubble } from '../../components/ChatBubble';
import { TypingIndicator } from '../../components/TypingIndicator';
import { CrisisAlert } from '../../components/CrisisAlert';
import { PermisoUbicacionHoja } from '../../components/PermisoUbicacion';
import { usePermisoUbicacion } from '../../hooks/usePermisoUbicacion';
import { ubicacionActual } from '../../services/ubicacion';
import { AccionesMensaje } from './components/AccionesMensaje';
import { RespuestasRapidas } from './components/RespuestasRapidas';
import { WelcomeModal } from '../../components/WelcomeModal';
import { PermisoMicrofono } from '../../components/PermisoMicrofono';
import { Button, Icon, Txt } from '../../components/ui';
import { colors } from '../../constants/colors';
import { asistente } from '../../constants/asistente';
import { fonts } from '../../constants/typography';
import { useChat } from '../../hooks/useChat';
import { useDictado } from '../../hooks/useDictado';
import { usePermisoMicrofono } from '../../hooks/usePermisoMicrofono';
import { ANCHO_MAXIMO, useLayout } from '../../hooks/useLayout';
import { storage } from '../../utils/storage';
import { locationService } from '../../services/location';
import { diagnosticoService, ProgresoTest } from '../../services/diagnostico';
import type { RootScreenProps } from '../../navigation/types';
import type { ChatMessage, MentalHealthCenter } from '../../types/chat';
import { ChatHeader } from './components/ChatHeader';
import { CentrosSheet } from './components/CentrosSheet';
import { AnotadoEnRegistro, ProgresoChequeo } from './components/ProgresoChequeo';
import { AvisoDespertando } from '../../components/AvisoDespertando';
import { SeparadorFecha, etiquetaFecha, necesitaSeparador } from './components/SeparadorFecha';

type Fila =
  | { tipo: 'fecha'; key: string; etiqueta: string }
  | { tipo: 'mensaje'; key: string; mensaje: ChatMessage };

/** Intercala separadores "Hoy · 23:14" al cambiar de día o tras una pausa larga. */
const conSeparadores = (mensajes: ChatMessage[]): Fila[] => {
  const filas: Fila[] = [];
  mensajes.forEach((m, i) => {
    if (necesitaSeparador(m.timestamp, mensajes[i - 1]?.timestamp)) {
      const etiqueta = etiquetaFecha(m.timestamp);
      if (etiqueta) filas.push({ tipo: 'fecha', key: `fecha-${m.id}`, etiqueta });
    }
    filas.push({ tipo: 'mensaje', key: m.id, mensaje: m });
  });
  return filas;
};

/** Toque háptico ligero; en dispositivos sin motor háptico no hace nada. */
const toque = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

/** Distancia (px) al final de la lista por debajo de la cual se sigue "pegado" al último mensaje. */
const UMBRAL_FINAL = 120;
/** Separación entre la barra de entrada y el teclado. */
const HOLGURA_BARRA = 10;
/** Altura máxima del campo antes de desplazarse por dentro (≈ 5 líneas). */
const ALTO_MAX_CAMPO = 120;
/**
 * iOS no presenta un Modal mientras otro se está cerrando: se espera a que
 * termine la animación de salida antes de abrir el siguiente.
 */
const TRAS_CERRAR_MODAL_MS = 350;
const trasCerrarModal = (fn: () => void) => setTimeout(fn, TRAS_CERRAR_MODAL_MS);
/** Padding lateral de la conversación. */
const MARGEN_LATERAL = 16;
/** Proporción del ancho de contenido que puede ocupar una burbuja… */
const PROPORCION_BURBUJA = 0.78;
/** Ancho de los botones de acción bajo una burbuja de la asistente. */
const PROPORCION_ACCIONES = 0.9;
/** …con techo para que en tablet no salgan renglones de 500 px (≈ 60 caracteres). */
const TECHO_BURBUJA = 440;
/** Columna centrada en tablet: el fondo sigue a pantalla completa. */
const COLUMNA = { width: '100%', maxWidth: ANCHO_MAXIMO, alignSelf: 'center' } as const;

export const ChatScreen: React.FC<RootScreenProps<'Chat'>> = ({ navigation, route }) => {
  const {
    messages,
    loading,
    restaurando,
    protocoloCrisisActivo,
    testCompleto,
    resultado,
    ubicacionSolicitada,
    sendMessage,
    closeCrisisModal,
    clearUbicacionSolicitada,
  } = useChat();

  const insets = useSafeAreaInsets();
  const { anchoContenido, ios } = useLayout();
  const dictado = useDictado();
  const permiso = usePermisoMicrofono();
  const permisoUbicacion = usePermisoUbicacion();

  const [texto, setTexto] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCentros, setShowCentros] = useState(false);
  const [centros, setCentros] = useState<MentalHealthCenter[]>([]);
  const [progreso, setProgreso] = useState<ProgresoTest | null>(null);
  const [anotado, setAnotado] = useState(false);
  const [pidiendoPermiso, setPidiendoPermiso] = useState(false);

  const listRef = useRef<FlatList<Fila>>(null);
  const inputRef = useRef<TextInput>(null);
  const alFinalRef = useRef(true);
  const registradosRef = useRef<number | null>(null);
  const cancelarDictadoRef = useRef(dictado.cancelar);

  useEffect(() => {
    cancelarDictadoRef.current = dictado.cancelar;
  }, [dictado.cancelar]);

  const filas = useMemo(() => conSeparadores(messages), [messages]);

  const irAlFinal = useCallback((animated = true) => {
    listRef.current?.scrollToEnd({ animated });
  }, []);

  // Bienvenida la primera vez.
  useEffect(() => {
    storage.isOnboarded().then((done) => {
      if (!done) setShowWelcome(true);
    });
  }, []);

  // Al abrir el teclado se muestra el último mensaje (eventos de keyboard-controller:
  // fiables también en Android edge-to-edge).
  useEffect(() => {
    const sub = KeyboardEvents.addListener('keyboardDidShow', () => {
      alFinalRef.current = true;
      irAlFinal();
    });
    return () => sub.remove();
  }, [irAlFinal]);

  // Desde Voz se entra (o se vuelve con `popTo('Chat', { enfocar: true })`, sin
  // remontar la pantalla) con el teclado arriba. Se observa el parámetro y se
  // enfoca al terminar la transición (un `autoFocus` durante la animación falla en
  // Android); luego se limpia para no reenfocar en cada visita.
  const enfocar = route.params?.enfocar === true;
  useEffect(() => {
    if (!enfocar) return;
    let hecho = false;
    const enfocarYa = () => {
      if (hecho) return;
      hecho = true;
      inputRef.current?.focus();
      navigation.setParams({ enfocar: undefined });
    };
    const unsub = navigation.addListener('transitionEnd', (e) => {
      if (!e.data.closing) enfocarYa();
    });
    // Respaldo si no llega `transitionEnd` (sin animación o ya terminada).
    const t = setTimeout(enfocarYa, 500);
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, [enfocar, navigation]);

  // Al salir no debe quedar el micrófono abierto.
  useEffect(() => {
    return () => {
      cancelarDictadoRef.current();
    };
  }, []);

  // Avance del chequeo: se consulta al entrar y cada vez que la asistente responde.
  useEffect(() => {
    if (loading) return;
    let activo = true;

    const cargar = async () => {
      // `await` de entrada; sin ficha (o sin backend) no se muestra la tarjeta.
      const ficha = await diagnosticoService.obtener().catch(() => null);
      if (!activo || !ficha) return;
      const previo = registradosRef.current;
      registradosRef.current = ficha.progreso.registrados;
      setProgreso(ficha.progreso);
      if (previo !== null && ficha.progreso.registrados > previo) setAnotado(true);
    };

    cargar();
    return () => {
      activo = false;
    };
  }, [loading]);

  // Desplazarse al final cuando llega algo nuevo.
  useEffect(() => {
    const t = setTimeout(() => irAlFinal(), 100);
    return () => clearTimeout(t);
  }, [messages, loading, anotado, irAlFinal]);

  // Al completar el chequeo se abre el resultado.
  useEffect(() => {
    if (testCompleto && resultado) {
      navigation.navigate('Result', { resultado });
    }
  }, [testCompleto, resultado, navigation]);

  const alDesplazar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    alFinalRef.current =
      contentSize.height - layoutMeasurement.height - contentOffset.y < UMBRAL_FINAL;
  };

  const enviar = () => {
    const limpio = texto.trim();
    if (!limpio || loading) return;
    toque();
    setTexto('');
    setAnotado(false);
    alFinalRef.current = true;
    sendMessage(limpio);
  };

  // Dictado: graba, transcribe en el backend y rellena el campo para revisar antes de enviar.
  const empezarDictado = async () => {
    const ok = await dictado.iniciar();
    if (ok) toque();
  };

  const alternarDictado = async () => {
    if (dictado.transcribiendo) return;
    if (dictado.grabando) {
      toque();
      const dicho = await dictado.detenerYTranscribir();
      if (dicho) setTexto((prev) => (prev.trim() ? `${prev.trim()} ${dicho}` : dicho));
      return;
    }
    // Se explica para qué es el micrófono antes del diálogo del sistema.
    if (permiso.estado !== 'concedido') {
      Keyboard.dismiss(); // deja sitio a la explicación en pantallas bajas
      setPidiendoPermiso(true);
      return;
    }
    await empezarDictado();
  };

  const concederMicrofono = async () => {
    if (await permiso.pedir()) {
      setPidiendoPermiso(false);
      await empezarDictado();
    }
  };

  const tarjetaPermiso =
    pidiendoPermiso && (permiso.estado === 'bloqueado' ? 'bloqueado' : 'pendiente');
  const mostrarTarjetaPermiso = pidiendoPermiso && permiso.estado !== 'concedido';

  // --- Ubicación (la pide el backend, o el usuario desde el aviso de crisis) ---
  // Con el permiso concedido la app ya manda lat/lon en cada mensaje (ChatContext),
  // así que la tarjeta sólo aparece si falta el permiso.
  const sinPermisoUbicacion =
    permisoUbicacion.estado === 'pendiente' || permisoUbicacion.estado === 'bloqueado';
  const hojaUbicacionVisible = (showLocationModal || ubicacionSolicitada) && sinPermisoUbicacion;

  // Si el permiso se activó (p. ej. desde Ajustes) con la petición manual abierta,
  // se descarta la petición (estado derivado durante el render, sin efecto).
  if (showLocationModal && permisoUbicacion.estado === 'concedido') {
    setShowLocationModal(false);
  }

  const cerrarLocationModal = () => {
    setShowLocationModal(false);
    clearUbicacionSolicitada();
  };

  const mostrarCentros = () => {
    setCentros(locationService.getNearbyCenters());
    setShowCentros(true);
  };

  const compartirUbicacion = async () => {
    const loc = await ubicacionActual();
    if (loc) {
      sendMessage('He compartido mi ubicación para buscar centros cercanos.', loc.lat, loc.lon);
    }
  };

  // Funciones del contexto en una ref: el efecto de abajo sólo depende del permiso.
  const compartirRef = useRef(compartirUbicacion);
  const limpiarSolicitudRef = useRef(clearUbicacionSolicitada);
  useEffect(() => {
    compartirRef.current = compartirUbicacion;
    limpiarSolicitudRef.current = clearUbicacionSolicitada;
  });

  // El backend pidió la ubicación pero el permiso ya está (o se acaba de activar
  // en Ajustes): no hace falta preguntar, se comparte directamente.
  useEffect(() => {
    if (!ubicacionSolicitada || permisoUbicacion.estado !== 'concedido') return;
    limpiarSolicitudRef.current();
    compartirRef.current();
  }, [ubicacionSolicitada, permisoUbicacion.estado]);

  const concederUbicacion = async () => {
    // Se cierra antes del diálogo del sistema: así el efecto de arriba no
    // vuelve a compartir cuando el permiso pase a `concedido`.
    cerrarLocationModal();
    const estado = await permisoUbicacion.pedir();
    trasCerrarModal(mostrarCentros);
    if (estado === 'concedido') await compartirUbicacion();
  };

  const denegarUbicacion = () => {
    cerrarLocationModal();
    trasCerrarModal(mostrarCentros);
  };

  // Desde el aviso de crisis: se cierra el aviso (sigue a un toque en "Ayuda ya") y luego
  // se pregunta por la ubicación; dos Modal a la vez fallan en iOS. Con el permiso
  // concedido se va directo a los centros.
  const pedirUbicacionDesdeCrisis = () => {
    closeCrisisModal();
    if (permisoUbicacion.estado === 'concedido') trasCerrarModal(mostrarCentros);
    else trasCerrarModal(() => setShowLocationModal(true));
  };

  const abrirProtocolo = () => {
    closeCrisisModal();
    navigation.navigate('CrisisProtocol');
  };

  const volver = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainApp', { screen: 'InicioTab' });
  };

  const puedeEnviar = Boolean(texto.trim()) && !loading;
  const mostrarProgreso =
    !!progreso &&
    !testCompleto &&
    progreso.registrados > 0 &&
    progreso.registrados < progreso.total;

  // Ancho de burbuja proporcional al contenido (360 px → 253, 430 px → 310), con techo.
  const anchoBurbuja = Math.min(
    TECHO_BURBUJA,
    Math.round((anchoContenido - MARGEN_LATERAL * 2) * PROPORCION_BURBUJA)
  );

  // Los botones de acción pueden ser algo más anchos que la burbuja (caben dos píldoras).
  const anchoAcciones = Math.min(
    TECHO_BURBUJA,
    Math.round((anchoContenido - MARGEN_LATERAL * 2) * PROPORCION_ACCIONES)
  );

  // Respuestas rápidas (v5): sólo bajo el ÚLTIMO mensaje, si es de la asistente y
  // no se está esperando otra respuesta. Al enviar algo deja de ser el último y
  // desaparecen. Los mensajes restaurados nunca las traen (no se guardan).
  const ultimo = messages[messages.length - 1];
  const idConOpciones =
    !loading && ultimo?.role === 'assistant' && ultimo.opciones?.length ? ultimo.id : null;

  const responderOpcion = (opcion: string) => {
    if (loading) return;
    setAnotado(false);
    alFinalRef.current = true;
    sendMessage(opcion);
  };

  const renderFila = ({ item }: { item: Fila }) => {
    if (item.tipo === 'fecha') return <SeparadorFecha etiqueta={item.etiqueta} />;
    const { mensaje } = item;
    const acciones = mensaje.role === 'assistant' ? mensaje.acciones : undefined;
    const opciones = mensaje.id === idConOpciones ? mensaje.opciones : undefined;
    if (!acciones?.length && !opciones?.length) {
      return <ChatBubble message={mensaje} anchoMaximo={anchoBurbuja} />;
    }
    return (
      <View style={{ gap: 8 }}>
        <ChatBubble message={mensaje} anchoMaximo={anchoBurbuja} />
        {acciones?.length ? (
          <AccionesMensaje acciones={acciones} anchoMaximo={anchoAcciones} />
        ) : null}
        {opciones?.length ? (
          <RespuestasRapidas
            opciones={opciones}
            onElegir={responderOpcion}
            anchoMaximo={anchoAcciones}
          />
        ) : null}
      </View>
    );
  };

  // Respuesta al toque: onda sutil en Android, opacidad en iOS.
  const rippleClaro = { color: colors.ripple, foreground: true } as const;

  const estadoDictado = dictado.grabando
    ? 'Te escucho… toca el micrófono para terminar'
    : dictado.transcribiendo
      ? 'Transcribiendo…'
      : dictado.error;

  /*
   * Barra de entrada sobre la safe area y sobre el teclado, sin hueco doble.
   *
   * El KeyboardAvoidingView de keyboard-controller añade como padding inferior
   *   (y + alto del KAV) − (altoPantalla − altoTeclado − keyboardVerticalOffset).
   * El KAV termina en el borde inferior de la pantalla (SafeAreaView sin `bottom`
   * a pantalla completa: iOS siempre, Android porque SDK 56+ es edge-to-edge),
   * así que el padding es `altoTeclado + offset`.
   *
   * `altoTeclado` se mide desde el borde inferior de la pantalla en ambos
   * sistemas: en iOS incluye la zona del home indicator; en Android incluye la
   * barra de gestos o de 3 botones porque `KeyboardProvider` va con
   * `navigationBarTranslucent` (si no, keyboard-controller le restaría la barra).
   *
   * La barra reserva siempre `holguraInferior` (= inset inferior: home
   * indicator ≈ 34, gestos Android ≈ 16–24, 3 botones ≈ 48, o 8 si no hay) para
   * no quedar bajo esa zona con el teclado cerrado. Con el teclado abierto esa
   * reserva ya está "dentro" del alto del teclado, por eso el offset es
   * `-holguraInferior`: padding = altoTeclado − holgura, y la píldora queda a
   * altoTeclado − holgura + holgura + HOLGURA_BARRA = altoTeclado + 10 px del
   * borde, es decir, a 10 px del teclado en iPhone con/sin home indicator y en
   * Android con gestos o con 3 botones. Con offset 0 aparecería un hueco del
   * tamaño de la safe area entre el teclado y la barra.
   */
  const holguraInferior = Math.max(insets.bottom, 8);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={-holguraInferior}>
        <ChatHeader
          escribiendo={loading}
          onBack={volver}
          onVoz={() => navigation.navigate('Voz')}
          onAyuda={() => navigation.navigate('CrisisProtocol')}
        />

        {mostrarProgreso && (
          <View style={[COLUMNA, { paddingHorizontal: MARGEN_LATERAL, paddingTop: 12 }]}>
            <ProgresoChequeo progreso={progreso} />
          </View>
        )}

        {restaurando ? (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}
            accessibilityLiveRegion="polite">
            <ActivityIndicator color={colors.forest} />
            <Txt size={13.5} color={colors.inkSoft}>
              Recuperando tu conversación…
            </Txt>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={filas}
            keyExtractor={(f) => f.key}
            renderItem={renderFila}
            // Las respuestas rápidas dependen de `loading`, no sólo de los datos.
            extraData={idConOpciones}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            // La lista ocupa todo el ancho (se desplaza tocando en cualquier sitio);
            // su contenido es una columna centrada de ANCHO_MAXIMO en tablet.
            contentContainerStyle={[
              COLUMNA,
              {
                flexGrow: 1,
                justifyContent: 'flex-end',
                paddingTop: 16,
                paddingHorizontal: MARGEN_LATERAL,
                paddingBottom: 12,
              },
            ]}
            ListFooterComponent={
              loading || anotado ? (
                <View style={{ paddingTop: 12, gap: 12 }}>
                  {anotado && (
                    <AnotadoEnRegistro
                      onPress={() => navigation.navigate('MainApp', { screen: 'RegistroTab' })}
                    />
                  )}
                  {loading && <TypingIndicator />}
                  <AvisoDespertando activo={loading} align="left" />
                </View>
              ) : null
            }
            onScroll={alDesplazar}
            scrollEventThrottle={100}
            onContentSizeChange={() => {
              if (alFinalRef.current) irAlFinal(false);
            }}
            // La lista se encoge mientras sube el teclado: se mantiene pegada al final.
            onLayout={() => {
              if (alFinalRef.current) irAlFinal(false);
            }}
            keyboardShouldPersistTaps="handled"
            // 'interactive' sólo existe en iOS; en Android el teclado se cierra al arrastrar.
            keyboardDismissMode={ios ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Barra de entrada: fondo y borde a todo el ancho, controles en la columna centrada. */}
        <View
          style={{
            flexShrink: 0,
            paddingTop: HOLGURA_BARRA,
            paddingBottom: holguraInferior + HOLGURA_BARRA,
            borderTopWidth: 1,
            borderTopColor: colors.divider,
            backgroundColor: colors.background,
          }}>
          <View style={[COLUMNA, { paddingHorizontal: 12, gap: 8 }]}>
            {mostrarTarjetaPermiso && tarjetaPermiso ? (
              <View style={{ gap: 4 }}>
                <PermisoMicrofono
                  estado={tarjetaPermiso}
                  onPedir={concederMicrofono}
                  onAbrirAjustes={permiso.abrirAjustes}
                />
                <Button
                  label="Ahora no"
                  variant="ghost"
                  size="sm"
                  onPress={() => setPidiendoPermiso(false)}
                />
              </View>
            ) : null}

            {estadoDictado ? (
              <Txt
                size={12.5}
                color={dictado.error && !dictado.grabando ? colors.dangerInk : colors.inkSoft}
                align="center"
                accessibilityLiveRegion="polite">
                {estadoDictado}
              </Txt>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              {/* Toda la píldora enfoca el campo (no sólo la línea del texto). */}
              <Pressable
                onPress={() => inputRef.current?.focus()}
                accessible={false}
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 48,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  paddingHorizontal: 18,
                  justifyContent: 'center',
                }}>
                <TextInput
                  ref={inputRef}
                  value={texto}
                  onChangeText={setTexto}
                  placeholder={
                    loading ? `${asistente.nombre} está escribiendo…` : 'Escribe lo que sientes…'
                  }
                  placeholderTextColor={colors.inkSoft}
                  accessibilityLabel="Mensaje"
                  accessibilityHint="Escribe y pulsa Enviar"
                  multiline
                  maxLength={1000}
                  autoCapitalize="sentences"
                  autoCorrect
                  autoComplete="off"
                  textContentType="none"
                  // Multilínea: Intro hace salto de línea; se envía con el botón.
                  returnKeyType="default"
                  submitBehavior="newline"
                  enablesReturnKeyAutomatically
                  // Mismo techo que `Txt`/`TextField`: respeta la fuente del sistema sin romper la píldora.
                  maxFontSizeMultiplier={1.35}
                  style={{
                    maxHeight: ALTO_MAX_CAMPO,
                    paddingTop: 12,
                    paddingBottom: 12,
                    paddingHorizontal: 0,
                    fontFamily: fonts.regular,
                    fontSize: 15,
                    lineHeight: 20,
                    color: colors.ink,
                    textAlignVertical: 'center',
                  }}
                />
              </Pressable>

              <Pressable
                onPress={alternarDictado}
                disabled={dictado.transcribiendo}
                accessibilityRole="button"
                accessibilityLabel={
                  dictado.grabando ? 'Terminar de dictar' : 'Dictar mensaje por voz'
                }
                accessibilityState={{ busy: dictado.transcribiendo, selected: dictado.grabando }}
                android_ripple={rippleClaro}
                style={({ pressed }) => ({
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  overflow: 'hidden', // recorta la onda de Android al círculo
                  backgroundColor: dictado.grabando ? colors.forest : colors.surface,
                  borderWidth: dictado.grabando ? 0 : 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  opacity: ios && pressed ? 0.8 : 1,
                })}>
                {dictado.transcribiendo ? (
                  <ActivityIndicator color={colors.forest} />
                ) : (
                  <Icon
                    name={dictado.grabando ? 'stop' : 'mic'}
                    size={20}
                    color={dictado.grabando ? colors.onDark : colors.ink}
                  />
                )}
              </Pressable>

              <Pressable
                onPress={enviar}
                disabled={!puedeEnviar}
                accessibilityRole="button"
                accessibilityLabel="Enviar"
                accessibilityState={{ disabled: !puedeEnviar }}
                android_ripple={{ color: colors.rippleOnDark, foreground: true }}
                style={({ pressed }) => ({
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  overflow: 'hidden',
                  backgroundColor: colors.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  opacity: !puedeEnviar ? 0.45 : ios && pressed ? 0.85 : 1,
                })}>
                <Icon name="arrowUp" size={18} color={colors.onDark} strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <CrisisAlert
        visible={protocoloCrisisActivo}
        onClose={closeCrisisModal}
        onRequestLocation={pedirUbicacionDesdeCrisis}
        onOpenProtocol={abrirProtocolo}
      />

      <WelcomeModal
        visible={showWelcome}
        onClose={() => {
          setShowWelcome(false);
          storage.setOnboarded();
        }}
      />

      <PermisoUbicacionHoja
        visible={hojaUbicacionVisible}
        estado={permisoUbicacion.estado === 'bloqueado' ? 'bloqueado' : 'pendiente'}
        onPedir={concederUbicacion}
        onAbrirAjustes={permisoUbicacion.abrirAjustes}
        onCerrar={denegarUbicacion}
      />

      <CentrosSheet visible={showCentros} centros={centros} onClose={() => setShowCentros(false)} />
    </SafeAreaView>
  );
};
