import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '../constants/colors';
import { glassTint } from '../constants/glass';

type IoniconsName = keyof typeof Ionicons.glyphMap;

const routeIcons: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  ChatTab: { active: 'chatbubble-ellipses', inactive: 'chatbubble-ellipses-outline' },
  ActividadesTab: { active: 'checkmark-circle', inactive: 'checkmark-circle-outline' },
  DiagnosticoTab: { active: 'bar-chart', inactive: 'bar-chart-outline' },
  PerfilTab: { active: 'person', inactive: 'person-outline' },
};

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.wrapper}>
      <BlurView intensity={28} tint={glassTint} style={styles.blur}>
        <View style={styles.inner}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;
            const icons = routeIcons[route.name] || {
              active: 'ellipse',
              inactive: 'ellipse-outline',
            };
            const iconName = focused ? icons.active : icons.inactive;
            const label = options.title || route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}>
                <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                  <Ionicons
                    name={iconName}
                    size={20}
                    color={focused ? colors.primary : colors.textMuted}
                  />
                </View>
                {focused && (
                  <Text style={styles.label} numberOfLines={1}>
                    {label}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    left: 60,
    right: 60,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  blur: {
    borderRadius: 9999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    gap: 6,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(185, 217, 255, 0.12)',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    color: colors.primary,
  },
});
