import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated, Dimensions, FlatList, Image, ImageBackground,
  Pressable, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { triggerHaptic } from '../lib/haptics';
import { DEPTH, RADIUS, SHADOW } from '../theme';

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
    sub: 'Read Arabic ayahs, listen to authentic recitation, and practise speaking with feedback.',
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
  const { colors, hapticsEnabled } = useTheme();
  const [index, setIndex] = useState(0);
  const [nextPressed, setNextPressed] = useState(false);
  const flatRef = useRef<FlatList>(null);
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
    triggerHaptic(hapticsEnabled, 'light');
    if (index < SLIDES.length - 1) {
      goTo(index + 1);
    } else {
      await finish();
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
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
      color: colors.text,
      fontSize: 32,
      fontWeight: '800',
      textAlign: 'center',
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    sub: {
      color: colors.textSub,
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
      backgroundColor: colors.primary,
      borderRadius: RADIUS.xl,
      paddingVertical: 17,
      alignItems: 'center',
      ...SHADOW.glow(colors.primary),
      ...DEPTH.button,
    },
    nextBtnText: { color: colors.white, fontSize: 17, fontWeight: '700' },
    skipBtn: { paddingVertical: 8 },
    skipText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  }), [colors]);

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
            const bg = dotAnim[i].interpolate({ inputRange: [0, 1], outputRange: [colors.cardBorder, colors.primary] });
            return <Animated.View key={i} style={[styles.dot, { width: w, backgroundColor: bg }]} />;
          })}
        </View>

        {/* Button */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.nextBtn, nextPressed && DEPTH.buttonPressed]}
            onPress={handleNext}
            onPressIn={() => setNextPressed(true)}
            onPressOut={() => setNextPressed(false)}
          >
            <Text style={styles.nextBtnText}>
              {index === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </Pressable>

          {index < SLIDES.length - 1 && (
            <Pressable onPress={() => { triggerHaptic(hapticsEnabled, 'light'); finish(); }} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
        </View>
      </ImageBackground>

    </SafeAreaView>
  );
}
