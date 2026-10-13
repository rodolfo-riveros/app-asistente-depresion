import React, { useState } from 'react';
import { Modal, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, HelpButton, IconButton, Txt } from '../../../components/ui';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { lineaAyuda } from '../../../constants/asistente';
import { ANCHO_MAXIMO } from '../../../hooks/useLayout';
import { Recurso, etiquetaCategoria } from '../contenido';
import { llamar } from '../enlaces';
import { Respiracion478 } from './Respiracion478';

interface Props {
  recurso: Recurso | null;
  onClose: () => void;
}

/** Columna de lectura centrada: en tablet (o iPad con hoja ancha) no se estira. */
const COLUMNA = { width: '100%', maxWidth: ANCHO_MAXIMO, alignSelf: 'center' } as const;

/**
 * Hoja con la guía o los pasos de un ejercicio (fondo crema).
 *
 * Conserva el último recurso mientras la hoja se desliza hacia abajo (si no, se
 * vería vacía al cerrar). El temporizador se detiene en cuanto `recurso` pasa a
 * `null`, y se desmonta del todo cuando el Modal termina de ocultarse.
 * `onRequestClose` cubre el botón atrás de Android y el gesto de bajar la hoja en iOS.
 */
export const GuiaModal: React.FC<Props> = ({ recurso, onClose }) => {
  const [mostrado, setMostrado] = useState<Recurso | null>(recurso);
  if (recurso && recurso !== mostrado) setMostrado(recurso);
  const visible = recurso !== null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <SafeAreaView
        edges={
          Platform.OS === 'ios' ? ['bottom', 'left', 'right'] : ['top', 'bottom', 'left', 'right']
        }
        style={{ flex: 1, backgroundColor: colors.background }}>
        {mostrado && <Contenido recurso={mostrado} activo={visible} onClose={onClose} />}
      </SafeAreaView>
    </Modal>
  );
};

const Contenido: React.FC<{ recurso: Recurso; activo: boolean; onClose: () => void }> = ({
  recurso,
  activo,
  onClose,
}) => {
  const esGuia = recurso.tipo === 'guia';
  const meta = `${esGuia ? 'Guía' : etiquetaCategoria[recurso.categoria]} · ${recurso.minutos} min`;

  return (
    <>
      {/* Asa de la hoja + cerrar */}
      <View style={{ alignItems: 'center', paddingTop: 8 }}>
        <View
          style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.toggleOff }}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          paddingHorizontal: spacing.screen - 8,
          ...COLUMNA,
        }}>
        <IconButton name="close" accessibilityLabel="Cerrar" onPress={onClose} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.screen,
          paddingBottom: 32,
          gap: spacing.stack,
          ...COLUMNA,
        }}
        showsVerticalScrollIndicator={false}>
        <View style={{ gap: 8 }}>
          <Txt size={12} weight="bold" tracking={0.6} color={colors.forest}>
            {meta.toUpperCase()}
          </Txt>
          <Txt
            size={26}
            weight="bold"
            tracking={-0.5}
            leading={1.2}
            maxFontSizeMultiplier={1.2}
            accessibilityRole="header">
            {recurso.titulo}
          </Txt>
          <Txt size={15} leading={1.45} color={colors.inkSoft}>
            {recurso.resumen}
          </Txt>
        </View>

        {recurso.temporizador478 && <Respiracion478 activo={activo} />}

        {recurso.secciones?.map((s) => (
          <Card key={s.titulo} gap={6}>
            <Txt size={15} weight="semibold" accessibilityRole="header">
              {s.titulo}
            </Txt>
            <Txt size={14.5} leading={1.5} color={colors.inkSoft}>
              {s.texto}
            </Txt>
          </Card>
        ))}

        {recurso.pasos && (
          <Card gap={14}>
            <Txt size={15} weight="semibold" accessibilityRole="header">
              Paso a paso
            </Txt>
            {recurso.pasos.map((paso, i) => (
              <View key={paso} style={{ flexDirection: 'row', gap: 12 }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    flexShrink: 0,
                    borderRadius: radius.full,
                    backgroundColor: colors.sage,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Txt size={12.5} weight="bold" color={colors.forest}>
                    {i + 1}
                  </Txt>
                </View>
                <Txt size={14.5} leading={1.45} style={{ flex: 1, paddingTop: 2 }}>
                  {paso}
                </Txt>
              </View>
            ))}
          </Card>
        )}

        {recurso.nota && (
          <Card tone="sage" rounded={radius.lg} padding={14}>
            <Txt size={13.5} leading={1.45} color={colors.inkOnSage}>
              {recurso.nota}
            </Txt>
          </Card>
        )}

        {esGuia && <HelpButton onPress={() => llamar(lineaAyuda.telefono)} />}
      </ScrollView>
    </>
  );
};
