import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { AvatarAssistant } from './AvatarAssistant';
import { Glass } from './Glass';

export const TypingIndicator: React.FC = () => {
  const [dot1] = useState(() => new Animated.Value(0.3));
  const [dot2] = useState(() => new Animated.Value(0.3));
  const [dot3] = useState(() => new Animated.Value(0.3));

  useEffect(() => {
    const createPulse = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createPulse(dot1, 0);
    const anim2 = createPulse(dot2, 200);
    const anim3 = createPulse(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.container}>
      <AvatarAssistant size="sm" emotion="listening" />
      <Glass
        level="base"
        style={styles.bubble}
        radius={spacing.borderRadiusLg}
        radiusStyle={styles.bubbleRadius}
        contentStyle={styles.bubbleContent}>
        <Text style={styles.typingText}>Hamilton está respondiendo</Text>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
      </Glass>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  bubble: {
    marginLeft: spacing.sm,
  },
  bubbleRadius: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: spacing.borderRadiusLg,
    borderBottomLeftRadius: spacing.borderRadiusLg,
    borderBottomRightRadius: spacing.borderRadiusLg,
  },
  bubbleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  typingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginRight: spacing.xs,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginHorizontal: 2,
  },
});
