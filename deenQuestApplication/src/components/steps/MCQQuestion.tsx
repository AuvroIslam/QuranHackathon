import { Check, Lightbulb, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../theme';
import { MCQData } from '../../types';

interface Props {
  question: MCQData;
  selectedAnswer?: number;
  /** Server-validated verdict. When provided (correctIndex >= 0), takes precedence
   * over `question.correctIndex`. Used by lesson MCQ where the answer key is
   * stripped from the client bundle. */
  verdict?: { correctIndex: number } | null;
  onAnswer: (index: number) => void;
}

export default function MCQQuestion({ question, selectedAnswer, verdict, onAnswer }: Props) {
  const [answered, setAnswered] = useState(selectedAnswer !== undefined);
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const handleAnswer = (index: number) => {
    if (answered) return;
    setAnswered(true);
    onAnswer(index);
    Animated.spring(feedbackAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
  };

  // Effective correct index: prefer server verdict if present, else fall back
  // to the local question.correctIndex (mood flow). If both are unavailable
  // (e.g. verdict still loading for a lesson), use -1 so no option is marked.
  const effectiveCorrectIndex =
    verdict?.correctIndex !== undefined && verdict.correctIndex >= 0
      ? verdict.correctIndex
      : question.correctIndex >= 0
        ? question.correctIndex
        : -1;
  const verdictReady = effectiveCorrectIndex >= 0;
  const isCorrect = verdictReady && selectedAnswer === effectiveCorrectIndex;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.questionBlock}>
          <View style={styles.badge}>
            <Lightbulb size={12} color={COLORS.primary} />
            <Text style={styles.badgeText}>Reflection</Text>
          </View>
          <Text style={styles.question}>{question.question}</Text>
        </View>
        <Image source={require('../../../elementsApp/thinking-removebg-preview.png')} style={styles.character} />
      </View>

      <View style={styles.options}>
        {question.options.map((opt, i) => (
          <OptionButton
            key={i}
            text={opt}
            index={i}
            answered={answered && verdictReady}
            isCorrect={verdictReady && i === effectiveCorrectIndex}
            isSelected={i === selectedAnswer}
            onPress={() => handleAnswer(i)}
          />
        ))}
      </View>

      {answered && !verdictReady && (
        <Text style={styles.checking}>Checking your answer…</Text>
      )}

      {answered && verdictReady && (
        <Animated.View
          style={[
            styles.feedback,
            isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
            { transform: [{ scale: feedbackAnim }] },
          ]}
        >
          <Text style={styles.feedbackText}>
            {isCorrect ? 'Correct! Well done.' : `Right answer: "${question.options[effectiveCorrectIndex]}"`}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

function OptionButton({ text, index, answered, isCorrect, isSelected, onPress }: {
  text: string; index: number; answered: boolean; isCorrect: boolean; isSelected: boolean; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const bgColor = () => {
    if (!answered) return COLORS.card;
    if (isCorrect) return COLORS.primaryBg;
    if (isSelected) return `${COLORS.error}18`;
    return COLORS.card;
  };
  const borderColor = () => {
    if (!answered) return COLORS.cardBorder;
    if (isCorrect) return COLORS.primary;
    if (isSelected) return COLORS.error;
    return `${COLORS.cardBorder}66`;
  };
  const textColor = () => {
    if (!answered) return COLORS.text;
    if (isCorrect) return COLORS.primary;
    if (isSelected) return COLORS.error;
    return COLORS.textMuted;
  };

  const BulletContent = () => {
    if (answered && isCorrect) return <Check size={14} color={COLORS.primary} strokeWidth={3} />;
    if (answered && isSelected) return <X size={14} color={COLORS.white} strokeWidth={3} />;
    return <Text style={[styles.bulletLetter, { color: COLORS.primary }]}>{String.fromCharCode(65 + index)}</Text>;
  };

  const bulletBg = () => {
    if (answered && isCorrect) return COLORS.primaryBg;
    if (answered && isSelected) return COLORS.error;
    return COLORS.primaryBg;
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, !answered && SHADOW.card]}>
      <Pressable
        onPressIn={() => { if (answered) return; Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start(); }}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start()}
        onPress={onPress}
        style={[
          styles.option,
          { backgroundColor: bgColor(), borderColor: borderColor() },
          answered && !isCorrect && !isSelected && { opacity: 0.55 },
        ]}
      >
        <View style={[styles.bullet, { backgroundColor: bulletBg() }]}>
          <BulletContent />
        </View>
        <Text style={[styles.optionText, { color: textColor() }]}>{text}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  questionBlock: { flex: 1, gap: 10 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  badgeText: { color: COLORS.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  question: { color: COLORS.text, fontSize: 20, fontWeight: '700', lineHeight: 28, letterSpacing: -0.3 },
  character: { width: 90, height: 100, resizeMode: 'contain' },
  options: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    padding: 14,
  },
  bullet: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  bulletLetter: { fontSize: 13, fontWeight: '800' },
  optionText: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: '500' },
  feedback: {
    padding: 14, borderRadius: RADIUS.lg, borderWidth: 1,
  },
  feedbackCorrect: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primary + '55' },
  feedbackWrong: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.cardBorder },
  feedbackText: { color: COLORS.textSub, fontSize: 14, lineHeight: 20 },
  checking: { color: COLORS.textMuted, fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 4 },
});
