import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabBar } from '../components/TabBar';
import { InicioScreen } from '../screens/inicio/InicioScreen';
import { RegistroScreen } from '../screens/registro/RegistroScreen';
import { RecursosScreen } from '../screens/recursos/RecursosScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { colors } from '../constants/colors';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

/** Pestañas principales. Chat y Voz se abren encima, sin tab bar (ver RootNavigator). */
export const AppNavigator: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <TabBar {...props} />}
    screenOptions={{
      headerShown: false,
      tabBarHideOnKeyboard: true,
      // Fondo de cada pestaña y transición suave entre ellas (sin destello).
      sceneStyle: { backgroundColor: colors.background },
      animation: 'fade',
    }}>
    <Tab.Screen name="InicioTab" component={InicioScreen} />
    <Tab.Screen name="RegistroTab" component={RegistroScreen} />
    <Tab.Screen name="RecursosTab" component={RecursosScreen} />
    <Tab.Screen name="PerfilTab" component={ProfileScreen} />
  </Tab.Navigator>
);
