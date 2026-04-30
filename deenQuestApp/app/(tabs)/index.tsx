import { useState, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, BookMarked, RefreshCw } from "lucide-react-native";
import { useAuth } from "../../components/AuthProvider";
import { fetchAI } from "../../lib/api";
import { getLevelInfo } from "../../lib/types";

const MOODS = [
  { label: "Grateful", emoji: "🤲", query: "gratefulness and shukr" },
  { label: "Anxious", emoji: "😰", query: "finding peace and tawakkul" },
  { label: "Hopeful", emoji: "🌟", query: "hope and mercy of Allah" },
  { label: "Lost", emoji: "🌊", query: "guidance and light from Quran" },
  { label: "Joyful", emoji: "😊", query: "joy and gratitude in Islam" },
  { label: "Sad", emoji: "💧", query: "comfort and sabr in hardship" },
];

export default function HomeScreen() {
  const { profile } = useAuth();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [ayah, setAyah] = useState<{ arabic: string; translation: string; ref: string } | null>(null);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const levelInfo = profile ? getLevelInfo(profile.xp) : null;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  async function selectMood(idx: number) {
    setSelectedMood(idx);
    setAyah(null);
    setExplanation("");
    setLoading(true);
    fadeAnim.setValue(0);
    try {
      const mood = MOODS[idx];
      const res = await fetchAI(
        [{ role: "user", content: `Give me one Quranic verse relevant to the feeling of ${mood.label.toLowerCase()}. Format your response EXACTLY as JSON: {"arabic":"...","translation":"...","ref":"Surah X:Y","explanation":"2-3 sentence reflection"}` }],
        mood.query
      );
      const text = res.reply || res.content || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        setAyah({ arabic: data.arabic, translation: data.translation, ref: data.ref });
        setExplanation(data.explanation || "");
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      }
    } catch {
      setExplanation("Could not load verse. Please try again.");
    }
    setLoading(false);
  }

  async function refresh() {
    if (selectedMood !== null) await selectMood(selectedMood);
  }

  return (
    <LinearGradient colors={["#0F1639", "#15173D", "#1a0a2e"]} style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>As-salamu alaykum{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""} 👋</Text>
            <Text style={s.date}>{today}</Text>
          </View>
          {levelInfo && (
            <View style={s.xpBadge}>
              <Text style={s.xpLevel}>{levelInfo.current.name}</Text>
              <Text style={s.xpValue}>{profile?.xp} XP</Text>
            </View>
          )}
        </View>

        {/* XP Progress */}
        {levelInfo && (
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${levelInfo.progress}%` as any }]} />
          </View>
        )}

        {/* Mood Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>How are you feeling today?</Text>
          <View style={s.moodGrid}>
            {MOODS.map((m, i) => (
              <TouchableOpacity
                key={i}
                style={[s.moodBtn, selectedMood === i && s.moodBtnActive]}
                onPress={() => selectMood(i)}
                activeOpacity={0.75}
              >
                <Text style={s.moodEmoji}>{m.emoji}</Text>
                <Text style={[s.moodLabel, selectedMood === i && s.moodLabelActive]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ayah Card */}
        {(loading || ayah) && (
          <View style={s.ayahCard}>
            {loading ? (
              <View style={s.loadingBox}>
                <ActivityIndicator color="#E491C9" size="large" />
                <Text style={s.loadingText}>Finding the perfect verse…</Text>
              </View>
            ) : ayah ? (
              <Animated.View style={{ opacity: fadeAnim }}>
                <View style={s.ayahHeader}>
                  <View style={s.sparkleRow}>
                    <Sparkles size={16} color="#E491C9" />
                    <Text style={s.ayahRef}>{ayah.ref}</Text>
                  </View>
                  <TouchableOpacity onPress={refresh} style={s.refreshBtn}>
                    <RefreshCw size={16} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
                <Text style={s.arabic}>{ayah.arabic}</Text>
                <View style={s.divider} />
                <Text style={s.translation}>"{ayah.translation}"</Text>
                {explanation ? (
                  <View style={s.explanationBox}>
                    <BookMarked size={14} color="#E491C9" style={{ marginBottom: 6 }} />
                    <Text style={s.explanationText}>{explanation}</Text>
                  </View>
                ) : null}
              </Animated.View>
            ) : null}
          </View>
        )}

        {!selectedMood && !loading && !ayah && (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>🌙</Text>
            <Text style={s.emptyTitle}>Select your mood</Text>
            <Text style={s.emptySubtitle}>We'll find a Quranic verse that speaks to your heart</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 56 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  greeting: { fontSize: 20, fontWeight: "700", color: "#fff" },
  date: { fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 },
  xpBadge: { backgroundColor: "rgba(152,37,152,0.25)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignItems: "center", borderWidth: 1, borderColor: "rgba(228,145,201,0.3)" },
  xpLevel: { fontSize: 11, color: "#E491C9", fontWeight: "600" },
  xpValue: { fontSize: 13, color: "#fff", fontWeight: "700" },
  progressBar: { height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, marginBottom: 24, overflow: "hidden" },
  progressFill: { height: 4, backgroundColor: "#982598", borderRadius: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "rgba(255,255,255,0.7)", marginBottom: 14 },
  moodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  moodBtn: { width: "30%", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  moodBtnActive: { backgroundColor: "rgba(152,37,152,0.3)", borderColor: "#E491C9" },
  moodEmoji: { fontSize: 24, marginBottom: 4 },
  moodLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: "600" },
  moodLabelActive: { color: "#E491C9" },
  ayahCard: { backgroundColor: "rgba(20,20,50,0.8)", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "rgba(228,145,201,0.2)", marginBottom: 16 },
  loadingBox: { alignItems: "center", paddingVertical: 24 },
  loadingText: { color: "rgba(255,255,255,0.4)", marginTop: 12, fontSize: 13 },
  ayahHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sparkleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ayahRef: { color: "#E491C9", fontSize: 13, fontWeight: "600" },
  refreshBtn: { padding: 6 },
  arabic: { fontSize: 22, color: "#fff", textAlign: "right", lineHeight: 38, fontWeight: "500", marginBottom: 14 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginBottom: 14 },
  translation: { fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 22, fontStyle: "italic", marginBottom: 14 },
  explanationBox: { backgroundColor: "rgba(152,37,152,0.15)", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "rgba(228,145,201,0.2)" },
  explanationText: { fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 20 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "rgba(255,255,255,0.6)", marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center", paddingHorizontal: 20 },
});
