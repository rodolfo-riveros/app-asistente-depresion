import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { SpatialContainer } from '../../components/SpatialContainer';
import { Glass, GlassScrim } from '../../components/Glass';
import { GlassCard } from '../../components/GlassCard';
import { AuthButton } from '../../components/AuthButton';
import { AuthInput } from '../../components/AuthInput';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { glassGlow } from '../../constants/glass';
import { Actividad, CategoriaActividad, actividadesService } from '../../services/actividades';

type Filtro = 'pendientes' | 'vencidas' | 'completadas';

const FILTROS: { clave: Filtro; etiqueta: string }[] = [
  { clave: 'pendientes', etiqueta: 'Pendientes' },
  { clave: 'vencidas', etiqueta: 'Vencidas' },
  { clave: 'completadas', etiqueta: 'Hechas' },
];

interface EstiloCategoria {
  clave: CategoriaActividad;
  etiqueta: string;
  icono: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CATEGORIAS: EstiloCategoria[] = [
  { clave: 'autocuidado', etiqueta: 'Autocuidado', icono: 'leaf-outline', color: colors.secondary },
  { clave: 'social', etiqueta: 'Social', icono: 'people-outline', color: colors.primary },
  { clave: 'estudio', etiqueta: 'Estudio', icono: 'book-outline', color: colors.tertiary },
  { clave: 'salud', etiqueta: 'Salud', icono: 'heart-outline', color: colors.accent },
  { clave: 'ocio', etiqueta: 'Ocio', icono: 'musical-notes-outline', color: colors.accentWarm },
  { clave: 'general', etiqueta: 'General', icono: 'sparkles-outline', color: colors.textSecondary },
];

const CATEGORIA_POR_DEFECTO = CATEGORIAS[CATEGORIAS.length - 1];

const categoriaDe = (clave?: string): EstiloCategoria =>
  CATEGORIAS.find((c) => c.clave === clave) ?? CATEGORIA_POR_DEFECTO;

const PLAZOS: { dias: number; etiqueta: string }[] = [
  { dias: 0, etiqueta: 'Hoy' },
  { dias: 1, etiqueta: 'Mañana' },
  { dias: 3, etiqueta: 'En 3 días' },
  { dias: 7, etiqueta: 'La próxima semana' },
];

const BORRADOR_INICIAL = {
  titulo: '',
  nota: '',
  categoria: 'general' as CategoriaActividad,
  dias: 1,
};

const MS_DIA = 86400000;
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
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

const inicioDelDia = (fecha: Date) =>
  new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();

/**
 * Fechas en lenguaje cercano ("mañana", "hace 3 días").
 * Un compromiso se vive en días, no en timestamps: la fecha cruda distancia.
 */
const fechaRelativa = (iso?: string | null): string | null => {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;

  const dias = Math.round((inicioDelDia(fecha) - inicioDelDia(new Date())) / MS_DIA);
  // La hora sólo se menciona si se fijó una: medianoche significa "ese día".
  const hora =
    fecha.getHours() === 0 && fecha.getMinutes() === 0
      ? ''
      : ` a las ${fecha.toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}`;

  if (dias === 0) return `hoy${hora}`;
  if (dias === 1) return `mañana${hora}`;
  if (dias === 2) return `pasado mañana${hora}`;
  if (dias > 2 && dias < 7) return `el ${DIAS_SEMANA[fecha.getDay()]}${hora}`;
  if (dias >= 7 && dias < 14) return 'la próxima semana';
  if (dias === -1) return `ayer${hora}`;
  if (dias < -1 && dias > -7) return `hace ${-dias} días`;
  if (dias <= -7 && dias > -30) {
    const semanas = Math.round(-dias / 7);
    return semanas === 1 ? 'hace una semana' : `hace ${semanas} semanas`;
  }
  return `el ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
};

/** Fecha objetivo de un plazo rápido: al final del día, para no nacer vencida. */
const dentroDe = (dias: number): string => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(20, 0, 0, 0);
  return fecha.toISOString();
};

const esVencida = (actividad: Actividad) => !actividad.completada && Boolean(actividad.vencida);

/** ¿La actividad sigue perteneciendo al grupo que se está viendo? */
const encajaEn = (actividad: Actividad, filtro: Filtro) =>
  filtro === 'completadas'
    ? actividad.completada
    : filtro === 'vencidas'
      ? esVencida(actividad)
      : !actividad.completada;

const mensajeDe = (error: unknown) =>
  error instanceof Error ? error.message : 'Inténtalo de nuevo en un momento.';

const VACIOS: Record<
  Filtro,
  { icono: keyof typeof Ionicons.glyphMap; titulo: string; texto: string }
> = {
  pendientes: {
    icono: 'sparkles-outline',
    titulo: 'Todavía no hay nada acordado',
    texto:
      'Cuando converses con {asistente.nombre} y decidan juntos un paso pequeño, lo vas a encontrar aquí.',
  },
  vencidas: {
    icono: 'heart-outline',
    titulo: 'Nada se te quedó atrás',
    texto:
      'Si alguna vez se pasa la fecha, aparece aquí sin reproches: para retomarlo cuando puedas.',
  },
  completadas: {
    icono: 'checkmark-circle-outline',
    titulo: 'Aún no marcaste nada como hecho',
    texto: 'Cada cosa que completes se queda aquí, para que puedas mirar atrás y verlo.',
  },
};

export const ActividadesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<Record<string, undefined>>>();
  const [filtro, setFiltro] = useState<Filtro>('pendientes');
  const [items, setItems] = useState<Actividad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [borrador, setBorrador] = useState(BORRADOR_INICIAL);

  /**
   * El primer `await` va antes de cualquier setState: el linter prohíbe
   * actualizaciones síncronas disparadas desde un efecto.
   */
  const cargar = useCallback(async (estado: Filtro) => {
    try {
      const datos = await actividadesService.listar(estado);
      setItems(datos);
      setError(null);
    } catch (e) {
      setItems([]);
      setError(mensajeDe(e));
    } finally {
      setCargando(false);
    }
  }, []);

  // Se recarga al volver a la pestaña: lo que acuerdes en el chat aparece solo.
  useFocusEffect(
    useCallback(() => {
      cargar(filtro);
    }, [cargar, filtro])
  );

  const refrescar = () => {
    setRefrescando(true);
    cargar(filtro).finally(() => setRefrescando(false));
  };

  const cambiarFiltro = (siguiente: Filtro) => {
    if (siguiente === filtro) return;
    setCargando(true);
    setItems([]);
    setFiltro(siguiente);
  };

  const alternarHecha = async (actividad: Actividad) => {
    const previas = items;
    const completada = !actividad.completada;
    const optimista: Actividad = {
      ...actividad,
      completada,
      completada_en: completada ? new Date().toISOString() : null,
      vencida: completada ? false : actividad.vencida,
    };

    // Optimista: el toque se siente inmediato y se revierte si el backend falla.
    setItems((prev) =>
      prev.flatMap((a) =>
        a.id !== actividad.id ? [a] : encajaEn(optimista, filtro) ? [optimista] : []
      )
    );

    try {
      const actualizada = await actividadesService.completar(actividad.id, completada);
      setItems((prev) => prev.map((a) => (a.id === actividad.id ? actualizada : a)));
    } catch (e) {
      setItems(previas);
      Alert.alert('No se pudo actualizar', mensajeDe(e));
    }
  };

  const borrar = async (actividad: Actividad) => {
    const previas = items;
    setItems((prev) => prev.filter((a) => a.id !== actividad.id));
    try {
      await actividadesService.eliminar(actividad.id);
    } catch (e) {
      setItems(previas);
      Alert.alert('No se pudo borrar', mensajeDe(e));
    }
  };

  const confirmarBorrado = (actividad: Actividad) => {
    Alert.alert('¿Quitarlo de tu lista?', `«${actividad.titulo}» dejará de aparecer aquí.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => borrar(actividad) },
    ]);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setBorrador(BORRADOR_INICIAL);
  };

  const guardarNueva = async () => {
    const titulo = borrador.titulo.trim();
    if (!titulo) return;

    setGuardando(true);
    try {
      await actividadesService.crear({
        titulo,
        nota: borrador.nota.trim() || undefined,
        categoria: borrador.categoria,
        para_cuando: dentroDe(borrador.dias),
      });
      setModalVisible(false);
      setBorrador(BORRADOR_INICIAL);
      setFiltro('pendientes');
      await cargar('pendientes');
    } catch (e) {
      Alert.alert('No se pudo guardar', mensajeDe(e));
    } finally {
      setGuardando(false);
    }
  };

  const renderTarjeta = (actividad: Actividad) => {
    const categoria = categoriaDe(actividad.categoria);
    const vencida = esVencida(actividad);
    const relativa = fechaRelativa(
      actividad.completada
        ? (actividad.completada_en ?? actividad.para_cuando)
        : actividad.para_cuando
    );
    const cuando = !relativa
      ? 'Sin fecha fija'
      : actividad.completada
        ? `Hecho ${relativa}`
        : vencida
          ? `Se pasó ${relativa}`
          : `Para ${relativa}`;
    const colorCuando = vencida
      ? colors.warning
      : actividad.completada
        ? colors.secondary
        : colors.textMuted;

    return (
      <GlassCard
        level="low"
        radius={spacing.borderRadiusSm}
        style={styles.tarjeta}
        contentStyle={styles.tarjetaContenido}
        glowColor={vencida ? colors.warning : undefined}>
        <View style={styles.filaPrincipal}>
          <Pressable
            onPress={() => alternarHecha(actividad)}
            hitSlop={10}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: actividad.completada }}
            accessibilityLabel={
              actividad.completada
                ? `Desmarcar: ${actividad.titulo}`
                : `Marcar como hecho: ${actividad.titulo}`
            }
            style={({ pressed }) => [styles.marca, pressed && styles.presionado]}>
            <Ionicons
              name={actividad.completada ? 'checkmark-circle' : 'ellipse-outline'}
              size={26}
              color={
                actividad.completada ? colors.secondary : vencida ? colors.warning : colors.primary
              }
            />
          </Pressable>

          <View style={styles.textos}>
            <Text style={[styles.titulo, actividad.completada && styles.tituloHecho]}>
              {actividad.titulo}
            </Text>
            {actividad.nota ? <Text style={styles.nota}>{actividad.nota}</Text> : null}

            <View style={styles.metaFila}>
              <View style={styles.chip}>
                <Ionicons name={categoria.icono} size={11} color={categoria.color} />
                <Text style={[styles.chipTexto, { color: categoria.color }]}>
                  {categoria.etiqueta}
                </Text>
              </View>
              <View style={styles.cuandoFila}>
                <Ionicons
                  name={vencida ? 'alert-circle-outline' : 'time-outline'}
                  size={12}
                  color={colorCuando}
                />
                <Text style={[styles.cuando, { color: colorCuando }]}>{cuando}</Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => confirmarBorrado(actividad)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Quitar de la lista: ${actividad.titulo}`}
            style={({ pressed }) => [styles.borrar, pressed && styles.presionado]}>
            <Ionicons name="close" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {actividad.motivo_no_realizada ? (
          <View style={styles.motivo}>
            <Text style={styles.motivoEtiqueta}>Lo que contaste</Text>
            <Text style={styles.motivoTexto}>{actividad.motivo_no_realizada}</Text>
          </View>
        ) : null}
      </GlassCard>
    );
  };

  const vacio = VACIOS[filtro];

  return (
    <SpatialContainer>
      <View style={styles.contenedor}>
        <View style={styles.cabecera}>
          <View style={styles.cabeceraTextos}>
            <Text style={styles.tituloPantalla}>Tus acuerdos</Text>
            <Text style={styles.subtitulo}>Lo que fuiste decidiendo en tus conversaciones</Text>
          </View>
          <Pressable
            onPress={() => setModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Añadir un acuerdo"
            style={({ pressed }) => [styles.botonAnadir, pressed && styles.presionado]}>
            <Ionicons name="add" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <Glass
          level="low"
          radius={spacing.borderRadiusSm}
          contentStyle={styles.segmentos}
          style={styles.segmentosCaja}>
          {FILTROS.map((f) => {
            const activo = f.clave === filtro;
            return (
              <Pressable
                key={f.clave}
                onPress={() => cambiarFiltro(f.clave)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activo }}
                accessibilityLabel={`Ver ${f.etiqueta.toLowerCase()}`}
                style={[styles.segmento, activo && styles.segmentoActivo]}>
                <Text style={[styles.segmentoTexto, activo && styles.segmentoTextoActivo]}>
                  {f.etiqueta}
                </Text>
              </Pressable>
            );
          })}
        </Glass>

        {error ? (
          <View style={styles.avisoFila}>
            <Ionicons name="cloud-offline-outline" size={14} color={colors.textMuted} />
            <Text style={styles.avisoTexto}> {error}</Text>
          </View>
        ) : null}

        {cargando ? (
          <View style={styles.centrado}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : items.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.listaVacia}
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={refrescar}
                tintColor={colors.primary}
              />
            }>
            <GlassCard
              level="low"
              radius={spacing.borderRadiusSm}
              contentStyle={styles.vacioContenido}>
              <Ionicons name={vacio.icono} size={44} color={colors.primary} />
              <Text style={styles.vacioTitulo}>{vacio.titulo}</Text>
              <Text style={styles.vacioTexto}>{vacio.texto}</Text>
              {filtro === 'pendientes' ? (
                <AuthButton
                  variant="secondary"
                  label="Abrir el chat"
                  onPress={() => navigation.navigate('ChatTab')}
                  style={styles.vacioBoton}
                />
              ) : null}
            </GlassCard>
          </ScrollView>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderTarjeta(item)}
            contentContainerStyle={styles.lista}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={refrescar}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>

      {/* Añadir a mano: no todo se acuerda hablando */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={cerrarModal}>
        <GlassScrim>
          <KeyboardAvoidingView
            style={styles.modalCaja}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Glass
              level="high"
              radius={spacing.borderRadiusSm}
              contentStyle={styles.modalContenido}>
              <View style={styles.modalCabecera}>
                <Text style={styles.modalTitulo}>Un nuevo acuerdo</Text>
                <Pressable
                  onPress={cerrarModal}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                  style={({ pressed }) => [pressed && styles.presionado]}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <Text style={styles.modalAyuda}>
                  Algo pequeño y concreto que quieras probar estos días.
                </Text>

                <AuthInput
                  label="¿Qué quieres hacer?"
                  placeholder="Salir a caminar por el centro"
                  value={borrador.titulo}
                  autoCapitalize="sentences"
                  onChangeText={(t) => setBorrador((b) => ({ ...b, titulo: t }))}
                />
                <AuthInput
                  label="Una nota para ti (opcional)"
                  placeholder="Para probar hacer cosas por mi cuenta"
                  value={borrador.nota}
                  autoCapitalize="sentences"
                  multiline
                  onChangeText={(t) => setBorrador((b) => ({ ...b, nota: t }))}
                />

                <Text style={styles.grupoEtiqueta}>¿De qué se trata?</Text>
                <View style={styles.grupoChips}>
                  {CATEGORIAS.map((c) => {
                    const activo = c.clave === borrador.categoria;
                    return (
                      <Pressable
                        key={c.clave}
                        onPress={() => setBorrador((b) => ({ ...b, categoria: c.clave }))}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: activo }}
                        accessibilityLabel={c.etiqueta}
                        style={[styles.opcion, activo && styles.opcionActiva]}>
                        <Ionicons name={c.icono} size={13} color={c.color} />
                        <Text style={[styles.opcionTexto, activo && styles.opcionTextoActivo]}>
                          {c.etiqueta}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.grupoEtiqueta}>¿Para cuándo?</Text>
                <View style={styles.grupoChips}>
                  {PLAZOS.map((p) => {
                    const activo = p.dias === borrador.dias;
                    return (
                      <Pressable
                        key={p.dias}
                        onPress={() => setBorrador((b) => ({ ...b, dias: p.dias }))}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: activo }}
                        accessibilityLabel={p.etiqueta}
                        style={[styles.opcion, activo && styles.opcionActiva]}>
                        <Text style={[styles.opcionTexto, activo && styles.opcionTextoActivo]}>
                          {p.etiqueta}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              <AuthButton
                label="Guardar"
                loading={guardando}
                disabled={!borrador.titulo.trim()}
                onPress={guardarNueva}
                style={styles.modalBoton}
              />
            </Glass>
          </KeyboardAvoidingView>
        </GlassScrim>
      </Modal>
    </SpatialContainer>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cabeceraTextos: {
    flex: 1,
  },
  tituloPantalla: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  botonAnadir: {
    width: 44,
    height: 44,
    borderRadius: spacing.borderRadiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...glassGlow(colors.primary, 12),
  },
  segmentosCaja: {
    marginBottom: spacing.md,
  },
  segmentos: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  segmento: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: spacing.borderRadiusSm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentoActivo: {
    backgroundColor: colors.glassBgLight,
    borderColor: colors.glassBorderActive,
  },
  segmentoTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentoTextoActivo: {
    color: colors.textPrimary,
  },
  avisoFila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  avisoTexto: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  lista: {
    paddingBottom: 110,
  },
  listaVacia: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 110,
  },
  vacioContenido: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  vacioTitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: 6,
    textAlign: 'center',
  },
  vacioTexto: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  vacioBoton: {
    width: '100%',
  },
  tarjeta: {
    marginBottom: spacing.sm + 4,
  },
  tarjetaContenido: {
    padding: spacing.md + 2,
  },
  filaPrincipal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
  },
  marca: {
    paddingTop: 1,
  },
  textos: {
    flex: 1,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 21,
  },
  tituloHecho: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  nota: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 3,
  },
  metaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm + 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: spacing.borderRadiusSm,
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  chipTexto: {
    fontSize: 11,
    fontWeight: '600',
  },
  cuandoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cuando: {
    fontSize: 12,
  },
  motivo: {
    marginTop: spacing.sm + 4,
    padding: spacing.sm + 2,
    borderRadius: spacing.borderRadiusSm,
    backgroundColor: colors.warningBg,
  },
  motivoEtiqueta: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.warning,
    marginBottom: 3,
  },
  motivoTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  borrar: {
    padding: 2,
  },
  presionado: {
    opacity: 0.6,
  },
  modalCaja: {
    width: '100%',
    maxWidth: 380,
  },
  modalContenido: {
    padding: spacing.cardPadding,
  },
  modalCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modalTitulo: {
    fontSize: 19,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalScroll: {
    maxHeight: 420,
  },
  modalAyuda: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  grupoEtiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  grupoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: spacing.borderRadiusSm,
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  opcionActiva: {
    backgroundColor: colors.glassBgLight,
    borderColor: colors.glassBorderActive,
  },
  opcionTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  opcionTextoActivo: {
    color: colors.textPrimary,
  },
  modalBoton: {
    width: '100%',
  },
});
