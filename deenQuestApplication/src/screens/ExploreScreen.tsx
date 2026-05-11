import { BotMessageSquare, Moon, UsersRound } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AskAITab from './explore/AskAITab';
import CommunityTab from './explore/CommunityTab';
import DawahTab from './explore/DawahTab';
import { COLORS, RADIUS, SHADOW } from '../theme';

const TABS = [
  { id: 'dawah', label: 'Dawah', icon: Moon },
  { id: 'community', label: 'Community', icon: UsersRound },
  { id: 'askai', label: 'Ask AI', icon: BotMessageSquare },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ExploreScreen() {
  const [active, setActive] = useState<TabId>('dawah');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const focused = active === id;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => setActive(id)}
              style={[styles.tab, focused && styles.tabActive]}
            >
              <Icon size={16} color={focused ? COLORS.white : COLORS.textMuted} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {active === 'dawah' && <DawahTab />}
        {active === 'community' && <CommunityTab />}
        {active === 'askai' && <AskAITab />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    padding: 4,
    gap: 4,
    ...SHADOW.card,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabLabel: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: COLORS.white },
  content: { flex: 1 },
});
