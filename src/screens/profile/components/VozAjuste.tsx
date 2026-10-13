import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, Pressable, View } from 'react-native';
import { Button, Card, Chip, Icon, Txt } from '../../../components/ui';
import { asistente } from '../../../constants/asistente';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/spacing';
import {
  listarVocesEspanol,
  probarVoz,
  refrescarPreferenciasVoz,
  voz,
  type RitmoVoz,
  type VozDisponible,
} from '../../../services/voz';
import { preferencias } from '../../../utils/preferencias';
import { Hoja } from './Hoja';

/** `'auto'` = prueba de la voz automática; si no, el id de la voz. */
type Prueba = 'auto' | string;

const RITMOS: { valor: RitmoVoz; etiqueta: string }[] = [
  { valor: 'pausada', etiqueta: 'Pausada' },
  { valor: 'normal', etiqueta: 'Normal' },
];

const COMO_INSTALAR =
  Platform.OS === 'ios'
    ? 'En Ajustes › Accesibilidad › Contenido leído › Voces › Español puedes descargar voces (las "mejoradas" suenan más naturales).'
    : 'En Ajustes › Accesibilidad › Texto a voz › Motor preferido (Google) › Instalar datos de voz › Español puedes descargarlas.';

const describirGenero = (v: VozDisponible) =>
  v.femenina === true ? 'femenina' : v.femenina === false ? 'masculina' : null;

const detalleVoz = (v: VozDisponible) =>
  [
    v.pais,
    describirGenero(v),
    v.calidad === 'alta' ? 'alta calidad' : null,
    v.enLinea ? 'con internet' : null,
  ]
    .filter(Boolean)
    .join(' · ');

/**
 * Fila "Voz de {asistente}" para la tarjeta de ajustes de Perfil + hoja con el
 * ritmo y las voces en español del teléfono. Autónoma: lee y guarda en
 * `preferencias` (`vozId`, `vozRitmo`) y avisa al servicio de voz.
 */
export const VozAjuste: React.FC = () => {
  const [abierta, setAbierta] = useState(false);
  const [vozId, setVozId] = useState<string | null>(null);
  const [ritmo, setRitmo] = useState<RitmoVoz>('pausada');
  const [voces, setVoces] = useState<VozDisponible[] | null>(null);
  const [probando, setProbando] = useState<Prueba | null>(null);
  const probandoRef = useRef<Prueba | null>(null);

  const montadoRef = useRef(true);

  const cargar = useCallback(
    () =>
      Promise.all([preferencias.obtener(), listarVocesEspanol()]).then(([prefs, lista]) => {
        if (!montadoRef.current) return;
        setVozId(prefs.vozId);
        setRitmo(prefs.vozRitmo);
        setVoces(lista);
      }),
    []
  );

  useEffect(() => {
    montadoRef.current = true;
    cargar();
    return () => {
      montadoRef.current = false;
    };
  }, [cargar]);

  const marcarPrueba = (valor: Prueba | null) => {
    probandoRef.current = valor;
    setProbando(valor);
  };

  const detenerPrueba = useCallback(() => {
    if (probandoRef.current === null) return;
    probandoRef.current = null;
    setProbando(null);
    voz.callar();
  }, []);

  // Al volver de Ajustes (p. ej. tras instalar voces) se relee el catálogo.
  useEffect(() => {
    if (!abierta) return;
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') {
        refrescarPreferenciasVoz();
        cargar();
      } else {
        detenerPrueba();
      }
    });
    return () => sub.remove();
  }, [abierta, cargar, detenerPrueba]);

  // Si el componente se desmonta con una prueba sonando, se corta.
  useEffect(() => detenerPrueba, [detenerPrueba]);

  const abrir = () => {
    refrescarPreferenciasVoz();
    setVoces(null);
    setAbierta(true);
    cargar();
  };

  const cerrar = () => {
    detenerPrueba();
    setAbierta(false);
  };

  const guardar = async (cambios: { vozId?: string | null; vozRitmo?: RitmoVoz }) => {
    if (cambios.vozId !== undefined) setVozId(cambios.vozId);
    if (cambios.vozRitmo) setRitmo(cambios.vozRitmo);
    try {
      await preferencias.guardar(cambios);
    } finally {
      refrescarPreferenciasVoz();
    }
  };

  const probar = (prueba: Prueba) => {
    if (probandoRef.current === prueba) {
      detenerPrueba();
      return;
    }
    marcarPrueba(prueba);
    probarVoz(prueba === 'auto' ? null : prueba, ritmo, () => {
      if (probandoRef.current === prueba) marcarPrueba(null);
    });
  };

  const recomendada = voces?.[0] ?? null;
  const elegida = vozId ? (voces?.find((v) => v.id === vozId) ?? null) : null;
  // Elegida pero ya no instalada: se usa la automática.
  const enAutomatico = !elegida;

  const resumen = elegida
    ? `${elegida.nombre} · ${elegida.pais}`
    : recomendada?.femenina
      ? 'Automática · femenina'
      : 'Automática';

  const titulo = `Voz de ${asistente.nombre}`;

  return (
    <>
      <Pressable
        onPress={abrir}
        accessibilityRole="button"
        accessibilityLabel={`${titulo}. ${resumen}`}
        accessibilityHint="Abre la elección de voz y ritmo"
        android_ripple={{ color: colors.ripple }}
        style={({ pressed }) => ({
          minHeight: 60,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 8,
          // Android: onda; iOS: opacidad.
          opacity: pressed && Platform.OS !== 'android' ? 0.7 : 1,
        })}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={14.5} weight="semibold">
            {titulo}
          </Txt>
          <Txt size={12.5} color={colors.inkSoft} numberOfLines={1}>
            {resumen}
          </Txt>
        </View>
        <Icon name="chevronRight" size={18} color={colors.ink} strokeWidth={2} />
      </Pressable>

      <Hoja visible={abierta} titulo={titulo} onClose={cerrar}>
        <View style={{ gap: 8 }}>
          <Txt size={13} weight="semibold" color={colors.inkSoft} accessibilityRole="header">
            Ritmo
          </Txt>
          <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
            {RITMOS.map((r) => (
              <Chip
                key={r.valor}
                label={r.etiqueta}
                selected={ritmo === r.valor}
                onPress={() => {
                  detenerPrueba();
                  guardar({ vozRitmo: r.valor });
                }}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Txt size={13} weight="semibold" color={colors.inkSoft} accessibilityRole="header">
            Voz
          </Txt>

          {voces === null ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator color={colors.forest} accessibilityLabel="Buscando voces" />
            </View>
          ) : voces.length === 0 ? (
            <Card tone="muted" gap={6}>
              <Txt size={14.5} weight="semibold">
                No hay voces en español en este teléfono
              </Txt>
              <Txt size={13} color={colors.inkSoft} leading={1.4}>
                {`${asistente.nombre} usará la voz por defecto del sistema. ${COMO_INSTALAR}`}
              </Txt>
            </Card>
          ) : (
            <>
              <OpcionVoz
                nombre="Automática (recomendada)"
                detalle={
                  recomendada
                    ? `Ahora: ${recomendada.nombre} · ${detalleVoz(recomendada)}`
                    : 'La mejor voz femenina en español del teléfono'
                }
                seleccionada={enAutomatico}
                probando={probando === 'auto'}
                onProbar={() => probar('auto')}
                onUsar={() => guardar({ vozId: null })}
              />
              {voces.map((v) => (
                <OpcionVoz
                  key={v.id}
                  nombre={v.nombre}
                  detalle={detalleVoz(v)}
                  recomendada={v.id === recomendada?.id}
                  seleccionada={v.id === elegida?.id}
                  probando={probando === v.id}
                  onProbar={() => probar(v.id)}
                  onUsar={() => guardar({ vozId: v.id })}
                />
              ))}
            </>
          )}
        </View>

        <Txt size={12.5} color={colors.inkSoft} leading={1.4}>
          Las voces dependen de tu teléfono. Puedes descargar más voces en Ajustes › Accesibilidad /
          Texto a voz.
        </Txt>
      </Hoja>
    </>
  );
};

interface OpcionVozProps {
  nombre: string;
  detalle: string;
  recomendada?: boolean;
  seleccionada: boolean;
  probando: boolean;
  onProbar: () => void;
  onUsar: () => void;
}

const OpcionVoz: React.FC<OpcionVozProps> = ({
  nombre,
  detalle,
  recomendada = false,
  seleccionada,
  probando,
  onProbar,
  onUsar,
}) => (
  <View
    style={{
      borderRadius: radius.lg,
      borderWidth: seleccionada ? 2 : 1,
      borderColor: seleccionada ? colors.forest : colors.border,
      backgroundColor: colors.surface,
      padding: 14,
      gap: 10,
    }}>
    <View
      accessible
      accessibilityLabel={[
        nombre,
        detalle,
        recomendada ? 'recomendada' : null,
        seleccionada ? 'en uso' : null,
      ]
        .filter(Boolean)
        .join('. ')}
      accessibilityState={{ selected: seleccionada }}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Txt size={14.5} weight="semibold">
            {nombre}
          </Txt>
          {recomendada && (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: radius.full,
                backgroundColor: colors.sage,
              }}>
              <Txt size={11.5} weight="semibold" color={colors.inkOnSage}>
                Recomendada
              </Txt>
            </View>
          )}
        </View>
        <Txt size={12.5} color={colors.inkSoft} leading={1.35}>
          {detalle}
        </Txt>
      </View>
      {seleccionada && <Icon name="check" size={20} color={colors.forest} strokeWidth={2.4} />}
    </View>

    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Button
        label={probando ? 'Detener' : 'Probar'}
        icon={probando ? 'stop' : 'play'}
        variant="outline"
        size="sm"
        grow
        onPress={onProbar}
        accessibilityHint={
          probando ? `Detiene la prueba de ${nombre}` : `Reproduce una frase con ${nombre}`
        }
      />
      <Button
        label={seleccionada ? 'En uso' : 'Usar'}
        variant={seleccionada ? 'secondary' : 'primary'}
        size="sm"
        grow
        disabled={seleccionada}
        onPress={onUsar}
        accessibilityHint={
          seleccionada ? undefined : `Usa ${nombre} como voz de ${asistente.nombre}`
        }
      />
    </View>
  </View>
);
