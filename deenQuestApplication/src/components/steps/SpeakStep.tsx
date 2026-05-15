// FULLY IMPLEMENTED: Arabic recitation practice step used inside the session flow (useJourney hook).
// Records user audio via expo-av, sends to /api/speech-check (OpenAI Whisper), and shows
// word-by-word accuracy feedback with green/red chips. This is NOT a stub.
import { Audio } from 'expo-av';
import { Loader, Mic, Pause, Play, RotateCw, Square } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { checkSpeech } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { DEPTH, RADIUS, SHADOW } from '../../theme';
import { Ayah, SpeechResult, WordResult } from '../../types';

type SpeakState = 'idle' | 'recording' | 'checking' | 'correct' | 'wrong' | 'done';

function scoreLabel(score: number, correct: boolean): string {
  const pct = Math.round(score * 100);
  if (correct) return pct === 100 ? 'Perfect! 🌟' : 'Well done!';
  if (pct < 25) return 'Keep going!';
  if (pct < 50) return 'Getting there!';
  if (pct < 75) return 'Almost there!';
  return 'So close!';
}

interface Props {
  ayah: Ayah;
  attempts: number;
  onResult: (result: SpeechResult) => void;
  onSkip: () => void;
  passThreshold?: number;
  showTransliteration?: boolean;
}

export default function SpeakStep({
  ayah,
  attempts,
  onResult,
  onSkip,
  passThreshold = 0.6,
  showTransliteration = true,
}: Props) {
  const { colors } = useTheme();
  const [speakState, setSpeakState] = useState<SpeakState>('idle');
  const [result, setResult] = useState<SpeechResult | null>(null);
  const [playState, setPlayState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const pctColor = (score: number): string => {
    const pct = Math.round(score * 100);
    if (pct < 25) return colors.error;
    if (pct < 50) return colors.accent;
    return colors.accent;
  };

  useEffect(() => {
    return () => {
      countdownRef.current && clearTimeout(countdownRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const animateResult = (correct: boolean) => {
    resultAnim.setValue(0);
    Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
    if (!correct) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]).start();
    }
  };

  const playAyah = async () => {
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      setPlayState('loading');
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: ayah.audioUrl }, { shouldPlay: false });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.isPlaying) setPlayState('playing');
        if (status.didJustFinish) {
          setPlayState('idle');
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
      await sound.playAsync();
    } catch {
      setPlayState('idle');
    }
  };

  const stopAudio = async () => {
    await soundRef.current?.stopAsync().catch(() => {});
    await soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    setPlayState('idle');
  };

  const startRecording = async () => {
    try {
      if (soundRef.current) { await soundRef.current.stopAsync().catch(() => {}); await soundRef.current.unloadAsync().catch(() => {}); soundRef.current = null; setPlayState('idle'); }
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') { alert('Microphone access is required.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setSpeakState('recording');
      startPulse();
      countdownRef.current = setTimeout(stopRecording, 5000);
    } catch { setSpeakState('idle'); }
  };

  const stopRecording = async () => {
    countdownRef.current && clearTimeout(countdownRef.current);
    stopPulse();
    const recording = recordingRef.current;
    if (!recording) return;
    setSpeakState('checking');
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      recordingRef.current = null;
      if (!uri) throw new Error('No URI');
      const raw = await checkSpeech(uri, ayah.arabic);
      // Apply local threshold override
      const isCorrect = raw.score >= passThreshold;
      const speechResult: SpeechResult = { ...raw, correct: isCorrect };
      setResult(speechResult);
      onResult(speechResult);
      if (isCorrect) {
        setSpeakState('correct');
        animateResult(true);
      } else if (attempts === 0) {
        setSpeakState('wrong');
        animateResult(false);
      } else {
        setSpeakState('done');
        animateResult(false);
      }
    } catch { recordingRef.current = null; setSpeakState('idle'); }
  };

  const handleMicPress = () => {
    if (speakState === 'idle' || speakState === 'wrong') startRecording();
    else if (speakState === 'recording') stopRecording();
  };

  const characterImg = () => {
    if (speakState === 'correct') return require('../../../elementsApp/thumbsUp_Encouraging-removebg-preview.png');
    if (speakState === 'wrong' || speakState === 'done') return require('../../../elementsApp/sad_retry-removebg-preview.png');
    return require('../../../elementsApp/reciting-removebg-preview.png');
  };

  const micBtnColor = colors.primary;

  const MicBtnIcon = () => {
    if (speakState === 'checking') return <Mic size={36} color={colors.white} />;
    if (speakState === 'recording') return <Square size={34} color={colors.white} fill={colors.white} />;
    if (speakState === 'wrong') return <RotateCw size={34} color={colors.white} />;
    return <Mic size={36} color={colors.white} />;
  };

  // Show word chips before result (greyed) or after result (coloured)
  const arabicWords = ayah.arabic.split(' ').reverse(); // RTL display

  const styles = useMemo(() => StyleSheet.create({
    container: { padding: 16, paddingTop: 32, gap: 16, paddingBottom: 40 },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    titleBlock: { flex: 1, gap: 4 },
    title: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
    sub: { color: colors.textSub, fontSize: 14 },
    arabicCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.xl,
      borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden', ...SHADOW.card,
    },
    cardBar: { height: 5, backgroundColor: colors.primary },
    wordRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6, padding: 14, paddingTop: 6, paddingBottom: 6 },
    wordChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.md, borderWidth: 1 },
    wordChipPending: { backgroundColor: colors.surfaceDark, borderColor: colors.cardBorder },
    wordChipCorrect: { backgroundColor: `${colors.success}22`, borderColor: `${colors.success}66` },
    wordChipWrong: { backgroundColor: `${colors.error}22`, borderColor: `${colors.error}66` },
    wordText: { fontSize: 20, lineHeight: 36 },
    wordTextPending: { color: colors.textMuted },
    wordTextCorrect: { color: colors.success },
    wordTextWrong: { color: colors.error },
    transliteration: {
      color: colors.textMuted, fontSize: 11, textAlign: 'center',
      fontStyle: 'italic', paddingHorizontal: 12, paddingBottom: 4,
    },
    translation: { color: colors.textSub, fontSize: 12, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 12, paddingBottom: 12 },
    cardTopRow: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 2, flexDirection: 'row', alignItems: 'center', gap: 10 },
    cardScoreLabel: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
    cardPlayBtn: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: colors.primaryBg,
      borderWidth: 1.5, borderColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    cardPlayBtnActive: { backgroundColor: colors.primary },
    character: { width: 90, height: 100, resizeMode: 'contain' },
    scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    scoreTrack: { flex: 1, height: 8, backgroundColor: colors.surfaceDark, borderRadius: 4, overflow: 'hidden' },
    scoreFill: { height: '100%', borderRadius: 4 },
    scorePct: { color: colors.textSub, fontSize: 13, fontWeight: '700', minWidth: 36, textAlign: 'right' },
    micArea: { alignItems: 'center', gap: 12 },
    hearBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 20, paddingVertical: 10,
      borderRadius: RADIUS.full, borderWidth: 1.5,
      borderColor: colors.primary, backgroundColor: colors.primaryBg,
    },
    hearBtnActive: { backgroundColor: `${colors.primary}18` },
    hearBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
    micBtn: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
    micHint: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingTop: 10 },
    dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
    continueWrap: { paddingTop: 8 },
    continueBtn: { backgroundColor: colors.primary, borderRadius: RADIUS.xl, paddingVertical: 17, alignItems: 'center' },
    continueBtnDisabled: { opacity: 0.38 },
    continueBtnText: { color: colors.white, fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
    continueBtnTextDisabled: {},
  }), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Now, say it yourself</Text>
          <Text style={styles.sub}>Tap the mic and repeat the ayah</Text>
        </View>
        <Image source={characterImg()} style={styles.character} />
      </View>

      <View style={styles.arabicCard}>
          <View style={styles.cardBar} />
          <View style={styles.cardTopRow}>
            <Pressable
              onPress={playState === 'playing' ? stopAudio : playAyah}
              disabled={speakState === 'recording' || speakState === 'checking'}
              style={[styles.cardPlayBtn, playState === 'playing' && styles.cardPlayBtnActive]}
            >
              {playState === 'loading' ? (
                <Loader size={12} color={colors.primary} />
              ) : playState === 'playing' ? (
                <Pause size={12} color={colors.white} fill={colors.white} />
              ) : (
                <Play size={12} color={colors.primary} fill={colors.primary} />
              )}
            </Pressable>
            {result && speakState !== 'checking' && (
              <Text style={[styles.cardScoreLabel, { color: result.correct ? colors.success : pctColor(result.score) }]}>
                {scoreLabel(result.score, result.correct)}
              </Text>
            )}
          </View>
          {result?.words && result.words.length > 0 ? (
            <View style={styles.wordRow}>
              {[...result.words].reverse().map((w, i) => <WordChip key={i} wordResult={w} revealed styles={styles} />)}
            </View>
          ) : (
            <>
              <View style={styles.wordRow}>
                {arabicWords.map((w, i) => <WordChip key={i} wordResult={{ word: w, correct: false }} revealed={false} styles={styles} />)}
              </View>
            </>
          )}
          {showTransliteration && ayah.transliteration && (
            <Text style={styles.transliteration}>{ayah.transliteration}</Text>
          )}
          <Text style={styles.translation}>{ayah.translation}</Text>
        </View>

      {result && (
        <Animated.View style={[styles.scoreRow, { opacity: resultAnim }]}>
          <View style={styles.scoreTrack}>
            <View
              style={[
                styles.scoreFill,
                { width: `${Math.round(result.score * 100)}%`, backgroundColor: result.correct ? colors.success : colors.accent },
              ]}
            />
          </View>
          <Text style={styles.scorePct}>{Math.round(result.score * 100)}%</Text>
        </Animated.View>
      )}

      {speakState !== 'correct' && speakState !== 'done' && (
        <View style={[styles.micArea, !result && { marginTop: 44 }]}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              onPress={handleMicPress}
              disabled={speakState === 'checking'}
              style={[styles.micBtn, { backgroundColor: micBtnColor }, SHADOW.glow(micBtnColor)]}
            >
              <MicBtnIcon />
            </Pressable>
          </Animated.View>
          <Text style={styles.micHint}>
            {speakState === 'idle' && 'Tap to start reciting'}
            {speakState === 'recording' && 'Listening… tap to stop'}
            {speakState === 'checking' && 'Checking your recitation…'}
            {speakState === 'wrong' && 'Tap to try again'}
          </Text>
          {speakState === 'recording' && <RecordingDots styles={styles} />}
        </View>
      )}

      <View style={styles.continueWrap}>
        <Pressable
          onPress={onSkip}
          disabled={speakState !== 'wrong' && speakState !== 'done' && speakState !== 'correct'}
          style={[
            styles.continueBtn,
            (speakState === 'wrong' || speakState === 'done' || speakState === 'correct') ? DEPTH.button : styles.continueBtnDisabled,
          ]}
        >
          <Text style={[styles.continueBtnText, (speakState !== 'wrong' && speakState !== 'done' && speakState !== 'correct') && styles.continueBtnTextDisabled]}>
            {speakState === 'done' && result && result.score < 0.5 ? 'Skip' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function WordChip({ wordResult, revealed, styles }: { wordResult: WordResult; revealed: boolean; styles: ReturnType<typeof StyleSheet.create> }) {
  const scaleAnim = useRef(new Animated.Value(revealed ? 0 : 1)).current;
  useEffect(() => {
    if (revealed) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
    }
  }, [revealed]);
  if (!revealed) {
    return (
      <View style={[styles.wordChip, styles.wordChipPending]}>
        <Text style={[styles.wordText, styles.wordTextPending]}>{wordResult.word}</Text>
      </View>
    );
  }
  return (
    <Animated.View
      style={[styles.wordChip, wordResult.correct ? styles.wordChipCorrect : styles.wordChipWrong, { transform: [{ scale: scaleAnim }] }]}
    >
      <Text style={[styles.wordText, wordResult.correct ? styles.wordTextCorrect : styles.wordTextWrong]}>
        {wordResult.word}
      </Text>
    </Animated.View>
  );
}

function RecordingDots({ styles }: { styles: ReturnType<typeof StyleSheet.create> }) {
  return (
    <View style={styles.dotsRow}>
      {[0, 150, 300].map((delay) => <Dot key={delay} delay={delay} styles={styles} />)}
    </View>
  );
}

function Dot({ delay, styles }: { delay: number; styles: ReturnType<typeof StyleSheet.create> }) {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    }, delay);
  }, []);
  return <Animated.View style={[styles.dot, { opacity: anim }]} />;
}
