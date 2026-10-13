import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, Share, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, IconButton, ProgressBar, Screen, Title, Txt } from '../../components/ui';
import { colors } from '../../constants/colors';
import { asistente } from '../../constants/asistente';
import { animo } from '../../utils/animo';
import { formatters } from '../../utils/formatters';
import { construirResumenTexto, prepararHtmlFicha } from '../../utils/fichaPdf';
import { useAuth } from '../../hooks/useAuth';
import {
  Diagnostico,
  diagnosticoService,
  SCORE_MAXIMO,
  Tendencia,
} from '../../services/diagnostico';
import type { TabScreenProps } from '../../navigation/types';
import { useLayout } from '../../hooks/useLayout';
import { fraseNivel, SeveridadSegmentos } from './components/Severidad';
import {
  BarrasSemana,
  DiaAnimo,
  GraficaEvolucion,
  rangoSemana,
  resumenSemana,
} from './components/Graficas';

const MAX_PUNTOS_GRAFICA = 8;
/** En pantallas estrechas (360 px) o con fuente grande, 6 columnas legibles en vez de 8 apretadas. */
const MAX_PUNTOS_COMPACTO = 6;

/** Cómo se lee cada tendencia (más bajo en Hamilton = mejor). */
const TENDENCIAS: Record<Tendencia, { etiqueta: string; ayuda: string; color: string }> = {
  mejorando: {
    etiqueta: 'Mejorando',
    ayuda: 'tu puntaje bajó respecto a la evaluación anterior',
    color: colors.moss,
  },
  estable: {
    etiqueta: 'Estable',
    ayuda: 'tu puntaje se mantiene respecto a la evaluación anterior',
    color: colors.stone,
  },
  empeorando: {
    etiqueta: 'Más difícil',
    ayuda: 'tu puntaje subió respecto a la evaluación anterior',
    color: colors.accent,
  },
};

/** Etiqueta pequeña sobre fondo salvia (p. ej. "Hamilton · 12 de 17"). */
const Etiqueta: React.FC<{ texto: string }> = ({ texto }) => (
  <View
    style={{
      backgroundColor: colors.sage,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    }}>
    <Txt size={12} weight="semibold" color={colors.forest}>
      {texto}
    </Txt>
  </View>
);

const Punto: React.FC<{ color: string }> = ({ color }) => (
  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, flexShrink: 0 }} />
);

const explicarPrivacidad = () =>
  Alert.alert(
    'Tu registro es privado',
    `Solo tú ves este registro. El ánimo que marcas cada día se guarda en este dispositivo, ` +
      `y lo que ${asistente.nombre} registra de tus conversaciones queda asociado a tu cuenta. ` +
      'Nada se comparte con nadie a menos que tú pulses "Compartir resumen".'
  );

/**
 * Mensaje legible para la tarjeta de error: sólo la primera frase del error de
 * la API (el resto son pistas técnicas para desarrollo, como el arranque en frío).
 */
const mensajeError = (e: unknown): string => {
  const base = e instanceof Error ? e.message.split('\n')[0].trim() : '';
  return base || 'No se pudo conectar con el servidor.';
};

export const RegistroScreen: React.FC<TabScreenProps<'RegistroTab'>> = ({ navigation }) => {
  const { anchoContenido, fontScale } = useLayout();
  const { user } = useAuth();
  /** Datos de la cuenta para el informe (el resto lo reúne `prepararHtmlFicha`). */
  const cuenta = { apodo: user?.nombre ?? null, correo: user?.email ?? null };
  /**
   * Dos botones en fila sólo si caben: "Ver especialistas" + "Compartir resumen"
   * no entran en 360 px (ni en 430 px con fuente al 130 %) → se apilan.
   */
  const apilar = anchoContenido / Math.min(Math.max(fontScale, 1), 1.35) < 380;
  const angosto = anchoContenido / Math.min(Math.max(fontScale, 1), 1.35) < 340;
  const [ficha, setFicha] = useState<Diagnostico | null>(null);
  const [semana, setSemana] = useState<DiaAnimo[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [reintentando, setReintentando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Sólo la última petición escribe estado (enfoques y refrescos pueden solaparse). */
  const peticion = useRef(0);

  /**
   * No toca ningún estado antes del primer `await`: así puede llamarse desde un
   * efecto sin caer en la regla que prohíbe setState síncrono.
   *
   * El ánimo semanal (local) se pinta en cuanto se lee, sin esperar a la API:
   * con el backend caído la petición puede tardar hasta agotar el timeout.
   */
  const cargar = useCallback(async () => {
    const id = ++peticion.current;
    animo
      .semanaActual()
      .then(setSemana)
      .catch(() => setSemana([]));
    try {
      const datos = await diagnosticoService.obtener();
      if (id !== peticion.current) return;
      setFicha(datos);
      setError(null);
    } catch (e) {
      if (id !== peticion.current) return;
      setError(mensajeError(e));
    } finally {
      if (id === peticion.current) {
        setCargando(false);
        setRefrescando(false);
        setReintentando(false);
      }
    }
  }, []);

  // Se refresca al volver a la pestaña: si acabas de conversar o de marcar tu
  // ánimo en Inicio, el registro ya lo refleja sin tener que tirar de la pantalla.
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const refrescar = () => {
    setRefrescando(true);
    cargar();
  };

  const reintentar = () => {
    setReintentando(true);
    cargar();
  };

  /** Diálogo de impresión del sistema (incluye "Guardar como PDF"). */
  const imprimirFicha = async () => {
    if (!ficha) return;
    setExportando(true);
    try {
      // Import diferido: si el módulo nativo no está en este build, no rompe la pantalla.
      const Print = await import('expo-print');
      await Print.printAsync({ html: await prepararHtmlFicha(ficha, cuenta) });
    } catch (e) {
      // Cancelar el diálogo de impresión lanza excepción en iOS: no es un error.
      const mensaje = e instanceof Error ? e.message : '';
      if (/cancel/i.test(mensaje)) return;
      Alert.alert(
        'No se pudo abrir la impresión',
        'Este dispositivo no permite imprimir o guardar el PDF ahora. Puedes usar "Compartir resumen".'
      );
    } finally {
      setExportando(false);
    }
  };

  /**
   * Envía la ficha en PDF por la app que elija la persona. Si el PDF no se
   * puede generar o compartir (web, módulo ausente), plan B: `Share.share` con
   * el resumen escrito.
   */
  const compartirFicha = async () => {
    if (!ficha) return;
    setCompartiendo(true);
    try {
      let uri: string | null = null;
      let Sharing: typeof import('expo-sharing') | null = null;
      try {
        Sharing = await import('expo-sharing');
        if (await Sharing.isAvailableAsync()) {
          const Print = await import('expo-print');
          const html = await prepararHtmlFicha(ficha, cuenta);
          // A4 en puntos (por defecto expo-print usa carta, 612×792).
          uri = (await Print.printToFileAsync({ html, width: 595, height: 842 })).uri;
        }
      } catch {
        uri = null;
      }

      if (uri && Sharing) {
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
    } catch {
      Alert.alert('No se pudo compartir', 'Inténtalo de nuevo en un momento.');
    } finally {
      setCompartiendo(false);
    }
  };

  const rango = useMemo(() => rangoSemana(), []);
  const resumen = useMemo(() => (semana ? resumenSemana(semana) : ''), [semana]);

  const evaluacion = ficha?.ultima_evaluacion ?? null;
  const tendencia = ficha?.tendencia ? TENDENCIAS[ficha.tendencia] : null;
  const evolucion = (ficha?.evaluaciones ?? []).slice(
    -(angosto ? MAX_PUNTOS_COMPACTO : MAX_PUNTOS_GRAFICA)
  );
  const registrados = ficha?.items.filter((i) => i.registrado) ?? [];
  const notados = registrados
    .filter((i) => (i.valor ?? 0) > 0)
    .sort((a, b) => (b.valor ?? 0) / b.maximo - (a.valor ?? 0) / a.maximo);
  const hayAlgo = Boolean(evaluacion) || registrados.length > 0;

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.forest} />
      }>
      {/* Cabecera */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
        }}>
        <View style={{ gap: 4, flex: 1 }}>
          <Txt size={13} color={colors.inkSoft}>
            {rango}
          </Txt>
          <Title>Tu registro</Title>
        </View>
        <IconButton
          name="lock"
          iconSize={20}
          bg={colors.surface}
          accessibilityLabel="Privacidad del registro"
          onPress={explicarPrivacidad}
        />
      </View>

      {/* Ánimo de la semana (local, no depende del backend) */}
      <Card>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: 4,
          }}>
          <Txt size={15} weight="semibold">
            Ánimo de la semana
          </Txt>
          <Txt size={12.5} color={colors.inkSoft}>
            según lo que marcaste
          </Txt>
        </View>
        {semana ? (
          <>
            <BarrasSemana dias={semana} />
            <Txt size={13.5} color={colors.inkSoft} leading={1.4}>
              {resumen}
            </Txt>
          </>
        ) : (
          <View style={{ minHeight: 84, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.forest} accessibilityLabel="Cargando tu semana" />
          </View>
        )}
      </Card>

      {/* Estado del chequeo: cargando la primera vez o error de la API */}
      {cargando && !ficha ? (
        <Card gap={10}>
          <View
            accessible
            accessibilityLabel="Cargando tu chequeo de ánimo"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color={colors.forest} />
            <Txt size={14} color={colors.inkSoft}>
              Trayendo tu chequeo de ánimo…
            </Txt>
          </View>
        </Card>
      ) : null}

      {error && !cargando ? (
        <Card gap={10}>
          <View accessible accessibilityLiveRegion="polite" style={{ gap: 4 }}>
            <Txt size={15} weight="semibold">
              No pudimos traer tu chequeo
            </Txt>
            <Txt size={14} color={colors.inkSoft} leading={1.4}>
              {`${error} Tu ánimo de la semana está guardado en este teléfono y sigue disponible.`}
            </Txt>
          </View>
          <Button
            label="Reintentar"
            size="sm"
            variant="outline"
            icon="refresh"
            loading={reintentando}
            disabled={reintentando || refrescando}
            onPress={reintentar}
          />
        </Card>
      ) : null}

      {ficha ? (
        <>
          {/* Chequeo de ánimo (Hamilton) */}
          <Card>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 6,
              }}>
              <Txt size={15} weight="semibold">
                Chequeo de ánimo
              </Txt>
              <Etiqueta
                texto={`Hamilton · ${ficha.progreso.registrados} de ${ficha.progreso.total}`}
              />
            </View>

            {evaluacion ? (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}>
                  <Txt
                    size={40}
                    weight="bold"
                    tracking={-1}
                    maxFontSizeMultiplier={1.2}
                    style={{ lineHeight: 44 }}>
                    {evaluacion.score}
                  </Txt>
                  <Txt size={14} color={colors.inkSoft} style={{ flexShrink: 1 }}>
                    de {SCORE_MAXIMO} · {fraseNivel(evaluacion.nivel, evaluacion.score)}
                  </Txt>
                </View>
                <SeveridadSegmentos nivel={evaluacion.nivel} score={evaluacion.score} />
                <Txt size={12.5} color={colors.inkSoft}>
                  {evaluacion.nivel} · {formatters.formatDate(evaluacion.fecha)}
                </Txt>
                {tendencia ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Punto color={tendencia.color} />
                    <Txt size={13.5} color={colors.inkSoft} style={{ flex: 1 }} leading={1.35}>
                      <Txt size={13.5} weight="semibold">
                        {tendencia.etiqueta}:
                      </Txt>{' '}
                      {tendencia.ayuda}
                    </Txt>
                  </View>
                ) : null}
              </>
            ) : (
              <View style={{ gap: 10 }}>
                <Txt size={14} color={colors.inkSoft} leading={1.4}>
                  {ficha.progreso.registrados > 0
                    ? `${asistente.nombre} lleva ${ficha.progreso.registrados} de ${ficha.progreso.total} áreas conversadas. Cuando complete la escala, aquí verás tu resultado.`
                    : `Todavía no hay un chequeo. Se arma solo mientras conversas con ${asistente.nombre}, sin prisa.`}
                </Txt>
                <ProgressBar value={ficha.progreso.porcentaje / 100} height={6} />
                <Button
                  label={`Hablar con ${asistente.nombre}`}
                  size="sm"
                  variant="outline"
                  icon="chat"
                  onPress={() => navigation.navigate('Chat')}
                />
              </View>
            )}

            <Txt size={12.5} color={colors.inkSoft} leading={1.4}>
              Es una orientación, no un diagnóstico. Solo un profesional puede evaluarte.
            </Txt>
          </Card>

          {/* Lo que la asistente ha notado */}
          <Card gap={10}>
            <Txt size={15} weight="semibold">
              Lo que {asistente.nombre} ha notado
            </Txt>
            {notados.length > 0 ? (
              notados.map((item) => {
                const alto = (item.valor ?? 0) / item.maximo >= 0.5;
                return (
                  <View
                    key={item.item}
                    accessible
                    accessibilityLabel={`${item.etiqueta}: ${item.valor} de ${item.maximo}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Punto color={alto ? colors.accent : colors.moss} />
                    <Txt size={14} style={{ flex: 1 }}>
                      {item.etiqueta}
                    </Txt>
                    <Txt size={12.5} color={colors.inkSoft}>
                      {item.valor}/{item.maximo}
                    </Txt>
                  </View>
                );
              })
            ) : (
              <Txt size={13.5} color={colors.inkSoft} leading={1.4}>
                {registrados.length > 0
                  ? 'En lo conversado hasta ahora no aparecen señales destacables.'
                  : `Aún no ha registrado nada. A medida que conversen, ${asistente.nombre} anotará aquí lo que vaya notando.`}
              </Txt>
            )}
          </Card>

          {/* Evolución */}
          {evolucion.length >= 2 ? (
            <Card>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                  gap: 4,
                }}>
                <Txt size={15} weight="semibold">
                  Evolución
                </Txt>
                <Txt size={12.5} color={colors.inkSoft}>
                  más bajo es mejor
                </Txt>
              </View>
              <GraficaEvolucion evaluaciones={evolucion} />
            </Card>
          ) : null}
        </>
      ) : null}

      {/* Hablar con un psicólogo */}
      <Card tone="sage">
        <Txt size={15} weight="semibold" leading={1.35}>
          Hablar con un psicólogo puede ayudarte a sentirte mejor
        </Txt>
        <View style={{ flexDirection: apilar ? 'column' : 'row', gap: 8 }}>
          <Button
            label="Ver especialistas"
            size="sm"
            grow={!apilar}
            onPress={() => navigation.navigate('CrisisProtocol')}
          />
          <Button
            label="Compartir resumen"
            size="sm"
            variant="secondary"
            grow={!apilar}
            loading={compartiendo}
            disabled={!ficha || !hayAlgo}
            onPress={compartirFicha}
          />
        </View>
        {ficha && hayAlgo ? (
          <Button
            label={exportando ? 'Abriendo…' : 'Guardar o imprimir'}
            size="sm"
            variant="ghost"
            icon="print"
            loading={exportando}
            onPress={imprimirFicha}
          />
        ) : (
          <Txt size={12.5} color={colors.inkOnSage} leading={1.4}>
            Podrás compartir tu resumen en cuanto haya algo registrado.
          </Txt>
        )}
      </Card>
    </Screen>
  );
};
