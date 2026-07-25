import React, { ReactNode } from 'react';
import { StyleSheet, View, StatusBar, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';

interface SpatialContainerProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'normal' | 'crisis';
}

export const SpatialContainer: React.FC<SpatialContainerProps> = ({
  children,
  style,
  variant = 'normal',
}) => {
  const gradientColors = variant === 'crisis' ? colors.crisisGradient : colors.spaceGradient;

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={[styles.orb, styles.orbTopRight]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbBottomLeft]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbCenter]} pointerEvents="none" />

      <SafeAreaView style={[styles.safeArea, style]}>{children}</SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.3,
  },
  orbTopRight: {
    width: 320,
    height: 320,
    top: -100,
    right: -100,
    backgroundColor: colors.primary,
  },
  orbBottomLeft: {
    width: 350,
    height: 350,
    bottom: -120,
    left: -120,
    backgroundColor: colors.tertiary,
  },
  orbCenter: {
    width: 200,
    height: 200,
    top: '40%',
    right: -60,
    backgroundColor: colors.secondary,
  },
});
