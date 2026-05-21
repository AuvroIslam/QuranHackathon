import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

export type HapticType = 'tick' | 'light' | 'medium' | 'heavy' | 'success' | 'error';

// Android: explicit Vibration durations/patterns — expo-haptics maps to very
// short system pulses on Android which are barely felt. Vibration.vibrate()
// with explicit ms gives Duolingo-level feedback.
// iOS: bump impact styles up one tier so every press feels solid.
//
// Duolingo feel: single crisp punchy pulses (not long buzzes).
// Patterns: [wait, vibrate, wait, vibrate] — short pauses keep it snappy.
const ANDROID: Record<HapticType, number | number[]> = {
  tick:    35,
  light:   80,
  medium:  120,
  heavy:   180,
  success: [0, 100, 70, 160],   // quick tap then stronger — reward feel
  error:   [0, 140, 75, 160],   // two equal punches — mistake feel
};

export function triggerHaptic(enabled: boolean, type: HapticType) {
  if (!enabled) return;

  if (Platform.OS === 'android') {
    Vibration.vibrate(ANDROID[type]);
    return;
  }

  // iOS — Taptic Engine (bumped one tier: light→Medium, medium→Heavy)
  switch (type) {
    case 'tick':
      Haptics.selectionAsync().catch(() => {});
      break;
    case 'light':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      break;
    case 'medium':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      break;
    case 'heavy':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {}), 90);
      break;
    case 'success':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      break;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      break;
  }
}
