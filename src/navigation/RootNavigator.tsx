import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { VozScreen } from '../screens/voz/VozScreen';
import { ResultScreen } from '../screens/chat/ResultScreen';
import { CrisisProtocolScreen } from '../screens/chat/CrisisProtocolScreen';
import { ActividadesScreen } from '../screens/actividades/ActividadesScreen';
import { AppNavigator } from './AppNavigator';
import { colors } from '../constants/colors';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="MainApp" component={AppNavigator} options={{ animation: 'fade' }} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen
            name="Voz"
            component={VozScreen}
            options={{
              animation: 'slide_from_bottom',
              contentStyle: { backgroundColor: colors.voiceBg },
            }}
          />
          <Stack.Screen name="Actividades" component={ActividadesScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
          <Stack.Screen name="CrisisProtocol" component={CrisisProtocolScreen} />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Bienvenida"
            component={WelcomeScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
