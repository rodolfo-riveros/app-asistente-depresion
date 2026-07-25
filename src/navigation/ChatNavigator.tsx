import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { ResultScreen } from '../screens/chat/ResultScreen';
import { CrisisProtocolScreen } from '../screens/chat/CrisisProtocolScreen';

const Stack = createNativeStackNavigator();

export const ChatNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="ChatMain" component={ChatScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="CrisisProtocol" component={CrisisProtocolScreen} />
    </Stack.Navigator>
  );
};
