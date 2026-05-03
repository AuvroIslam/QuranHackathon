import { Flame, Star, Zap } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '../theme';

interface Props {
  streak: number;
  xp: number;
  stars: number;
}

export default function StreakHeader({ streak, xp, stars }: Props) {
  return (
    <View style={styles.row}>
      <StatPill icon={<Flame size={16} color="#FF6B35" fill="#FF6B35" />} value={streak} color="#FF6B35" bg="#FFF0EB" />
      <StatPill icon={<Star size={16} color={COLORS.accent} fill={COLORS.accent} />} value={stars} color={COLORS.accentDark} bg="#FFFBEB" />
      <StatPill icon={<Zap size={16} color={COLORS.primary} fill={COLORS.primary} />} value={xp} color={COLORS.primaryDark} bg={COLORS.primaryBg} />
    </View>
  );
}

function StatPill({ icon, value, color, bg }: { icon: React.ReactNode; value: number; color: string; bg: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {icon}
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  pillValue: {
    fontSize: 15,
    fontWeight: '800',
  },
});
