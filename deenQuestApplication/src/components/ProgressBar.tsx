import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { RADIUS } from '../theme';

interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(1, current / total));
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: pct,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  }, [pct]);

  const styles = useMemo(() => StyleSheet.create({
    track: {
      height: 10,
      backgroundColor: colors.surfaceDark,
      borderRadius: RADIUS.full,
      overflow: 'hidden',
    },
    fill: {
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: RADIUS.full,
    },
  }), [colors]);

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}
