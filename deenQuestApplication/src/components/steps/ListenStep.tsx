import { Audio } from 'expo-av';
import { Check, Loader, Pause, Play, RotateCcw } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../theme';
import { Ayah } from '../../types';

interface Props {
  ayah: Ayah;
}

type PlayState = 'idle' | 'loading' | 'playing' | 'done';

export default function ListenStep({ ayah }: Props) {
  const [playState, setPlayState] = useState<PlayState>('idle');
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }).start();
  };

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
        if (status.isPlaying) { setPlayState('playing'); startPulse(); }
        if (status.didJustFinish) { setPlayState('done'); stopPulse(); sound.unloadAsync(); soundRef.current = null; }
      });
      await sound.playAsync();
    } catch {
      setPlayState('idle');
      stopPulse();
    }
  };

  const stopAudio = async () => {
    stopPulse();
    await soundRef.current?.stopAsync().catch(() => {});
    await soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    setPlayState('idle');
  };

  const btnColor = playState === 'done' ? COLORS.success : COLORS.primary;

  const BtnIcon = () => {
    if (playState === 'loading') return <Loader size={34} color={COLORS.white} />;
    if (playState === 'playing') return <Pause size={34} color={COLORS.white} fill={COLORS.white} />;
    if (playState === 'done') return <Check size={34} color={COLORS.white} strokeWidth={3} />;
    return <Play size={34} color={COLORS.white} fill={COLORS.white} />;
  };

  const hintText = {
    idle: 'Tap to play the recitation',
    loading: 'Loading…',
    playing: 'Playing — listen closely',
    done: 'Done! Continue when ready',
  }[playState];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Listen to the Ayah</Text>
      <Text style={styles.sub}>Listen carefully before you recite</Text>

      <View style={styles.cardRow}>
        <View style={styles.arabicCard}>
          <View style={styles.cardBar} />
          <Text style={styles.arabic}>{ayah.arabic}</Text>
          <Text style={styles.translation}>{ayah.translation}</Text>
        </View>
        <Image source={require('../../../elementsApp/listening-removebg-preview.png')} style={styles.character} />
      </View>

      <View style={styles.btnWrap}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable
            onPress={playState === 'playing' ? stopAudio : playAudio}
            style={[styles.playBtn, { backgroundColor: btnColor }, SHADOW.glow(btnColor)]}
          >
            <BtnIcon />
          </Pressable>
        </Animated.View>

        <Text style={styles.hint}>{hintText}</Text>

        {playState === 'done' && (
          <Pressable onPress={playAudio} style={styles.replayBtn}>
            <RotateCcw size={15} color={COLORS.primary} />
            <Text style={styles.replayText}>Replay</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  sub: { color: COLORS.textSub, fontSize: 14, marginTop: -8 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  arabicCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.cardBorder, overflow: 'hidden', ...SHADOW.card,
  },
  cardBar: { height: 5, backgroundColor: COLORS.primary },
  arabic: {
    color: COLORS.text, fontSize: 24, textAlign: 'right',
    lineHeight: 44, padding: 16, paddingBottom: 8, writingDirection: 'rtl',
  },
  translation: {
    color: COLORS.textSub, fontSize: 12, textAlign: 'center',
    fontStyle: 'italic', paddingHorizontal: 14, paddingBottom: 14,
  },
  character: { width: 100, height: 110, resizeMode: 'contain' },
  btnWrap: { alignItems: 'center', gap: 12, marginTop: 8 },
  playBtn: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
  },
  hint: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
  replayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 22, paddingVertical: 10,
    borderRadius: RADIUS.full, borderWidth: 1.5,
    borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg,
  },
  replayText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
});
