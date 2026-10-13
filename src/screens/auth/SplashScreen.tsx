import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { LogoMark, Screen, Txt } from '../../components/ui';
import { colors } from '../../constants/colors';
import { app } from '../../constants/asistente';

/** Carga inicial (restaurando sesión): fondo crema, isotipo y marca. */
export const SplashScreen: React.FC = () => (
  <Screen
    edges={['top', 'left', 'right', 'bottom']}
    contentStyle={{ alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{ alignItems: 'center', gap: 16 }}
      accessible
      accessibilityLabel={`${app.nombre}, cargando`}>
      <LogoMark size={72} />
      <Txt size={30} weight="bold" tracking={-0.6}>
        {app.nombre}
      </Txt>
      <ActivityIndicator color={colors.forest} style={{ marginTop: 16 }} />
    </View>
  </Screen>
);
