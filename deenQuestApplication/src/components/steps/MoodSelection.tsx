import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { DEPTH, RADIUS, SHADOW } from '../../theme';
import { Mood } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 8;
const H_PADDING = 14;
const CARD_SIZE = (SCREEN_WIDTH - H_PADDING * 2 - CARD_GAP * 2) / 3;

const MOODS: { id: Mood; label: string; image: any }[] = [
  { id: 'stressed',     label: 'Stressed',     image: require('../../../elementsApp/mood/stressed.png') },
  { id: 'sad',          label: 'Sad',          image: require('../../../elementsApp/mood/sad.png') },
  { id: 'grateful',     label: 'Grateful',     image: require('../../../elementsApp/mood/grateful.png') },
  { id: 'lost',         label: 'Lost',         image: require('../../../elementsApp/mood/lost.png') },
  { id: 'indecisive',   label: 'Indecisive',   image: require('../../../elementsApp/mood/indecisive.png') },
  { id: 'overthinking', label: 'Overthinking', image: require('../../../elementsApp/mood/overthinking.png') },
  { id: 'justHere',    label: 'Just Here',    image: require('../../../elementsApp/mood/justHere.png') },
];

interface Props {
  onSelect: (mood: Mood, customText?: string) => void;
  onCustomText: (text: string) => void;
  loading?: boolean;
}

export default function MoodSelection({ onSelect, onCustomText, loading = false }: Props) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<Mood | null>(null);
  const [situation, setSituation] = useState('');
  const [findPressed, setFindPressed] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleMoodPress = (mood: Mood) => {
    if (loading) return;
    setSelected(mood);
    onSelect(mood);
  };

  const handleCustomSubmit = () => {
    if (!situation.trim()) return;
    onCustomText(situation.trim());
  };

  const rows: (typeof MOODS)[] = [];
  for (let i = 0; i < MOODS.length; i += 3) {
    rows.push(MOODS.slice(i, i + 3));
  }

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 12, flexGrow: 1 },

    hero: {
      marginHorizontal: H_PADDING,
      marginTop: 8,
      marginBottom: 10,
      borderRadius: RADIUS.xl,
      overflow: 'hidden',
    },
    heroBg: { borderRadius: RADIUS.xl },

    heroContent: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 14,
      minHeight: 100,
    },
    heroChar: { width: 90, height: 110, resizeMode: 'contain' },
    heroText: { flex: 1, paddingLeft: 10, paddingBottom: 6 },
    bismillah: {
      color: colors.primaryDark,
      fontSize: 13,
      fontStyle: 'italic',
      marginBottom: 3,
      opacity: 0.85,
    },
    heroTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      lineHeight: 26,
      letterSpacing: -0.3,
    },
    heroSub: { color: colors.textSub, fontSize: 12, marginTop: 3 },

    grid: { paddingHorizontal: H_PADDING, gap: CARD_GAP },
    row: { flexDirection: 'row', gap: CARD_GAP },
    rowCentered: { justifyContent: 'center' },

    card: {
      borderRadius: RADIUS.lg,
      borderWidth: 2,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'flex-end',
      backgroundColor: colors.primaryBg,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardSelected: {
      borderColor: colors.primary,
      borderWidth: 2.5,
      ...SHADOW.glow(colors.primary),
    },
    labelWrap: {
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.85)',
      paddingVertical: 4,
      alignItems: 'center',
    },
    labelWrapSelected: { backgroundColor: colors.white },
    cardLabel: { color: colors.primary, fontSize: 10, fontWeight: '700' },

    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: H_PADDING,
      marginTop: 10,
      marginBottom: 12,
      gap: 8,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.cardBorder },
    dividerText: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },

    textBoxWrap: {
      marginHorizontal: H_PADDING,
      backgroundColor: colors.card,
      borderRadius: RADIUS.xl,
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
      ...SHADOW.card,
    },
    textInput: {
      color: colors.text,
      fontSize: 14,
      minHeight: 40,
    },
    findBtn: {
      marginHorizontal: H_PADDING,
      marginTop: 12,
      backgroundColor: colors.primary,
      borderRadius: RADIUS.xl,
      paddingVertical: 17,
      alignItems: 'center',
    },
    findBtnDisabled: {
      opacity: 0.38,
    },
    findBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  }), [colors]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 60}
    >
    {loading && (
      <View style={styles.loadingOverlay} pointerEvents="none">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )}
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Hero banner */}
      <ImageBackground
        source={require('../../../elementsApp/cardBg1.png')}
        style={styles.hero}
        imageStyle={styles.heroBg}
      >
        <View style={styles.heroContent}>
          <Image source={require('../../../elementsApp/waving_onboarding-removebg-preview.png')} style={styles.heroChar} />
          <View style={styles.heroText}>
            <Text style={styles.bismillah}>بِسْمِ اللَّهِ</Text>
            <Text style={styles.heroTitle}>How are you{'\n'}feeling today?</Text>
            <Text style={styles.heroSub}>Allah has a message for you</Text>
          </View>
        </View>
      </ImageBackground>

      {/* Mood grid */}
      <View style={styles.grid}>
        {rows.map((row, ri) => (
          <View key={ri} style={[styles.row, row.length < 3 && styles.rowCentered]}>
            {row.map((mood) => (
              <MoodCard
                key={mood.id}
                mood={mood}
                selected={selected === mood.id}
                onPress={() => handleMoodPress(mood.id)}
                styles={styles}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or describe your situation</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Custom text box */}
      <View style={styles.textBoxWrap}>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. I feel empty and lost…"
          placeholderTextColor={colors.textMuted}
          value={situation}
          onChangeText={setSituation}
          returnKeyType="done"
          onSubmitEditing={handleCustomSubmit}
          multiline={false}
          onFocus={() => {
            setTimeout(() => {
              scrollRef.current?.scrollToEnd({ animated: true });
            }, 300);
          }}
        />
      </View>

      {/* Find Ayah — 3D button */}
      <Pressable
        onPressIn={() => { if (situation.trim()) setFindPressed(true); }}
        onPressOut={() => setFindPressed(false)}
        onPress={handleCustomSubmit}
        disabled={!situation.trim()}
        style={[
          styles.findBtn,
          situation.trim()
            ? [DEPTH.button, findPressed && DEPTH.buttonPressed]
            : styles.findBtnDisabled,
        ]}
      >
        <Text style={styles.findBtnText}>Find Ayah</Text>
      </Pressable>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MoodCard({
  mood, selected, onPress, styles,
}: {
  mood: (typeof MOODS)[0]; selected: boolean; onPress: () => void;
  styles: ReturnType<typeof StyleSheet.create>;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 30 }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start()
        }
        onPress={onPress}
        style={[styles.card, selected && styles.cardSelected, { width: CARD_SIZE, height: CARD_SIZE }]}
      >
        <Image source={mood.image} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', resizeMode: 'cover' }} />
        <View style={[styles.labelWrap, selected && styles.labelWrapSelected]}>
          <Text style={styles.cardLabel} numberOfLines={1}>{mood.label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
