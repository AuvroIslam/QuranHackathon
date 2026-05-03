import { Check, Clock, Hand, Users } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../theme';

const ACTIONS = [
  { id: 'dua', icon: <Hand size={24} color={COLORS.primary} />, label: 'Make dua', sub: 'Speak to Allah right now' },
  { id: 'patient', icon: <Clock size={24} color={COLORS.primary} />, label: 'Be patient', sub: 'Trust His timing today' },
  { id: 'help', icon: <Users size={24} color={COLORS.primary} />, label: 'Help someone', sub: 'One kind act before sleep' },
];

interface Props {
  onSelect: (action: string) => void;
  selected?: string;
}

export default function ActionSelection({ onSelect, selected }: Props) {
  const [picked, setPicked] = useState<string | undefined>(selected);

  const handlePick = (id: string) => {
    if (picked) return;
    setPicked(id);
    onSelect(id);
  };

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
          />
        ))}
      </View>
    </View>
  );
}

function ActionCard({ action, selected, dimmed, onPress }: {
  action: (typeof ACTIONS)[0]; selected: boolean; dimmed: boolean; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (selected) Animated.spring(checkAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
  }, [selected]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, dimmed && styles.dimmed]}>
      <Pressable
        onPressIn={() => { if (dimmed) return; Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 30 }).start(); }}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start()}
        onPress={onPress}
        style={[styles.card, selected && styles.cardSelected, SHADOW.card]}
      >
        <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
          {action.icon}
        </View>
        <View style={styles.cardText}>
          <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>{action.label}</Text>
          <Text style={styles.cardSub}>{action.sub}</Text>
        </View>
        {selected && (
          <Animated.View style={[styles.check, { transform: [{ scale: checkAnim }] }]}>
            <Check size={14} color={COLORS.white} strokeWidth={3} />
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textBlock: { flex: 1, gap: 6 },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, lineHeight: 32 },
  subtitle: { color: COLORS.textSub, fontSize: 14 },
  character: { width: 100, height: 110, resizeMode: 'contain' },
  actions: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    padding: 16,
  },
  cardSelected: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primary },
  dimmed: { opacity: 0.35 },
  iconWrap: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapSelected: { backgroundColor: COLORS.primary },
  cardText: { flex: 1, gap: 3 },
  cardLabel: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  cardLabelSelected: { color: COLORS.primaryDark },
  cardSub: { color: COLORS.textSub, fontSize: 13 },
  check: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.glow(COLORS.primary),
  },
});
