import React, { ReactNode } from 'react';
import { StyleSheet, StatusBar, StyleProp, ViewStyle, View } from 'react-native';
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
  const isCrisis = variant === 'crisis';
  const overlayColors = isCrisis
    ? ['rgba(26, 10, 10, 0.80)', 'rgba(30, 45, 68, 0.70)', 'rgba(16, 26, 45, 0.80)']
    : ['rgba(16, 26, 45, 0.88)', 'rgba(23, 36, 58, 0.80)', 'rgba(26, 26, 53, 0.88)'];
  const topGlow = isCrisis ? colors.glowCrisis : colors.softGlow;
  const topGlowSoft = isCrisis ? colors.glowCrisisSoft : colors.glowPrimarySoft;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={overlayColors}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        pointerEvents="none"
        colors={[topGlow, topGlowSoft]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        pointerEvents="none"
        colors={[colors.glowSecondarySoft, colors.glowSecondary]}
        start={{ x: 0.2, y: 0.45 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={[styles.safeArea, style]}>{children}</SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#242a3c',
  },
  safeArea: {
    flex: 1,
  },
});
