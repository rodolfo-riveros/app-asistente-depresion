import React from 'react';
import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ChatNavigator } from './ChatNavigator';
import { ActividadesScreen } from '../screens/actividades/ActividadesScreen';
import { DiagnosticoScreen } from '../screens/diagnostico/DiagnosticoScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { colors } from '../constants/colors';
import { glassTint } from '../constants/glass';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => <BlurView intensity={24} tint={glassTint} style={styles.tabBlur} />,
        tabBarIcon: ({ focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'chatbubble-ellipses-outline';
          if (route.name === 'ChatTab')
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          else if (route.name === 'ActividadesTab')
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          else if (route.name === 'DiagnosticoTab')
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          else if (route.name === 'PerfilTab') iconName = focused ? 'person' : 'person-outline';

          return (
            <Ionicons
              name={iconName}
              size={22}
              color={focused ? colors.textPrimary : colors.textMuted}
            />
          );
        },
      })}>
      <Tab.Screen name="ChatTab" component={ChatNavigator} options={{ title: 'Chat' }} />
      <Tab.Screen
        name="ActividadesTab"
        component={ActividadesScreen}
        options={{ title: 'Actividades' }}
      />
      <Tab.Screen
        name="DiagnosticoTab"
        component={DiagnosticoScreen}
        options={{ title: 'Diagnóstico' }}
      />
      <Tab.Screen name="PerfilTab" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 16,
    left: 40,
    right: 40,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingTop: 6,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  tabBlur: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
});
