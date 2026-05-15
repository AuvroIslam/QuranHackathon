import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '../theme';

// Background must match screen bg for neumorphism to work
const NEU_BG = COLORS.bg; // #F0EBFF

interface NeuButtonProps {
  onPress: () => void;
  label?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  pill?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  primary?: boolean;
}

export default function NeuButton({
  onPress, label, children, disabled, pill, size = 'md', style, primary,
}: NeuButtonProps) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: false, speed: 40, bounciness: 0 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 0, useNativeDriver: false, speed: 20, bounciness: 4 }).start();
  };

  const sizeStyle = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;
  const radius = pill ? RADIUS.full : RADIUS.xl;

  // Interpolate shadow offsets for press-in effect
  const lightShadowOffset = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-5, 2], // light (top-left) → shifts inward
  });
  const darkShadowOffset = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [5, -2], // dark (bottom-right) → shifts inward
  });
  const shadowOpacity = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.4],
  });
  const scale = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });

  const bg = primary ? COLORS.primary : NEU_BG;
  const lightShadow = primary ? 'rgba(180,140,255,0.5)' : 'rgba(255,255,255,0.9)';
  const darkShadow = primary ? 'rgba(60,20,120,0.45)' : 'rgba(162,140,220,0.45)';

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      {/* Dark shadow layer (bottom-right) */}
      <Animated.View
        style={[
          styles.shadowLayer,
          sizeStyle,
          { borderRadius: radius, backgroundColor: bg },
          {
            shadowColor: darkShadow,
            shadowOffset: { width: darkShadowOffset as any, height: darkShadowOffset as any },
            shadowOpacity,
            shadowRadius: 10,
            elevation: 6,
          },
        ]}
      >
        {/* Light shadow layer (top-left) */}
        <Animated.View
          style={[
            styles.shadowLayer,
            sizeStyle,
            { borderRadius: radius, backgroundColor: bg },
            {
              shadowColor: lightShadow,
              shadowOffset: { width: lightShadowOffset as any, height: lightShadowOffset as any },
              shadowOpacity,
              shadowRadius: 8,
            },
          ]}
        >
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            disabled={disabled}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled: !!disabled }}
            style={[styles.inner, sizeStyle, { borderRadius: radius, opacity: disabled ? 0.45 : 1 }]}
          >
            {label ? (
              <Text style={[styles.label, primary && styles.labelPrimary]}>{label}</Text>
            ) : (
              children
            )}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

export function NeuIconButton({
  onPress, children, size = 72, disabled,
}: {
  onPress: () => void;
  children: React.ReactNode;
  size?: number;
  disabled?: boolean;
}) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: false, speed: 40, bounciness: 0 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 0, useNativeDriver: false, speed: 20, bounciness: 4 }).start();
  };

  const offset = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [5, -2] });
  const lightOffset = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [-5, 2] });
  const opacity = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0.35] });
  const scale = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] });
  const radius = size / 2;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Animated.View
        style={{
          width: size, height: size, borderRadius: radius,
          backgroundColor: NEU_BG,
          shadowColor: 'rgba(162,140,220,0.45)',
          shadowOffset: { width: offset as any, height: offset as any },
          shadowOpacity: opacity,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        <Animated.View
          style={{
            width: size, height: size, borderRadius: radius,
            backgroundColor: NEU_BG,
            shadowColor: 'rgba(255,255,255,0.9)',
            shadowOffset: { width: lightOffset as any, height: lightOffset as any },
            shadowOpacity: opacity,
            shadowRadius: 8,
          }}
        >
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            disabled={disabled}
            style={{
              width: size, height: size, borderRadius: radius,
              alignItems: 'center', justifyContent: 'center',
              opacity: disabled ? 0.45 : 1,
            }}
          >
            {children}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sm: { paddingVertical: 10, paddingHorizontal: 18 },
  md: { paddingVertical: 14, paddingHorizontal: 24 },
  lg: { paddingVertical: 17, paddingHorizontal: 0, width: '100%' },
  label: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelPrimary: {
    color: COLORS.white,
    fontSize: 16,
  },
});
