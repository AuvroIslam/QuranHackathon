import { Check, Clock, Hand, Users } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SHADOW } from '../../theme';

interface Props {
  onSelect: (action: string) => void;
  selected?: string;
}

export default function ActionSelection({ onSelect, selected }: Props) {
  const { colors } = useTheme();
  const [picked, setPicked] = useState<string | undefined>(selected);

  const ACTIONS = useMemo(() => [
    { id: 'dua', icon: <Hand size={24} color={colors.primary} />, label: 'Make dua', sub: 'Speak to Allah right now' },
    { id: 'patient', icon: <Clock size={24} color={colors.primary} />, label: 'Be patient', sub: 'Trust His timing today' },
    { id: 'help', icon: <Users size={24} color={colors.primary} />, label: 'Help someone', sub: 'One kind act before sleep' },
  ], [colors.primary]);

  const handlePick = (id: string) => {
    if (picked) return;
    setPicked(id);
    onSelect(id);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, padding: 16, gap: 20 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    textBlock: { flex: 1, gap: 6 },
    title: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, lineHeight: 32 },
    subtitle: { color: colors.textSub, fontSize: 14 },
    character: { width: 100, height: 110, resizeMode: 'contain' },
    actions: { gap: 12 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.card,
      borderRadius: RADIUS.xl,
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
      padding: 16,
    },
    cardSelected: { backgroundColor: colors.primaryBg, borderColor: colors.primary },
    cardDimmed: { borderColor: colors.cardBorder, backgroundColor: colors.card },
    dimmed: { opacity: 0.55 },
    iconWrap: {
      width: 48, height: 48, borderRadius: RADIUS.md,
      backgroundColor: colors.primaryBg,
      alignItems: 'center', justifyContent: 'center',
    },
    iconWrapSelected: { backgroundColor: colors.primary },
    cardText: { flex: 1, gap: 3 },
    cardLabel: { color: colors.text, fontSize: 17, fontWeight: '700' },
    cardLabelSelected: { color: colors.primaryDark },
    cardLabelDimmed: { color: colors.textMuted },
    cardSub: { color: colors.textSub, fontSize: 13 },
    cardSubDimmed: { color: colors.textMuted },
    check: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
      ...SHADOW.glow(colors.primary),
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>What will you{'\n'}do today?</Text>
          <Text style={styles.subtitle}>Let this ayah move you to act.</Text>
        </View>
        <Image source={require('../../../elementsApp/dua_praying-removebg-preview.png')} style={styles.character} />
      </View>

      <View style={styles.actions}>
        {ACTIONS.map((a) => (
          <ActionCard
            key={a.id}
            action={a}
            selected={picked === a.id}
            dimmed={!!picked && picked !== a.id}
            onPress={() => handlePick(a.id)}
            styles={styles}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
}

function ActionCard({ action, selected, dimmed, onPress, styles, colors }: {
  action: { id: string; icon: React.ReactNode; label: string; sub: string };
  selected: boolean; dimmed: boolean; onPress: () => void;
  styles: ReturnType<typeof StyleSheet.create>;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (selected) Animated.spring(checkAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
  }, [selected]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={() => { if (dimmed) return; Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 30 }).start(); }}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start()}
        onPress={onPress}
        style={[styles.card, selected && styles.cardSelected, dimmed && styles.cardDimmed, !dimmed && SHADOW.card]}
      >
        <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
          {action.icon}
        </View>
        <View style={styles.cardText}>
          <Text style={[styles.cardLabel, selected && styles.cardLabelSelected, dimmed && styles.cardLabelDimmed]}>{action.label}</Text>
          <Text style={[styles.cardSub, dimmed && styles.cardSubDimmed]}>{action.sub}</Text>
        </View>
        {selected && (
          <Animated.View style={[styles.check, { transform: [{ scale: checkAnim }] }]}>
            <Check size={14} color={colors.white} strokeWidth={3} />
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}
