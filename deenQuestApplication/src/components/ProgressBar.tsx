import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORS, RADIUS } from '../theme';

interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
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

const styles = StyleSheet.create({
  track: {
    height: 10,
    backgroundColor: COLORS.surfaceDark,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
});
