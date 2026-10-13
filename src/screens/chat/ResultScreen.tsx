import React, { useState } from 'react';
import { Alert, Share, View } from 'react-native';
import { ResultCard } from '../../components/ResultCard';
import { Button, Card, IconButton, Screen, Title, Txt } from '../../components/ui';
import { colors } from '../../constants/colors';
import { asistente } from '../../constants/asistente';
import { SCORE_MAXIMO } from '../../services/diagnostico';
import { useChat } from '../../hooks/useChat';
import { useLayout } from '../../hooks/useLayout';
import { storage } from '../../utils/storage';
import type { RootScreenProps } from '../../navigation/types';

export const ResultScreen: React.FC<RootScreenProps<'Result'>> = ({ navigation, route }) => {
  const { resetChat } = useChat();
  const { anchoContenido, fontScale } = useLayout();
  // Dos botones en fila sólo si caben (360 px o fuente al 130 % → apilados).
  const apilar = anchoContenido / Math.min(Math.max(fontScale, 1), 1.35) < 380;
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const resultado = route.params?.resultado;

  const volver = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainApp');
  };

  if (!resultado) {
    return (
      <Screen contentStyle={{ justifyContent: 'center' }}>
        <Card gap={14}>
          <Txt size={15} weight="semibold">
            No hay un resultado para mostrar
          </Txt>
          <Txt size={14} color={colors.inkSoft} leading={1.4}>
            Cuando {asistente.nombre} complete el chequeo contigo, aquí verás tu resumen.
          </Txt>
          <Button label="Volver" size="md" onPress={volver} />
        </Card>
      </Screen>
    );
  }

  const compartir = async () => {
    try {
      const mensaje =
        `Resumen de mi evaluación (${asistente.nombre}):\n` +
        `Nivel: ${resultado.nivel}\n` +
        `Puntaje: ${resultado.score}/${SCORE_MAXIMO}\n` +
        (resultado.fecha
          ? `Fecha: ${new Date(resultado.fecha).toLocaleDateString('es-PE')}\n`
          : '') +
        (resultado.interpretacion ? `\nInterpretación: ${resultado.interpretacion}` : '');
      await Share.share({ message: mensaje, title: 'Resumen de mi evaluación' });
    } catch {
      Alert.alert('No se pudo compartir', 'Inténtalo de nuevo en un momento.');
    }
  };

  const guardar = async () => {
    if (guardado || guardando) return;
    setGuardando(true);
    try {
      await storage.saveEvaluation(resultado);
      setGuardado(true);
      Alert.alert('Guardado', 'Tu evaluación se guardó en el historial de este dispositivo.');
    } catch {
      Alert.alert('No se pudo guardar', 'Inténtalo de nuevo en un momento.');
    } finally {
      setGuardando(false);
    }
  };

  const otraEvaluacion = () => {
    resetChat();
    navigation.navigate('Chat');
  };

  return (
    <Screen scroll edges={['top', 'left', 'right', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: -10 }}>
        <IconButton name="back" accessibilityLabel="Volver" onPress={volver} />
      </View>

      <View style={{ gap: 6 }}>
        <Title>Tu resultado</Title>
        <Txt size={14} color={colors.inkSoft} leading={1.45}>
          Gracias por compartir lo que sientes con {asistente.nombre}. Este es el resumen de lo que
          conversaron.
        </Txt>
      </View>

      <ResultCard resultado={resultado} />

      <Card tone="sage" gap={12}>
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
            label="Compartir"
            size="sm"
            variant="secondary"
            icon="share"
            grow={!apilar}
            onPress={compartir}
          />
        </View>
      </Card>

      <View style={{ gap: 8 }}>
        <Button label="Hacer otra evaluación" onPress={otraEvaluacion} />
        <Button
          label={guardado ? 'Guardado en este dispositivo' : 'Guardar en este dispositivo'}
          variant="ghost"
          size="md"
          icon={guardado ? 'check' : undefined}
          loading={guardando}
          disabled={guardado}
          onPress={guardar}
        />
      </View>
    </Screen>
  );
};
