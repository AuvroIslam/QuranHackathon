import { Award, Bookmark, BookmarkCheck, BookOpen, ExternalLink, Flame, Star, Target, Zap } from 'lucide-react-native';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator, Alert, Image, ImageBackground, Linking, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { getUserProfile, getBookmarks, updateUserPlan, getQFTokens } from '../lib/firestore';
import { COLORS, DEPTH, RADIUS, SHADOW } from '../theme';
import { Bookmark as BookmarkType, TimePerDay, UserGoal, UserLevel } from '../types';
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
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [expandedBm, setExpandedBm] = useState<string | null>(null);
  const [showAllBookmarks, setShowAllBookmarks] = useState(false);
  const [qfConnected, setQfConnected] = useState(false);

  useEffect(() => {
    if (!uid) return;
    getUserProfile(uid)
      .then((data) => { if (data) setProfile(data as Profile); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid]);

  // Re-fetch bookmarks + QF connection status every time this tab comes into focus
  useFocusEffect(useCallback(() => {
    if (!uid) return;
    getBookmarks(uid).then(setBookmarks).catch(() => {});
    getQFTokens(uid).then((tokens) => setQfConnected(!!tokens)).catch(() => {});
  }, [uid]));

  // Listen for deep link fired after OAuth completes
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url.startsWith('deenquest://qf-connected') && uid) {
        getQFTokens(uid).then((tokens) => setQfConnected(!!tokens)).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [uid]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await GoogleSignin.signOut().catch(() => {});
          signOut(auth);
        },
      },
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

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Keep learning, keep growing ✨</Text>
          </View>

        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* ── Profile card ── */}
            <View style={styles.profileCard}>
              <Image
                source={require('../../elementsApp/achievement-removebg-preview.png')}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.displayName}>{user?.displayName ?? user?.email?.split('@')[0] ?? 'My Account'}</Text>
                <View style={styles.levelRow}>
                  <View style={styles.levelBadge}>
                    <Star size={11} color={COLORS.white} fill={COLORS.white} />
                    <Text style={styles.levelBadgeText}>Level {level}</Text>
                  </View>
                  <Text style={styles.levelTitle}>{title}</Text>
                </View>
                <View style={styles.xpBarBg}>
                  <View style={[styles.xpBarFill, { width: `${Math.min(progress * 100, 100)}%` as any }]} />
                </View>
                <Text style={styles.xpLabel}>{xp.toLocaleString()} / {next === Infinity ? '∞' : next.toLocaleString()} XP</Text>
              </View>
              {/* Star badge */}
              <View style={styles.starBadge}>
                <Star size={28} color={COLORS.primaryLight} fill={`${COLORS.primaryLight}30`} />
              </View>
            </View>

            {/* ── 4-stat row ── */}
            <View style={styles.statsRow}>
              <StatChip icon={<Flame size={20} color="#FF5F57" fill="#FF5F57" />} value={streak} label="Day Streak" bg="#FFF0EE" />
              <StatChip icon={<Zap size={20} color={COLORS.primary} fill={COLORS.primary} />} value={xp} label="Total XP" bg={COLORS.primaryBg} />
              <StatChip icon={<Target size={20} color="#10B981" />} value={tasksCompleted} label="Tasks Done" bg="#ECFDF5" />
              <StatChip icon={<Award size={20} color="#3B82F6" />} value={earnedBadges.length} label="Badges" bg="#EFF6FF" />
            </View>

            {/* ── Daily Plan card ── */}
            <View style={styles.planSection}>
              <ImageBackground
                source={require('../../elementsApp/ayahbg3.jpeg')}
                style={styles.planCard}
                imageStyle={styles.planCardImage}
              >
                <View style={styles.planOverlay}>
                  <View style={styles.planHeader}>
                    <View style={styles.planTitleRow}>
                      <View>
                        <Text style={styles.planTitle}>Daily Plan</Text>
                        <Text style={styles.planSub}>Small steps, big rewards</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.planGoals}>
                    {([3, 5, 10] as TimePerDay[]).map((mins, i) => {
                      const labels = ['Quran Pages', 'Ahadith', 'Minutes'];
                      const active = profile?.timePerDay === mins;
                      return (
                        <Pressable key={mins} onPress={() => handlePlanSwitch(mins)} style={[styles.planGoalItem, active && styles.planGoalActive]}>
                          <Text style={styles.planGoalNumber}>{mins}</Text>
                          <Text style={styles.planGoalLabel}>{labels[i]}</Text>
                          <Text style={styles.planGoalSub}>min/day</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </ImageBackground>
            </View>

            {/* ── Badges ── */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Badges</Text>
                <Text style={styles.badgeCount}>{earnedBadges.length}/{BADGES.length} earned</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesScroll}>
                {BADGES.map((b) => {
                  const earned = earnedBadges.some((e) => e.id === b.id);
                  const Icon = b.icon;
                  return (
                    <View key={b.id} style={[styles.badgeCard, !earned && styles.badgeCardLocked]}>
                      <View style={[styles.badgeIconWrap, { backgroundColor: earned ? `${b.color}20` : '#F3F0FF' }]}>
                        <Icon size={24} color={earned ? b.color : COLORS.textMuted} />
                      </View>
                      <Text style={[styles.badgeLabel, !earned && styles.badgeLabelLocked]}>{b.label}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── Bookmarks ── */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bookmarks</Text>
                {bookmarks.length > 5 && (
                  <Pressable hitSlop={8} onPress={() => setShowAllBookmarks((v) => !v)}>
                    <Text style={styles.viewAll}>
                      {showAllBookmarks ? 'Show less ‹' : `View all ${bookmarks.length}  ›`}
                    </Text>
                  </Pressable>
                )}
              </View>
              {bookmarks.length === 0 ? (
                <Text style={styles.bmEmpty}>No bookmarks yet — save an ayah while reading.</Text>
              ) : (
                (showAllBookmarks ? bookmarks : bookmarks.slice(0, 5)).map((bm) => {
                  const open = expandedBm === bm.id;
                  return (
                    <Pressable key={bm.id} onPress={() => setExpandedBm(open ? null : bm.id)} style={styles.bmRow}>
                      <View style={styles.bmIconWrap}>
                        <Bookmark size={18} color={COLORS.primary} fill={`${COLORS.primary}20`} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bmTitle}>{bm.surahName || bm.verseKey}</Text>
                        <Text style={styles.bmSub}>Quran {bm.verseKey}</Text>
                        {open && <Text style={styles.bmTranslation} numberOfLines={3}>"{bm.translation}"</Text>}
                      </View>
                      {open
                        ? <BookmarkCheck size={16} color={COLORS.primary} />
                        : <Bookmark size={16} color={COLORS.textMuted} />}
                    </Pressable>
                  );
                })
              )}
            </View>

            {/* ── QF Connect ── */}
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              {qfConnected ? (
                <View style={styles.qfConnectedBadge}>
                  <ExternalLink size={16} color={COLORS.success} />
                  <Text style={styles.qfConnectedText}>Quran.com Connected</Text>
                </View>
              ) : (
                <Pressable
                  style={styles.qfConnectBtn}
                  onPress={() => {
                    if (!uid) return;
                    const url = `https://quran-hackathon-omega.vercel.app/auth/qf-start?from=mobile&uid=${encodeURIComponent(uid)}`;
                    Linking.openURL(url).catch(() => {});
                  }}
                >
                  <ExternalLink size={18} color={COLORS.white} />
                  <Text style={styles.qfConnectText}>Connect Quran.com</Text>
                </Pressable>
              )}
            </View>

            {/* ── Sign Out ── */}
            <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
              <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </Pressable>
            </View>

          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatChip({ icon, value, label, bg }: { icon: React.ReactNode; value: number; label: string; bg: string }) {
  return (
    <View style={[styles.statChip, { backgroundColor: bg }]}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EAFF' },
  scroll: { paddingBottom: 100, backgroundColor: '#F0EAFF' },

  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
  },
  title: { color: '#1E1B4B', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: '#7C6AAB', fontSize: 13, marginTop: 2 },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center',
    ...SHADOW.card,
  },

  /* Profile card */
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 16,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 6,
  },
  avatar: { width: 80, height: 80, resizeMode: 'contain' },
  profileInfo: { flex: 1, gap: 5 },
  displayName: { color: '#1E1B4B', fontSize: 18, fontWeight: '800' },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  levelBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  levelTitle: { color: '#7C6AAB', fontSize: 13, fontWeight: '600' },
  xpBarBg: { height: 8, backgroundColor: '#EDE9FE', borderRadius: RADIUS.full, overflow: 'hidden', marginTop: 2 },
  xpBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  xpLabel: { color: COLORS.primary, fontSize: 11, fontWeight: '600' },
  starBadge: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#F5F0FF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#E8DCFF',
  },

  /* Stats row */
  statsRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, marginBottom: 16,
  },
  statChip: {
    flex: 1, alignItems: 'center', gap: 3,
    borderRadius: RADIUS.lg, paddingVertical: 12,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  statValue: { color: '#1E1B4B', fontSize: 18, fontWeight: '800', marginTop: 2 },
  statLabel: { color: '#9D99CC', fontSize: 10, fontWeight: '600', textAlign: 'center' },

  /* Daily plan */
  planSection: { paddingHorizontal: 16, marginBottom: 24 },
  planCard: { borderRadius: RADIUS.xl, overflow: 'hidden', minHeight: 180 },
  planCardImage: { borderRadius: RADIUS.xl, opacity: 0.70 },
  planOverlay: {
    flex: 1, backgroundColor: 'rgba(80,30,140,0.72)',
    borderRadius: RADIUS.xl, padding: 18, gap: 16,
  },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  planTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  planSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 1 },
  editPlanLink: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  planGoals: { flexDirection: 'row', justifyContent: 'space-between' },
  planGoalItem: {
    flex: 1, alignItems: 'center', gap: 4,
    paddingVertical: 10, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: 'transparent',
  },
  planGoalActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  planGoalNumber: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  planGoalLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  planGoalSub: { color: 'rgba(255,255,255,0.65)', fontSize: 10, textAlign: 'center' },

  /* Sections */
  sectionWrap: { paddingHorizontal: 16, marginBottom: 24, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#1E1B4B', fontSize: 17, fontWeight: '800' },
  viewAll: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  badgeCount: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },

  /* Badges */
  badgesScroll: { gap: 10, paddingRight: 4 },
  badgeCard: {
    alignItems: 'center', gap: 8, width: 80,
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    paddingVertical: 14, paddingHorizontal: 8,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  badgeCardLocked: { opacity: 0.45 },
  badgeIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  badgeLabel: { color: '#1E1B4B', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  badgeLabelLocked: { color: COLORS.textMuted },

  /* Bookmarks */
  bmEmpty: { color: COLORS.textMuted, fontSize: 13, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
  bmRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 14, marginBottom: 8,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  bmIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  bmTitle: { color: '#1E1B4B', fontSize: 14, fontWeight: '700' },
  bmSub: { color: '#9D99CC', fontSize: 12, marginTop: 1 },
  bmTranslation: { color: '#4C4693', fontSize: 12, fontStyle: 'italic', marginTop: 6, lineHeight: 18 },

  /* QF */
  qfConnectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 16,
    ...SHADOW.glow(COLORS.primary), ...DEPTH.button,
  },
  qfConnectText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  qfConnectedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: `${COLORS.success}18`, borderRadius: RADIUS.xl, paddingVertical: 14,
    borderWidth: 1.5, borderColor: `${COLORS.success}44`,
  },
  qfConnectedText: { color: COLORS.success, fontSize: 15, fontWeight: '700' },

  /* Sign out */
  signOutBtn: {
    borderRadius: RADIUS.xl, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#DC262644',
    backgroundColor: '#FFF5F5',
  },
  signOutText: { color: '#DC2626', fontSize: 16, fontWeight: '700' },
});
