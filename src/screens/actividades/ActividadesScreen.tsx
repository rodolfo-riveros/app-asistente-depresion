import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Button,
  Card,
  Chip,
  Icon,
  IconButton,
  IconName,
  IconTile,
  Screen,
  TextField,
  Title,
  Txt,
} from '../../components/ui';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/spacing';
import { asistente } from '../../constants/asistente';
import type { RootScreenProps } from '../../navigation/types';
import { Actividad, CategoriaActividad, actividadesService } from '../../services/actividades';
import { Hoja } from '../profile/components/Hoja';
import {
  CATEGORIAS,
  categoriaDe,
  esVencida,
  haptico,
  mensajeDe,
  textoCuando,
} from './actividadesUtils';

type Filtro = 'pendientes' | 'vencidas' | 'completadas';

const FILTROS: { clave: Filtro; etiqueta: string }[] = [
  { clave: 'pendientes', etiqueta: 'Pendientes' },
  { clave: 'vencidas', etiqueta: 'Vencidas' },
  { clave: 'completadas', etiqueta: 'Hechas' },
];

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

/** Fecha objetivo de un plazo rápido: al final del día, para no nacer vencida. */
const dentroDe = (dias: number): string => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(20, 0, 0, 0);
  return fecha.toISOString();
};

/** ¿La actividad sigue perteneciendo al grupo que se está viendo? */
const encajaEn = (actividad: Actividad, filtro: Filtro) =>
  filtro === 'completadas'
    ? actividad.completada
    : filtro === 'vencidas'
      ? esVencida(actividad)
      : !actividad.completada;

const VACIOS: Record<Filtro, { icono: IconName; fondo: string; titulo: string; texto: string }> = {
  pendientes: {
    icono: 'calendar',
    fondo: colors.sage,
    titulo: 'Todavía no hay nada acordado',
    texto: `Cuando converses con ${asistente.nombre} y decidan juntos un paso pequeño, lo vas a encontrar aquí.`,
  },
  vencidas: {
    icono: 'heart',
    fondo: colors.peachPale,
    titulo: 'Nada se te quedó atrás',
    texto:
      'Si alguna vez se pasa la fecha, aparece aquí sin reproches: para retomarlo cuando puedas.',
  },
  completadas: {
    icono: 'check',
    fondo: colors.sage,
    titulo: 'Aún no marcaste nada como hecho',
    texto: 'Cada cosa que completes se queda aquí, para que puedas mirar atrás y verlo.',
  },
};

export const ActividadesScreen: React.FC<RootScreenProps<'Actividades'>> = ({ navigation }) => {
  const [filtro, setFiltro] = useState<Filtro>('pendientes');
  const [items, setItems] = useState<Actividad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [borrador, setBorrador] = useState(BORRADOR_INICIAL);
  const notaRef = useRef<TextInput>(null);

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

  // Se recarga al volver a la pantalla: lo que acuerdes en el chat aparece solo.
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
    if (completada) haptico.exito();
    else haptico.leve();
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
    if (!titulo || guardando) return;

    Keyboard.dismiss();
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
    const hecha = actividad.completada;

    return (
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: 12,
          gap: 10,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconTile name={categoria.icono} bg={categoria.fondo} color={colors.forest} />

          <View style={{ flex: 1, gap: 3 }}>
            <Txt
              size={14.5}
              weight={hecha ? 'medium' : 'semibold'}
              color={hecha ? colors.inkSoft : colors.ink}
              style={hecha ? { textDecorationLine: 'line-through' } : undefined}>
              {actividad.titulo}
            </Txt>
            {actividad.nota ? (
              <Txt size={12.5} color={colors.inkSoft} leading={1.4}>
                {actividad.nota}
              </Txt>
            ) : null}
            <Txt
              size={12}
              weight={vencida ? 'semibold' : 'regular'}
              color={vencida ? colors.dangerInk : colors.inkSoft}>
              {`${categoria.etiqueta} · ${textoCuando(actividad)}`}
            </Txt>
          </View>

          <Pressable
            onPress={() => alternarHecha(actividad)}
            hitSlop={4}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: hecha }}
            accessibilityLabel={
              hecha ? `Desmarcar: ${actividad.titulo}` : `Marcar como hecho: ${actividad.titulo}`
            }
            // Android: onda circular; iOS: opacidad.
            android_ripple={{ color: colors.ripple, borderless: true, radius: 22 }}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed && Platform.OS !== 'android' ? 0.6 : 1,
            })}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                borderWidth: hecha ? 0 : 1.5,
                borderColor: vencida ? colors.dangerInk : colors.stone,
                backgroundColor: hecha ? colors.forest : colors.transparent,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {hecha ? (
                <Icon name="check" size={16} color={colors.onDark} strokeWidth={2.4} />
              ) : null}
            </View>
          </Pressable>

          <IconButton
            name="trash"
            iconSize={18}
            color={colors.inkSoft}
            accessibilityLabel={`Quitar de la lista: ${actividad.titulo}`}
            onPress={() => confirmarBorrado(actividad)}
            style={{ marginLeft: -8 }}
          />
        </View>

        {actividad.motivo_no_realizada ? (
          <View
            style={{
              backgroundColor: colors.peachPale,
              borderRadius: radius.md,
              padding: 10,
              gap: 3,
            }}>
            <Txt size={11} weight="bold" tracking={0.6} color={colors.inkOnAccent}>
              LO QUE CONTASTE
            </Txt>
            <Txt size={13} color={colors.inkSoft} leading={1.4}>
              {actividad.motivo_no_realizada}
            </Txt>
          </View>
        ) : null}
      </View>
    );
  };

  const vacio = VACIOS[filtro];
  const refreshControl = (
    <RefreshControl
      refreshing={refrescando}
      onRefresh={refrescar}
      tintColor={colors.forest}
      colors={[colors.forest]}
    />
  );

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']} contentStyle={{ paddingTop: 12 }}>
      {/* Cabecera */}
      <View style={{ gap: 6 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton
            name="back"
            accessibilityLabel="Volver"
            onPress={() => navigation.goBack()}
            style={{ marginLeft: -10 }}
          />
          <IconButton
            name="plus"
            bg={colors.surface}
            bordered
            accessibilityLabel="Añadir un acuerdo"
            onPress={() => setModalVisible(true)}
          />
        </View>
        <Title>Tus acuerdos</Title>
        <Txt size={13.5} color={colors.inkSoft}>
          Lo que fuiste decidiendo en tus conversaciones
        </Txt>
      </View>

      {/* Filtros */}
      {/* Con fuente grande en 360 px las tres píldoras no caben en una fila: parten. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="tablist">
        {FILTROS.map((f) => (
          <Chip
            key={f.clave}
            label={f.etiqueta}
            selected={f.clave === filtro}
            onPress={() => cambiarFiltro(f.clave)}
          />
        ))}
      </View>

      {error ? (
        <Card tone="danger" rounded={radius.lg} padding={12} gap={8}>
          <View style={{ gap: 2 }}>
            <Txt size={13.5} weight="semibold" color={colors.dangerInk}>
              No se pudo cargar la lista
            </Txt>
            <Txt size={12.5} color={colors.dangerInkSoft} accessibilityLiveRegion="polite">
              {error}
            </Txt>
          </View>
          <Button
            label="Reintentar"
            variant="secondary"
            size="sm"
            loading={refrescando}
            onPress={refrescar}
            style={{ alignSelf: 'flex-start' }}
          />
        </Card>
      ) : null}

      {cargando ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.forest} />
        </View>
      ) : items.length === 0 ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 40 }}
          refreshControl={refreshControl}>
          {error ? null : (
            <Card style={{ alignItems: 'center', paddingVertical: 28 }} gap={10}>
              <IconTile name={vacio.icono} bg={vacio.fondo} size={56} rounded={28} iconSize={24} />
              <Txt size={17} weight="bold" align="center">
                {vacio.titulo}
              </Txt>
              <Txt size={13.5} color={colors.inkSoft} align="center" leading={1.45}>
                {vacio.texto}
              </Txt>
              {filtro === 'pendientes' ? (
                <Button
                  label="Abrir el chat"
                  icon="chat"
                  size="md"
                  onPress={() => navigation.navigate('Chat')}
                  style={{ alignSelf: 'stretch', marginTop: 6 }}
                />
              ) : null}
            </Card>
          )}
        </ScrollView>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderTarjeta(item)}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        />
      )}

      {/* Añadir a mano: no todo se acuerda hablando */}
      <Hoja visible={modalVisible} titulo="Un nuevo acuerdo" onClose={cerrarModal}>
        <Txt size={13.5} color={colors.inkSoft} leading={1.4}>
          Algo pequeño y concreto que quieras probar estos días.
        </Txt>

        <TextField
          label="¿Qué quieres hacer?"
          placeholder="Salir a caminar por el centro"
          value={borrador.titulo}
          autoCapitalize="sentences"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => notaRef.current?.focus()}
          maxLength={120}
          onChangeText={(t) => setBorrador((b) => ({ ...b, titulo: t }))}
        />
        <TextField
          ref={notaRef}
          label="Una nota para ti (opcional)"
          placeholder="Para probar hacer cosas por mi cuenta"
          value={borrador.nota}
          autoCapitalize="sentences"
          multiline
          maxLength={300}
          onChangeText={(t) => setBorrador((b) => ({ ...b, nota: t }))}
        />

        <View style={{ gap: 8 }}>
          <Txt size={13} weight="semibold">
            ¿De qué se trata?
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIAS.map((c) => (
              <Chip
                key={c.clave}
                label={c.etiqueta}
                selected={c.clave === borrador.categoria}
                onPress={() => setBorrador((b) => ({ ...b, categoria: c.clave }))}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Txt size={13} weight="semibold">
            ¿Para cuándo?
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PLAZOS.map((p) => (
              <Chip
                key={p.dias}
                label={p.etiqueta}
                selected={p.dias === borrador.dias}
                onPress={() => setBorrador((b) => ({ ...b, dias: p.dias }))}
              />
            ))}
          </View>
        </View>

        <Button
          label="Guardar"
          loading={guardando}
          disabled={!borrador.titulo.trim()}
          onPress={guardarNueva}
        />
      </Hoja>
    </Screen>
  );
};
