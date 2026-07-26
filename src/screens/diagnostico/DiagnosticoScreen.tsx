import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SpatialContainer } from '../../components/SpatialContainer';
import { GlassCard } from '../../components/GlassCard';
import { AuthButton } from '../../components/AuthButton';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { formatters } from '../../utils/formatters';
import { construirHtmlFicha, construirResumenTexto } from '../../utils/fichaPdf';
import {
  Diagnostico,
  diagnosticoService,
  ItemHamilton,
  SCORE_MAXIMO,
  Tendencia,
} from '../../services/diagnostico';

const ALTO_GRAFICA = 104;
const MAX_PUNTOS_GRAFICA = 8;

/** Cómo se lee cada tendencia: color, icono y frase para la persona. */
const TENDENCIAS: Record<
  Tendencia,
  {
    etiqueta: string;
    ayuda: string;
    icono: 'trending-down' | 'trending-up' | 'remove';
    color: string;
  }
> = {
  mejorando: {
    etiqueta: 'mejorando',
    ayuda: 'tu puntaje bajó respecto a la evaluación anterior',
    icono: 'trending-down',
    color: colors.secondary,
  },
  estable: {
    etiqueta: 'estable',
    ayuda: 'tu puntaje se mantiene respecto a la evaluación anterior',
    icono: 'remove',
    color: colors.primary,
  },
  empeorando: {
    etiqueta: 'empeorando',
    ayuda: 'tu puntaje subió respecto a la evaluación anterior',
    icono: 'trending-up',
    color: colors.warning,
  },
};

const fechaBreve = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};

const Seccion: React.FC<{
  titulo: string;
  icono: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}> = ({ titulo, icono, children }) => (
  <GlassCard level="low" radius={spacing.borderRadiusSm} style={styles.card}>
    <View style={styles.cardHeader}>
      <Ionicons name={icono} size={16} color={colors.primary} />
      <Text style={styles.cardTitle}> {titulo}</Text>
    </View>
    {children}
  </GlassCard>
);

const Barra: React.FC<{ porcentaje: number; color: string }> = ({ porcentaje, color }) => (
  <View style={styles.pista}>
    <View
      style={[
        styles.relleno,
        { width: `${Math.min(100, Math.max(0, porcentaje))}%`, backgroundColor: color },
      ]}
    />
  </View>
);

const FilaItem: React.FC<{ item: ItemHamilton }> = ({ item }) => {
  const pendiente = !item.registrado;
  const porcentaje = pendiente ? 0 : ((item.valor ?? 0) / item.maximo) * 100;

  return (
    <View style={[styles.itemFila, pendiente && styles.itemPendiente]}>
      <Text style={styles.itemNum}>{item.item}</Text>
      <View style={styles.itemCuerpo}>
        <Text style={styles.itemEtiqueta} numberOfLines={2}>
          {item.etiqueta}
        </Text>
        <Barra porcentaje={porcentaje} color={pendiente ? colors.outlineVariant : colors.primary} />
      </View>
      <Text style={[styles.itemValor, pendiente && styles.itemValorPendiente]}>
        {pendiente ? 'pendiente' : `${item.valor}/${item.maximo}`}
      </Text>
    </View>
  );
};

const Estadistica: React.FC<{ valor: string; etiqueta: string }> = ({ valor, etiqueta }) => (
  <View style={styles.stat}>
    <Text style={styles.statValor}>{valor}</Text>
    <Text style={styles.statEtiqueta}>{etiqueta}</Text>
  </View>
);

export const DiagnosticoScreen: React.FC = () => {
  const [ficha, setFicha] = useState<Diagnostico | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * No toca ningún estado antes del primer `await`: así puede llamarse desde un
   * efecto sin caer en la regla que prohíbe setState síncrono.
   */
  const cargar = useCallback(async () => {
    try {
      const datos = await diagnosticoService.obtener();
      setFicha(datos);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo preparar tu ficha en este momento.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  // Se refresca al volver a la pestaña: si acabas de conversar, la ficha ya
  // refleja los ítems nuevos sin tener que tirar de la pantalla.
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const refrescar = () => {
    setRefrescando(true);
    cargar();
  };

  /**
   * Abre el diálogo de impresión del sistema, que incluye "Guardar como PDF".
   *
   * Es lo que diferencia este botón del de compartir: aquí la ficha se queda en
   * el dispositivo (o sale por una impresora) en vez de enviarse a alguien.
   */
  const imprimirFicha = async () => {
    if (!ficha) return;
    setExportando(true);
    try {
      await Print.printAsync({ html: construirHtmlFicha(ficha) });
    } catch (e) {
      // Cancelar el diálogo de impresión lanza excepción en iOS: no es un error.
      const mensaje = e instanceof Error ? e.message : '';
      if (/cancel/i.test(mensaje)) return;
      Alert.alert('No se pudo guardar', mensaje || 'Inténtalo de nuevo en un momento.');
    } finally {
      setExportando(false);
    }
  };

  /**
   * Envía la ficha en PDF por WhatsApp, correo o la app que elija la persona.
   *
   * Se genera el PDF y se pasa a `Sharing.shareAsync`, que abre la hoja de
   * compartir del sistema con el ARCHIVO adjunto. `Share.share` sólo admite
   * texto, así que queda como plan B para plataformas sin hoja de compartir
   * (web), donde al menos se envía el resumen escrito.
   */
  const compartirFicha = async () => {
    if (!ficha) return;
    setCompartiendo(true);
    try {
      if (await Sharing.isAvailableAsync()) {
        const { uri } = await Print.printToFileAsync({ html: construirHtmlFicha(ficha) });
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Enviar mi ficha',
          UTI: 'com.adobe.pdf',
        });
      } else {
        await Share.share({
          message: construirResumenTexto(ficha),
          title: 'Resumen de mi ficha',
        });
      }
    } catch (e) {
      Alert.alert(
        'No se pudo compartir',
        e instanceof Error ? e.message : 'Inténtalo de nuevo en un momento.'
      );
    } finally {
      setCompartiendo(false);
    }
  };

  if (cargando) {
    return (
      <SpatialContainer style={styles.centrado}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.cargandoTexto}>Preparando tu ficha…</Text>
      </SpatialContainer>
    );
  }

  const evaluacion = ficha?.ultima_evaluacion ?? null;
  const colorNivel = formatters.getSeverityColor(evaluacion?.nivel);
  const tendencia = ficha?.tendencia ? TENDENCIAS[ficha.tendencia] : null;
  const evolucion = (ficha?.evaluaciones ?? []).slice(-MAX_PUNTOS_GRAFICA);
  const maximoGrafica = Math.max(...evolucion.map((e) => e.score), 1);
  const hayItems = (ficha?.progreso.registrados ?? 0) > 0;

  return (
    <SpatialContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={refrescar}
            tintColor={colors.primary}
          />
        }>
        <View style={styles.header}>
          <Text style={styles.titulo}>Diagnóstico</Text>
          <Text style={styles.subtitulo}>
            Esta es la ficha que puedes mostrarle a un profesional. Reúne lo que has ido
            conversando, sin que tengas que explicarlo todo de nuevo.
          </Text>
        </View>

        {error ? (
          <GlassCard
            level="low"
            radius={spacing.borderRadiusSm}
            style={styles.card}
            contentStyle={styles.avisoContenido}>
            <Ionicons name="cloud-offline-outline" size={20} color={colors.textMuted} />
            <Text style={styles.avisoTexto}>{error}</Text>
            <Pressable
              onPress={refrescar}
              accessibilityRole="button"
              accessibilityLabel="Reintentar cargar la ficha"
              style={({ pressed }) => [styles.enlace, pressed && styles.presionado]}>
              <Text style={styles.enlaceTexto}>Reintentar</Text>
            </Pressable>
          </GlassCard>
        ) : null}

        {ficha ? (
          <>
            {evaluacion ? (
              <GlassCard
                level="low"
                radius={spacing.borderRadiusSm}
                style={styles.card}
                glowColor={colorNivel}>
                <View style={styles.resumenFila}>
                  <View style={[styles.nivelBadge, { borderColor: colorNivel }]}>
                    <Text style={[styles.nivelTexto, { color: colorNivel }]}>
                      {evaluacion.nivel}
                    </Text>
                  </View>
                  <Text style={styles.fechaTexto}>{formatters.formatDate(evaluacion.fecha)}</Text>
                </View>

                <View style={styles.puntajeFila}>
                  <Text style={styles.puntajeNum}>{evaluacion.score}</Text>
                  <Text style={styles.puntajeMax}>/ {SCORE_MAXIMO}</Text>
                </View>
                <Text style={styles.puntajeAyuda}>puntaje en la escala de Hamilton</Text>

                {tendencia ? (
                  <View style={styles.tendenciaCaja}>
                    <Ionicons name={tendencia.icono} size={16} color={tendencia.color} />
                    <View style={styles.tendenciaTextos}>
                      <Text style={[styles.tendenciaEtiqueta, { color: tendencia.color }]}>
                        {tendencia.etiqueta}
                      </Text>
                      <Text style={styles.tendenciaAyuda}>{tendencia.ayuda}</Text>
                    </View>
                  </View>
                ) : null}
              </GlassCard>
            ) : (
              <GlassCard
                level="low"
                radius={spacing.borderRadiusSm}
                style={styles.card}
                contentStyle={styles.vacioContenido}>
                <Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.primary} />
                <Text style={styles.vacioTitulo}>Todavía no hay una evaluación completa</Text>
                <Text style={styles.vacioTexto}>
                  La ficha se arma sola mientras conversas. Cuéntale al asistente cómo has estado
                  estos días, sin prisa: cuando haya recogido lo suficiente, aquí aparecerá tu
                  resumen para compartir.
                </Text>
              </GlassCard>
            )}

            <Seccion titulo="Progreso del test" icono="analytics-outline">
              <Text style={styles.progresoTexto}>
                {ficha.progreso.registrados} de {ficha.progreso.total} ítems registrados
              </Text>
              <Barra porcentaje={ficha.progreso.porcentaje} color={colors.primary} />
              <Text style={styles.progresoAyuda}>
                {ficha.progreso.porcentaje}% de la escala cubierta hasta ahora
              </Text>
            </Seccion>

            <Seccion titulo="Los 17 ítems de Hamilton" icono="list-outline">
              <Text style={styles.seccionAyuda}>
                Lo que el asistente pudo registrar de cada área. Los pendientes aún no se han
                conversado.
              </Text>
              {ficha.items.map((item) => (
                <FilaItem key={item.item} item={item} />
              ))}
            </Seccion>

            {evolucion.length >= 2 ? (
              <Seccion titulo="Evolución" icono="trending-up-outline">
                <Text style={styles.seccionAyuda}>
                  Puntaje de tus últimas evaluaciones. Más bajo es mejor.
                </Text>
                <View
                  style={styles.grafica}
                  accessibilityRole="image"
                  accessibilityLabel={`Evolución del puntaje: ${evolucion
                    .map((e) => `${fechaBreve(e.fecha)} ${e.score} puntos`)
                    .join(', ')}`}>
                  {evolucion.map((e, indice) => (
                    <View key={`${e.fecha}-${indice}`} style={styles.columna}>
                      <Text style={styles.columnaValor}>{e.score}</Text>
                      <View
                        style={[
                          styles.columnaBarra,
                          {
                            height: Math.max(4, (e.score / maximoGrafica) * ALTO_GRAFICA),
                            backgroundColor: formatters.getSeverityColor(e.nivel),
                          },
                        ]}
                      />
                      <Text style={styles.columnaFecha}>{fechaBreve(e.fecha)}</Text>
                    </View>
                  ))}
                </View>
              </Seccion>
            ) : null}

            <Seccion titulo="Acompañamiento" icono="people-outline">
              <View style={styles.statsRejilla}>
                <Estadistica
                  valor={String(ficha.actividad.conversaciones)}
                  etiqueta="conversaciones"
                />
                <Estadistica valor={String(ficha.actividad.mensajes)} etiqueta="mensajes" />
                <Estadistica
                  valor={`${ficha.actividad.actividades_completadas}/${ficha.actividad.actividades_creadas}`}
                  etiqueta="actividades hechas"
                />
                <Estadistica
                  valor={`${ficha.actividad.tasa_cumplimiento}%`}
                  etiqueta="cumplimiento"
                />
              </View>
              {ficha.actividad.ultima_conversacion ? (
                <Text style={styles.seccionPie}>
                  Última conversación: {formatters.formatDate(ficha.actividad.ultima_conversacion)}
                </Text>
              ) : null}
            </Seccion>

            {evaluacion?.interpretacion ? (
              <Seccion titulo="Interpretación" icono="reader-outline">
                <Text style={styles.parrafo}>{evaluacion.interpretacion}</Text>
              </Seccion>
            ) : null}

            {evaluacion?.recomendaciones?.length ? (
              <Seccion titulo="Recomendaciones" icono="bulb-outline">
                {evaluacion.recomendaciones.map((rec, indice) => (
                  <View key={indice} style={styles.recFila}>
                    <Ionicons
                      name="chevron-forward"
                      size={12}
                      color={colors.primary}
                      style={styles.recBullet}
                    />
                    <Text style={styles.recTexto}>{rec}</Text>
                  </View>
                ))}
              </Seccion>
            ) : null}

            <View style={styles.avisoLegal}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.primary}
                style={styles.avisoIcono}
              />
              <Text style={styles.avisoLegalTexto}>{ficha.aviso}</Text>
            </View>

            <AuthButton
              label={compartiendo ? 'Preparando…' : 'Enviar a mi psicólogo'}
              onPress={compartirFicha}
              loading={compartiendo}
              disabled={!evaluacion && !hayItems}
            />
            <AuthButton
              label={exportando ? 'Abriendo…' : 'Guardar o imprimir'}
              variant="secondary"
              onPress={imprimirFicha}
              loading={exportando}
              disabled={!evaluacion && !hayItems}
              style={styles.botonSecundario}
            />
            {!evaluacion && !hayItems ? (
              <Text style={styles.botonesAyuda}>
                Podrás exportar tu ficha en cuanto tengas algo registrado.
              </Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SpatialContainer>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.screenPadding,
    paddingBottom: 120,
  },
  centrado: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  cargandoTexto: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 14,
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 19,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Resumen
  resumenFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nivelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 1,
    backgroundColor: colors.surfaceInset,
  },
  nivelTexto: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  fechaTexto: {
    fontSize: 12,
    color: colors.textMuted,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: spacing.sm,
  },
  puntajeFila: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.md,
  },
  puntajeNum: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  puntajeMax: {
    fontSize: 15,
    color: colors.textMuted,
    marginLeft: 6,
  },
  puntajeAyuda: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tendenciaCaja: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  tendenciaTextos: {
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  tendenciaEtiqueta: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  tendenciaAyuda: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },

  // Progreso
  progresoTexto: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  progresoAyuda: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  pista: {
    height: 8,
    borderRadius: spacing.borderRadiusSm,
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.borderDark,
    overflow: 'hidden',
  },
  relleno: {
    height: '100%',
    borderRadius: spacing.borderRadiusSm,
  },

  // Ítems
  seccionAyuda: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },
  seccionPie: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  itemFila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  itemPendiente: {
    opacity: 0.45,
  },
  itemNum: {
    width: 22,
    fontSize: 11,
    color: colors.textMuted,
  },
  itemCuerpo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemEtiqueta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  itemValor: {
    width: 62,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemValorPendiente: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textMuted,
  },

  // Gráfica
  grafica: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: ALTO_GRAFICA + 38,
    marginTop: spacing.xs,
  },
  columna: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 3,
  },
  columnaValor: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  columnaBarra: {
    width: '100%',
    maxWidth: 26,
    borderRadius: spacing.borderRadiusSm,
  },
  columnaFecha: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 6,
  },

  // Estadísticas
  statsRejilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stat: {
    width: '50%',
    paddingVertical: spacing.sm,
  },
  statValor: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statEtiqueta: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Interpretación y recomendaciones
  parrafo: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  recFila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  recBullet: {
    marginRight: 8,
    marginTop: 4,
  },
  recTexto: {
    flexShrink: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Estados vacíos y avisos
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
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  avisoContenido: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  avisoTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  enlace: {
    marginTop: spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  enlaceTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  presionado: {
    opacity: 0.7,
  },
  avisoLegal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avisoIcono: {
    marginRight: 8,
    marginTop: 1,
  },
  avisoLegalTexto: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  botonSecundario: {
    marginTop: spacing.md,
  },
  botonesAyuda: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
