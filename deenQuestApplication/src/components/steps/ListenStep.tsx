import { Audio } from 'expo-av';
import { Loader, Pause, Play } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../lib/haptics';
import { RADIUS, SHADOW } from '../../theme';
import { Ayah } from '../../types';

interface Props {
  ayah: Ayah;
}

type PlayState = 'idle' | 'loading' | 'playing' | 'done';

export default function ListenStep({ ayah }: Props) {
  const { colors, hapticsEnabled } = useTheme();
  const [playState, setPlayState] = useState<PlayState>('idle');
  const progressAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  const RADIUS_VAL = 52;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS_VAL;
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync().catch(() => {}); };
  }, []);

  const playAudio = async () => {
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      setPlayState('loading');
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: ayah.audioUrl }, { shouldPlay: false });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.isPlaying) {
          setPlayState('playing');
          if (status.durationMillis && status.durationMillis > 0) {
            const target = status.positionMillis / status.durationMillis;
            Animated.timing(progressAnim, {
              toValue: target,
              duration: 150,
              useNativeDriver: false,
            }).start();
          }
        }
        if (status.didJustFinish) {
          setPlayState('idle');
          progressAnim.setValue(0);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
      await sound.playAsync();
    } catch {
      setPlayState('idle');
      progressAnim.setValue(0);
    }
  };

  const stopAudio = async () => {
    progressAnim.setValue(0);
    await soundRef.current?.stopAsync().catch(() => {});
    await soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    setPlayState('idle');
  };

  const BtnIcon = () => {
    if (playState === 'loading') return <Loader size={34} color={colors.white} />;
    if (playState === 'playing') return <Pause size={34} color={colors.white} fill={colors.white} />;
    return <Play size={34} color={colors.white} fill={colors.white} />;
  };

  // Circular progress: circumference of circle r=52
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  const hintText = {
    idle: 'Tap to play the recitation',
    loading: 'Loading…',
    playing: 'Playing — listen closely',
    done: 'Tap to play again',
  }[playState] ?? 'Tap to play the recitation';

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, padding: 16, paddingTop: 32, gap: 16 },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    titleBlock: { flex: 1, gap: 4 },
    title: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
    sub: { color: colors.textSub, fontSize: 14 },
    arabicCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.xl,
      borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden', ...SHADOW.card,
    },
    cardBar: { height: 5, backgroundColor: colors.primary },
    arabic: {
      color: colors.text, fontSize: 26, textAlign: 'right',
      lineHeight: 48, padding: 20, paddingBottom: 8, writingDirection: 'rtl',
    },
    transliteration: {
      color: colors.textMuted, fontSize: 12, textAlign: 'center',
      fontStyle: 'italic', paddingHorizontal: 16, paddingBottom: 4,
    },
    translation: {
      color: colors.textSub, fontSize: 13, textAlign: 'center',
      fontStyle: 'italic', paddingHorizontal: 16, paddingBottom: 16,
    },
    character: { width: 90, height: 100, resizeMode: 'contain' },
    btnWrap: { alignItems: 'center', gap: 12, marginTop: 44 },
    ringWrap: { width: 114, height: 114, alignItems: 'center', justifyContent: 'center' },
    ringContainer: { position: 'absolute', top: 0, left: 0 },
    playBtn: {
      width: 90, height: 90, borderRadius: 45,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    hint: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingTop: 10 },
    replayBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 7,
      paddingHorizontal: 22, paddingVertical: 10,
      borderRadius: RADIUS.full, borderWidth: 1.5,
      borderColor: colors.primary, backgroundColor: colors.primaryBg,
    },
    replayText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  }), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Listen to the Ayah</Text>
          <Text style={styles.sub}>Listen carefully before you recite</Text>
        </View>
        <Image source={require('../../../elementsApp/listening-removebg-preview.png')} style={styles.character} />
      </View>

      <View style={styles.arabicCard}>
        <View style={styles.cardBar} />
        <Text style={styles.arabic}>{ayah.arabic}</Text>
        {ayah.transliteration && (
          <Text style={styles.transliteration}>{ayah.transliteration}</Text>
        )}
        <Text style={styles.translation}>{ayah.translation}</Text>
      </View>

      <View style={styles.btnWrap}>
        <View style={styles.ringWrap}>
          {/* Circular progress bar — track + fill */}
          <Svg width={114} height={114} viewBox="0 0 114 114" style={styles.ringContainer}>
            {/* Track */}
            <Circle cx={57} cy={57} r={RADIUS_VAL} stroke={colors.primaryBg} strokeWidth={5} fill="none" />
            {/* Progress fill */}
            {playState === 'playing' && (
              <AnimatedCircle
                cx={57} cy={57} r={RADIUS_VAL}
                stroke={colors.primary}
                strokeWidth={5}
                fill="none"
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin="57,57"
              />
            )}
          </Svg>
          <Pressable
            onPress={() => { triggerHaptic(hapticsEnabled, 'light'); if (playState === 'playing') stopAudio(); else playAudio(); }}
            style={[styles.playBtn, SHADOW.glow(colors.primary)]}
          >
            <BtnIcon />
          </Pressable>
        </View>

        <Text style={styles.hint}>{hintText}</Text>
      </View>
    </View>
  );
}
