import { Award, BookOpen, Clock, Flame, LogOut, Star, Target, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, ImageBackground, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { getUserProfile, updateUserPlan } from '../lib/firestore';
import { COLORS, DEPTH, RADIUS, SHADOW } from '../theme';
import { TimePerDay, UserGoal, UserLevel } from '../types';
import { signOut } from 'firebase/auth';

interface Profile {
  streak: number;
  xp: number;
  tasksCompleted?: number;
  goal?: UserGoal | null;
  level?: UserLevel | null;
  timePerDay?: TimePerDay | null;
}

function getLevel(xp: number) {
  if (xp < 100) return { level: 1, title: 'Seeker', next: 100 };
  if (xp < 300) return { level: 2, title: 'Student', next: 300 };
  if (xp < 600) return { level: 3, title: 'Reader', next: 600 };
  if (xp < 1000) return { level: 4, title: 'Reciter', next: 1000 };
  if (xp < 1500) return { level: 5, title: 'Hafidh', next: 1500 };
  return { level: 6, title: 'Scholar', next: Infinity };
}

const BADGES = [
  { id: 'first_lesson', label: 'First Lesson', icon: BookOpen, color: '#7C3AED', xpRequired: 10 },
  { id: 'streak_3', label: '3-Day Streak', icon: Flame, color: '#FF6B35', streakRequired: 3 },
  { id: 'xp_100', label: '100 XP', icon: Zap, color: '#F59E0B', xpRequired: 100 },
  { id: 'tasks_5', label: '5 Tasks Done', icon: Target, color: '#059669', tasksRequired: 5 },
  { id: 'streak_7', label: 'Week Warrior', icon: Flame, color: '#DC2626', streakRequired: 7 },
  { id: 'xp_500', label: '500 XP', icon: Star, color: '#6D28D9', xpRequired: 500 },
];

export default function ProfileScreen() {
  const { uid, user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    getUserProfile(uid)
      .then((data) => { if (data) setProfile(data as Profile); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const handlePlanSwitch = async (newTime: TimePerDay) => {
    if (!uid || newTime === profile?.timePerDay) return;
    setProfile((p) => p ? { ...p, timePerDay: newTime } : p);
    try {
      await updateUserPlan(uid, newTime);
    } catch {
      setProfile((p) => p ? { ...p, timePerDay: profile?.timePerDay } : p);
    }
  };

  const handleLevelSwitch = async (newLevel: UserLevel) => {
    if (!uid || newLevel === profile?.level) return;
    setProfile((p) => p ? { ...p, level: newLevel } : p);
    try {
      await updateUserPlan(uid, profile?.timePerDay ?? 5, newLevel);
    } catch {
      setProfile((p) => p ? { ...p, level: profile?.level } : p);
    }
  };

  const streak = profile?.streak ?? 0;
  const xp = profile?.xp ?? 0;
  const tasksCompleted = profile?.tasksCompleted ?? 0;
  const hasanat = xp * 2;
  const { level, title, next } = getLevel(xp);
  const progress = next === Infinity ? 1 : xp / next;

  const earnedBadges = BADGES.filter((b) => {
    if (b.xpRequired && xp >= b.xpRequired) return true;
    if (b.streakRequired && streak >= b.streakRequired) return true;
    if (b.tasksRequired && tasksCompleted >= b.tasksRequired) return true;
    return false;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Pressable onPress={handleSignOut} style={styles.signOutBtn} hitSlop={8}>
            <LogOut size={18} color={COLORS.textMuted} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Avatar + level card */}
            <View style={styles.avatarCard}>
              <Image
                source={require('../../elementsApp/achievement-removebg-preview.png')}
                style={styles.avatar}
              />
              <View style={styles.avatarInfo}>
                <Text style={styles.displayName}>{user?.displayName ?? user?.email ?? 'My Account'}</Text>
                <View style={styles.avatarLevelRow}>
                  <View style={styles.levelBadge}>
                    <Award size={12} color={COLORS.white} />
                    <Text style={styles.levelText}>Level {level}</Text>
                  </View>
                  <Text style={styles.levelTitle}>{title}</Text>
                </View>
                {/* XP progress bar */}
                <View style={styles.xpBarBg}>
                  <View style={[styles.xpBarFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
                </View>
                <Text style={styles.xpLabel}>
                  {xp} / {next === Infinity ? '∞' : next} XP
                </Text>
              </View>
            </View>

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              <StatCard icon={<Flame size={22} color="#FF6B35" fill="#FF6B35" />} value={streak} label="Day Streak" bg="#FFF0EB" color="#FF6B35" />
              <StatCard icon={<Star size={22} color={COLORS.accent} fill={COLORS.accent} />} value={hasanat} label="Hasanat" bg="#FFFBEB" color={COLORS.accentDark} />
              <StatCard icon={<Zap size={22} color={COLORS.primary} fill={COLORS.primary} />} value={xp} label="Total XP" bg={COLORS.primaryBg} color={COLORS.primaryDark} />
              <StatCard icon={<Target size={22} color="#059669" />} value={tasksCompleted} label="Tasks Done" bg="#ECFDF5" color="#059669" />
            </View>

            {/* Plan switcher */}
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Clock size={16} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Daily Plan</Text>
              </View>
              <View style={styles.planRow}>
                {([3, 5, 10] as TimePerDay[]).map((mins) => {
                  const active = profile?.timePerDay === mins;
                  return (
                    <Pressable
                      key={mins}
                      onPress={() => handlePlanSwitch(mins)}
                      style={[styles.planCard, active && styles.planCardActive, DEPTH.card, active && DEPTH.cardPressed]}
                    >
                      <ImageBackground source={require('../../elementsApp/cardBg1.png')} style={StyleSheet.absoluteFill} imageStyle={{ borderRadius: RADIUS.xl, opacity: 0.09 }} />
                      <Text style={[styles.planMins, active && styles.planMinsActive]}>{mins}</Text>
                      <Text style={[styles.planLabel, active && styles.planLabelActive]}>min/day</Text>
                      {active && <View style={styles.planDot} />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Level switcher — learn users only */}
            {profile?.goal === 'learn' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Learning Level</Text>
                <View style={styles.levelRow}>
                  {(['newbie', 'intermediate', 'fluent'] as UserLevel[]).map((lvl) => {
                    const active = profile?.level === lvl;
                    const emoji = lvl === 'newbie' ? '🌱' : lvl === 'intermediate' ? '📖' : '⭐';
                    return (
                      <Pressable
                        key={lvl}
                        onPress={() => handleLevelSwitch(lvl)}
                        style={[styles.levelCard, active && styles.planCardActive, DEPTH.card, active && DEPTH.cardPressed]}
                      >
                        <ImageBackground source={require('../../elementsApp/cardBg1.png')} style={StyleSheet.absoluteFill} imageStyle={{ borderRadius: RADIUS.xl, opacity: 0.09 }} />
                        <Text style={styles.levelEmoji}>{emoji}</Text>
                        <Text style={[styles.levelLabel, active && styles.planLabelActive]}>
                          {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                        </Text>
                        {active && <View style={styles.planDot} />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Badges */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Badges</Text>
              <View style={styles.badgeGrid}>
                {BADGES.map((b) => {
                  const earned = earnedBadges.some((e) => e.id === b.id);
                  const Icon = b.icon;
                  return (
                    <View key={b.id} style={[styles.badgeCard, !earned && styles.badgeCardLocked]}>
                      <View style={[styles.badgeIcon, { backgroundColor: earned ? `${b.color}18` : COLORS.surfaceDark }]}>
                        <Icon size={22} color={earned ? b.color : COLORS.textMuted} />
                      </View>
                      <Text style={[styles.badgeLabel, !earned && styles.badgeLabelLocked]}>
                        {b.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label, bg, color }: {
  icon: React.ReactNode; value: number; label: string; bg: string; color: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      {icon}
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '800' },
  signOutBtn: { padding: 6 },

  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    padding: 16,
    marginBottom: 16,
    ...SHADOW.card,
  },
  avatar: { width: 90, height: 90, resizeMode: 'contain' },
  avatarInfo: { flex: 1, gap: 6 },
  displayName: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  levelText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  levelTitle: { color: COLORS.textSub, fontSize: 13, fontWeight: '600' },
  xpBarBg: {
    height: 7, backgroundColor: COLORS.surfaceDark,
    borderRadius: RADIUS.full, overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%', backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  xpLabel: { color: COLORS.textMuted, fontSize: 11 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 16, marginBottom: 24,
  },
  statCard: {
    width: '47%', borderRadius: RADIUS.xl,
    padding: 16, alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    ...SHADOW.card,
  },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },

  section: { paddingHorizontal: 16, gap: 14, marginBottom: 24 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800' },

  planRow: { flexDirection: 'row', gap: 10 },
  planCard: {
    flex: 1, alignItems: 'center', gap: 2,
    borderRadius: RADIUS.xl, borderWidth: 1.5,
    borderColor: COLORS.cardBorder, padding: 14,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  planCardActive: {
    borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg,
  },
  planMins: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  planMinsActive: { color: COLORS.primary },
  planLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  planLabelActive: { color: COLORS.primary },
  planDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.primary, marginTop: 4,
  },

  avatarLevelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelRow: { flexDirection: 'row', gap: 10 },
  levelCard: {
    flex: 1, alignItems: 'center', gap: 4,
    borderRadius: RADIUS.xl, borderWidth: 1.5,
    borderColor: COLORS.cardBorder, padding: 12,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  levelEmoji: { fontSize: 22 },
  levelLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },
  badgeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  badgeCard: {
    width: '30%', alignItems: 'center', gap: 8,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    padding: 14, ...SHADOW.card,
  },
  badgeCardLocked: { opacity: 0.45 },
  badgeIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeLabel: {
    color: COLORS.text, fontSize: 11, fontWeight: '700',
    textAlign: 'center',
  },
  badgeLabelLocked: { color: COLORS.textMuted },

});
