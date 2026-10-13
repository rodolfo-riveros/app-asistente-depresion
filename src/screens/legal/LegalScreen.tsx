import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, Chip, HelpButton, IconButton, Screen, Title, Txt } from '../../components/ui';
import { colors } from '../../constants/colors';
import type { RootScreenProps } from '../../navigation/types';
import { ACTUALIZADO, CONTACTO, SeccionLegal, privacidad, terminos } from './contenidoLegal';

type Pestana = 'privacidad' | 'terminos';

/** Política de privacidad y términos de uso. Accesible con y sin sesión. */
export const LegalScreen: React.FC<RootScreenProps<'Legal'>> = ({ navigation, route }) => {
  const [pestana, setPestana] = useState<Pestana>(route.params?.seccion ?? 'privacidad');
  const secciones: SeccionLegal[] = pestana === 'privacidad' ? privacidad : terminos;

  return (
    <Screen scroll gap={16}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -10 }}>
        <IconButton name="back" accessibilityLabel="Volver" onPress={() => navigation.goBack()} />
      </View>

      <View style={{ gap: 6 }}>
        <Title>{pestana === 'privacidad' ? 'Privacidad' : 'Términos de uso'}</Title>
        <Txt size={13} color={colors.inkSoft}>
          Actualizado el {ACTUALIZADO}
        </Txt>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip
          label="Privacidad"
          selected={pestana === 'privacidad'}
          onPress={() => setPestana('privacidad')}
        />
        <Chip
          label="Términos"
          selected={pestana === 'terminos'}
          onPress={() => setPestana('terminos')}
        />
      </View>

      {secciones.map((s) => (
        <Card key={s.titulo} gap={8}>
          <Txt size={15} weight="semibold" accessibilityRole="header">
            {s.titulo}
          </Txt>
          {s.parrafos.map((p, i) => (
            <Txt key={i} size={14} leading={1.5} color={colors.inkSoft}>
              {p}
            </Txt>
          ))}
        </Card>
      ))}

      {!CONTACTO && (
        <Txt size={12.5} leading={1.4} color={colors.inkSoft}>
          Versión preliminar: el contacto para ejercer tus derechos se publicará antes del
          lanzamiento.
        </Txt>
      )}

      <HelpButton />
    </Screen>
  );
};
