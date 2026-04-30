import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Plus, Heart, MessageSquare, X, ChevronUp } from "lucide-react-native";
import { useAuth } from "../../components/AuthProvider";
import { getPosts, createPost, upvotePost } from "../../lib/firestore";
import type { Post } from "../../lib/types";

export default function CommunityScreen() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"question" | "reflection">("reflection");
  const [submitting, setSubmitting] = useState(false);
  const [upvoting, setUpvoting] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setPosts(await getPosts()); } catch {}
    setLoading(false);
  }

  async function handlePost() {
    if (!user || !profile || !content.trim()) return;
    setSubmitting(true);
    try {
      const post = await createPost(user.uid, profile.name, content.trim(), type, title.trim() || type);
      setPosts((prev) => [post, ...prev]);
      setContent("");
      setTitle("");
      setShowForm(false);
    } catch {}
    setSubmitting(false);
  }

  async function handleUpvote(postId: string) {
    if (!user || upvoting) return;
    setUpvoting(postId);
    try {
      await upvotePost(postId, user.uid);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const liked = p.upvotedBy.includes(user.uid);
          return {
            ...p,
            upvotes: liked ? p.upvotes - 1 : p.upvotes + 1,
            upvotedBy: liked ? p.upvotedBy.filter((id) => id !== user.uid) : [...p.upvotedBy, user.uid],
          };
        })
      );
    } catch {}
    setUpvoting(null);
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <LinearGradient colors={["#0F1639", "#15173D", "#1a0a2e"]} style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>Community</Text>
            <Text style={s.subtitle}>Share reflections and ask questions</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(!showForm)} activeOpacity={0.8}>
            {showForm ? <X size={20} color="#fff" /> : <Plus size={20} color="#fff" />}
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={s.form}>
            <View style={s.typeRow}>
              {(["reflection", "question"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[s.typeBtn, type === t && s.typeBtnActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[s.typeBtnText, type === t && s.typeBtnTextActive]}>
                    {t === "reflection" ? "💭 Reflection" : "❓ Question"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={s.input}
              placeholder="Title (optional)"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[s.input, s.textArea]}
              placeholder="Share your thought or question…"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[s.submitBtn, (!content.trim() || submitting) && s.submitBtnDisabled]}
              onPress={handlePost}
              disabled={!content.trim() || submitting}
              activeOpacity={0.8}
            >
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.submitBtnText}>Post</Text>}
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color="#E491C9" size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
            {posts.length === 0 && (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>🌙</Text>
                <Text style={s.emptyText}>Be the first to share a reflection</Text>
              </View>
            )}
            {posts.map((post) => {
              const liked = user ? post.upvotedBy.includes(user.uid) : false;
              return (
                <View key={post.id} style={s.postCard}>
                  <View style={s.postTop}>
                    <View style={[s.typePill, post.type === "question" && s.typePillQ]}>
                      <Text style={s.typePillText}>{post.type === "reflection" ? "💭" : "❓"} {post.type}</Text>
                    </View>
                    <Text style={s.postTime}>{timeAgo(post.createdAt)}</Text>
                  </View>
                  {post.title && post.title !== post.type && (
                    <Text style={s.postTitle}>{post.title}</Text>
                  )}
                  <Text style={s.postContent}>{post.content}</Text>
                  <View style={s.postFooter}>
                    <Text style={s.postAuthor}>— {post.userName}</Text>
                    <TouchableOpacity
                      style={[s.upvoteBtn, liked && s.upvoteBtnActive]}
                      onPress={() => handleUpvote(post.id)}
                      disabled={upvoting === post.id}
                      activeOpacity={0.75}
                    >
                      <ChevronUp size={14} color={liked ? "#E491C9" : "rgba(255,255,255,0.4)"} />
                      <Text style={[s.upvoteText, liked && s.upvoteTextActive]}>{post.upvotes}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            <View style={{ height: 24 }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#fff" },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#982598", alignItems: "center", justifyContent: "center" },
  form: { marginHorizontal: 20, backgroundColor: "rgba(20,20,50,0.9)", borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(228,145,201,0.2)" },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  typeBtnActive: { backgroundColor: "rgba(152,37,152,0.3)", borderColor: "#E491C9" },
  typeBtnText: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "600" },
  typeBtnTextActive: { color: "#E491C9" },
  input: { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: "#fff", fontSize: 14, marginBottom: 10 },
  textArea: { minHeight: 80 },
  submitBtn: { backgroundColor: "#982598", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: "rgba(255,255,255,0.35)", fontSize: 14 },
  postCard: { backgroundColor: "rgba(20,20,50,0.8)", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  postTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  typePill: { backgroundColor: "rgba(152,37,152,0.2)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  typePillQ: { backgroundColor: "rgba(59,130,246,0.2)" },
  typePillText: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "600" },
  postTime: { color: "rgba(255,255,255,0.3)", fontSize: 11 },
  postTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 6 },
  postContent: { fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 20, marginBottom: 12 },
  postFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  postAuthor: { fontSize: 12, color: "rgba(255,255,255,0.35)", fontStyle: "italic" },
  upvoteBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  upvoteBtnActive: { borderColor: "rgba(228,145,201,0.4)", backgroundColor: "rgba(228,145,201,0.1)" },
  upvoteText: { color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "600" },
  upvoteTextActive: { color: "#E491C9" },
});
