import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ChatNavigator } from './ChatNavigator';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { colors } from '../constants/colors';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'chatbubble-ellipses-outline';
          if (route.name === 'ChatTab') iconName = 'chatbubble-ellipses-outline';
          else if (route.name === 'HistoryTab') iconName = 'bar-chart-outline';
          else if (route.name === 'ProfileTab') iconName = 'person-outline';

          return (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Ionicons
                name={iconName}
                size={20}
                color={focused ? colors.primary : colors.textMuted}
              />
            </View>
          );
        },
      })}>
      <Tab.Screen name="ChatTab" component={ChatNavigator} options={{ title: 'Chat' }} />
      <Tab.Screen name="HistoryTab" component={HistoryScreen} options={{ title: 'Histórico' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopColor: colors.borderDark,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconContainer: {
    padding: 4,
    borderRadius: 12,
  },
  iconActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
  },
});
