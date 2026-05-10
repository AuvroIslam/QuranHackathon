import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, FlatList, Image, ImageBackground,
  Linking, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { saveQFTokens } from '../lib/firestore';
import { COLORS, RADIUS, SHADOW } from '../theme';

const { width } = Dimensions.get('window');
export const ONBOARDING_KEY = '@deenquest_onboarded';

const SLIDES = [
  {
    id: '1',
    title: 'Begin Your\nQuran Journey',
    sub: 'Daily 3-minute lessons personalised to your mood and spiritual state.',
    image: require('../../elementsApp/waving_onboarding-removebg-preview.png'),
  },
  {
    id: '2',
    title: 'Learn, Listen\n& Recite',
    sub: 'Read Arabic ayahs, listen to authentic recitation, and practise speaking with AI feedback.',
    image: require('../../elementsApp/reciting-removebg-preview.png'),
  },
  {
    id: '3',
    title: 'Grow Together\nas an Ummah',
    sub: 'Share reflections, ask questions, and explore dawah cards with the community.',
    image: require('../../elementsApp/reading-removebg-preview.png'),
  },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { uid } = useAuth();
  const [index, setIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const [showQFConnect, setShowQFConnect] = useState(false);
  const [waitingForQF, setWaitingForQF] = useState(false);
  const [qfSuccess, setQFSuccess] = useState(false);
  // First dot starts active (1), rest inactive (0)
  const dotAnim = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  const animateDots = (i: number) => {
    dotAnim.forEach((a, idx) =>
      Animated.spring(a, { toValue: idx === i ? 1 : 0, useNativeDriver: false, speed: 30 }).start()
    );
  };

  const goTo = (i: number) => {
    flatRef.current?.scrollToIndex({ index: i, animated: true });
    setIndex(i);
    animateDots(i);
  };

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onDone();
  };

  const handleNext = async () => {
    if (index < SLIDES.length - 1) {
      goTo(index + 1);
    } else {
      setShowQFConnect(true);
    }
  };

  const handleQFConnect = async () => {
    if (!uid) { await finish(); return; }
    setWaitingForQF(true);
    const url = `https://quran-hackathon-omega.vercel.app/auth/qf-start?from=mobile&uid=${encodeURIComponent(uid)}`;
    Linking.openURL(url).catch(() => setWaitingForQF(false));
  };

  useEffect(() => {
    const handleDeepLink = async ({ url }: { url: string }) => {
      if (!url.startsWith('deenquest://qf-connected')) return;
      const queryString = url.split('?')[1] ?? '';
      const params: Record<string, string> = {};
      queryString.split('&').forEach((pair) => {
        const idx = pair.indexOf('=');
        if (idx > -1) params[pair.slice(0, idx)] = decodeURIComponent(pair.slice(idx + 1));
      });
      const at = params.at ?? '';
      const rt = params.rt ?? '';
      const ea = parseInt(params.ea ?? '0', 10);
      if (at && uid) {
        setQFSuccess(true);
        setWaitingForQF(false);
        saveQFTokens(uid, at, rt, ea).catch(() => {});
        setTimeout(() => finish(), 1500);
      } else {
        await finish();
      }
    };

    Linking.getInitialURL().then((url) => { if (url) handleDeepLink({ url }); });
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, [uid]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ImageBackground
        source={require('../../elementsApp/mainBg.png')}
        style={styles.bg}
        imageStyle={{ opacity: 0.08 }}
      >
        <FlatList
          ref={flatRef}
          data={SLIDES}
          keyExtractor={(s) => s.id}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Image source={item.image} style={styles.character} />
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.sub}>{item.sub}</Text>
            </View>
          )}
        />

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const w = dotAnim[i].interpolate({ inputRange: [0, 1], outputRange: [8, 24] });
            const bg = dotAnim[i].interpolate({ inputRange: [0, 1], outputRange: [COLORS.cardBorder, COLORS.primary] });
            return <Animated.View key={i} style={[styles.dot, { width: w, backgroundColor: bg }]} />;
          })}
        </View>

        {/* Button */}
        <View style={styles.footer}>
          <Pressable style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {index === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </Pressable>

          {index < SLIDES.length - 1 && (
            <Pressable onPress={finish} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
        </View>
      </ImageBackground>

      {/* Quran.com connect overlay */}
      {showQFConnect && (
        <View style={qfStyles.overlay}>
          {qfSuccess ? (
            <View style={qfStyles.card}>
              <View style={qfStyles.successIcon}>
                <Text style={qfStyles.successEmoji}>✓</Text>
              </View>
              <Text style={qfStyles.cardTitle}>Connected!</Text>
              <Text style={qfStyles.cardSub}>
                Your Quran.com account is linked. Loading DeenQuest…
              </Text>
            </View>
          ) : waitingForQF ? (
            <View style={qfStyles.card}>
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginBottom: 20 }} />
              <Text style={qfStyles.cardTitle}>Waiting for connection…</Text>
              <Text style={qfStyles.cardSub}>
                Complete sign-in on Quran.com, then return here automatically.
              </Text>
              <Pressable style={qfStyles.skipBtn} onPress={finish}>
                <Text style={qfStyles.skipText}>Skip for now</Text>
              </Pressable>
            </View>
          ) : (
            <View style={qfStyles.card}>
              <View style={qfStyles.logoRow}>
                <Image
                  source={require('../../elementsApp/quran.comLogo.png')}
                  style={qfStyles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={qfStyles.cardTitle}>Connect your{'\n'}Quran.com account</Text>
              <Text style={qfStyles.cardSub}>
                Sync your bookmarks, reading goals, and streaks across devices.
              </Text>
              <View style={qfStyles.benefits}>
                {['Sync bookmarks & collections', 'Track reading streaks', 'Cross-device progress'].map((b) => (
                  <View key={b} style={qfStyles.benefitRow}>
                    <Text style={qfStyles.benefitDot}>●</Text>
                    <Text style={qfStyles.benefitText}>{b}</Text>
                  </View>
                ))}
              </View>
              <Pressable style={qfStyles.connectBtn} onPress={handleQFConnect}>
                <Text style={qfStyles.connectBtnText}>Connect Quran.com</Text>
              </Pressable>
              <Pressable style={qfStyles.skipBtn} onPress={finish}>
                <Text style={qfStyles.skipText}>Skip for now</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  bg: { flex: 1 },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  character: { width: 220, height: 220, resizeMode: 'contain' },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  sub: {
    color: COLORS.textSub,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 24,
  },
  dot: { height: 8, borderRadius: RADIUS.full },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  nextBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 17,
    alignItems: 'center',
    ...SHADOW.glow(COLORS.primary),
  },
  nextBtnText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  skipBtn: { paddingVertical: 8 },
  skipText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
});

const qfStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,15,30,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  logoRow: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 4,
    alignItems: 'center',
  },
  logo: { width: 140, height: 40 },
  cardTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 30,
  },
  cardSub: {
    color: COLORS.textSub,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefits: {
    width: '100%',
    gap: 8,
    marginVertical: 4,
  },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitDot: { color: COLORS.primary, fontSize: 8 },
  benefitText: { color: COLORS.textSub, fontSize: 14, flex: 1 },
  connectBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  connectBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn: { paddingVertical: 8 },
  skipText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successEmoji: { color: COLORS.primary, fontSize: 32, fontWeight: '800' },
});

