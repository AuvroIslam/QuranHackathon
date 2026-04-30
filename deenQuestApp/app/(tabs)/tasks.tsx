import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle, Circle, Zap, Trophy } from "lucide-react-native";
import { useAuth } from "../../components/AuthProvider";
import { getTodaysTasks } from "../../lib/tasks-data";
import { getUserTasksForDate, completeTask } from "../../lib/firestore";

export default function TasksScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const tasks = getTodaysTasks();
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    getUserTasksForDate(user.uid, today).then((ut) => {
      setCompletedIds(ut.map((t) => t.taskId));
      setLoading(false);
    });
  }, [user]);

  async function handleComplete(taskId: string, xp: number) {
    if (!user || completedIds.includes(taskId) || completing) return;
    setCompleting(taskId);
    try {
      await completeTask(user.uid, taskId, today, xp);
      setCompletedIds((prev) => [...prev, taskId]);
      await refreshProfile();
    } catch {}
    setCompleting(null);
  }

  const totalXP = tasks.filter((t) => completedIds.includes(t.id)).reduce((s, t) => s + t.xpReward, 0);
  const allDone = tasks.every((t) => completedIds.includes(t.id));

  return (
    <LinearGradient colors={["#0F1639", "#15173D", "#1a0a2e"]} style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <Text style={s.title}>Daily Deeds</Text>
          <Text style={s.subtitle}>Complete tasks to earn XP and grow spiritually</Text>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Zap size={18} color="#E491C9" />
            <Text style={s.statValue}>{totalXP}</Text>
            <Text style={s.statLabel}>XP Earned</Text>
          </View>
          <View style={s.statCard}>
            <Trophy size={18} color="#E491C9" />
            <Text style={s.statValue}>{completedIds.filter(id => tasks.find(t => t.id === id)).length}/{tasks.length}</Text>
            <Text style={s.statLabel}>Completed</Text>
          </View>
          <View style={s.statCard}>
            <CheckCircle size={18} color="#E491C9" />
            <Text style={s.statValue}>{profile?.streak ?? 0}</Text>
            <Text style={s.statLabel}>Day Streak</Text>
          </View>
        </View>

        {allDone && (
          <View style={s.allDoneBanner}>
            <Text style={s.allDoneEmoji}>🎉</Text>
            <Text style={s.allDoneText}>All deeds completed! Barakallahu feek.</Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color="#E491C9" style={{ marginTop: 40 }} />
        ) : (
          tasks.map((task) => {
            const done = completedIds.includes(task.id);
            const isCompleting = completing === task.id;
            return (
              <View key={task.id} style={[s.taskCard, done && s.taskCardDone]}>
                <View style={s.taskTop}>
                  <View style={s.taskInfo}>
                    <Text style={[s.taskTitle, done && s.taskTitleDone]}>{task.title}</Text>
                    <Text style={s.taskDesc}>{task.description}</Text>
                  </View>
                  <View style={s.xpTag}>
                    <Zap size={11} color="#E491C9" />
                    <Text style={s.xpTagText}>+{task.xpReward}</Text>
                  </View>
                </View>

                <View style={s.ayahBox}>
                  <Text style={s.ayahRef}>{task.ayahRef}</Text>
                  <Text style={s.ayahQuote}>"{task.quranGuidance}"</Text>
                </View>

                <Text style={s.benefit}>✦ {task.deedBenefit}</Text>

                <TouchableOpacity
                  style={[s.completeBtn, done && s.completeBtnDone]}
                  onPress={() => handleComplete(task.id, task.xpReward)}
                  disabled={done || !!completing}
                  activeOpacity={0.8}
                >
                  {isCompleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : done ? (
                    <View style={s.btnRow}>
                      <CheckCircle size={16} color="#fff" />
                      <Text style={s.completeBtnText}>Completed</Text>
                    </View>
                  ) : (
                    <View style={s.btnRow}>
                      <Circle size={16} color="#fff" />
                      <Text style={s.completeBtnText}>Mark Complete</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 56 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "700", color: "#fff" },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 14, alignItems: "center", gap: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#fff" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: "600" },
  allDoneBanner: { backgroundColor: "rgba(152,37,152,0.2)", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16, borderWidth: 1, borderColor: "rgba(228,145,201,0.3)" },
  allDoneEmoji: { fontSize: 24 },
  allDoneText: { color: "#E491C9", fontWeight: "600", fontSize: 14, flex: 1 },
  taskCard: { backgroundColor: "rgba(20,20,50,0.8)", borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  taskCardDone: { borderColor: "rgba(228,145,201,0.25)", backgroundColor: "rgba(152,37,152,0.1)" },
  taskTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  taskInfo: { flex: 1, marginRight: 10 },
  taskTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  taskTitleDone: { color: "#E491C9" },
  taskDesc: { fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 18 },
  xpTag: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(228,145,201,0.15)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  xpTagText: { fontSize: 12, color: "#E491C9", fontWeight: "700" },
  ayahBox: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 12, marginBottom: 10 },
  ayahRef: { fontSize: 11, color: "#E491C9", fontWeight: "600", marginBottom: 4 },
  ayahQuote: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontStyle: "italic", lineHeight: 18 },
  benefit: { fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 14, fontStyle: "italic" },
  completeBtn: { backgroundColor: "#982598", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  completeBtnDone: { backgroundColor: "rgba(152,37,152,0.35)" },
  completeBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
