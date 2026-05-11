import { ThumbsUp, MessageSquare, Plus, Send } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { getPosts, createPost, upvotePost } from '../../lib/firestore-community';
import { COLORS, DEPTH, RADIUS, SHADOW } from '../../theme';

interface Post {
  id: string;
  userName: string;
  title: string;
  content: string;
  type: 'question' | 'reflection';
  upvotes: number;
  upvotedBy: string[];
  createdAt: string;
}

export default function CommunityTab() {
  const { uid, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'question' | 'reflection'>('reflection');
  const [posting, setPosting] = useState(false);
  const [postPressed, setPostPressed] = useState(false);
  const [newBtnPressed, setNewBtnPressed] = useState(false);

  const load = async () => {
    try {
      const data = await getPosts();
      setPosts(data as Post[]);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) return;
    setPosting(true);
    try {
      await createPost(uid ?? 'anon', user?.displayName ?? 'Anonymous', content.trim(), type, title.trim());
      setTitle(''); setContent(''); setShowModal(false);
      load();
    } catch {}
    setPosting(false);
  };

  const handleUpvote = async (postId: string) => {
    try {
      const currentUid = uid ?? 'anon';
      await upvotePost(postId, currentUid);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, upvotes: p.upvotedBy.includes(currentUid) ? p.upvotes - 1 : p.upvotes + 1 }
            : p
        )
      );
    } catch {}
  };

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.rowHeader}>
          <View>
            <Text style={styles.heading}>Community</Text>
            <Text style={styles.sub}>Share reflections & questions</Text>
          </View>
          <Pressable
            onPressIn={() => setNewBtnPressed(true)}
            onPressOut={() => setNewBtnPressed(false)}
            onPress={() => setShowModal(true)}
            style={[styles.newBtn, DEPTH.button, newBtnPressed && DEPTH.buttonPressed]}
          >
            <Plus size={16} color={COLORS.white} />
            <Text style={styles.newBtnText}>Post</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={[styles.typePill, post.type === 'question' && styles.typePillQ]}>
                  <Text style={[styles.typeText, post.type === 'question' && styles.typeTextQ]}>
                    {post.type === 'question' ? 'Question' : 'Reflection'}
                  </Text>
                </View>
                <Text style={styles.postTime}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postContent} numberOfLines={3}>{post.content}</Text>
              <View style={styles.postFooter}>
                <Text style={styles.postAuthor}>by {post.userName}</Text>
                <TouchableOpacity style={styles.upvoteBtn} onPress={() => handleUpvote(post.id)}>
                  <ThumbsUp size={13} color={COLORS.primary} />
                  <Text style={styles.upvoteCount}>{post.upvotes}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* New post modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Post</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.typeRow}>
            {(['reflection', 'question'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, type === t && styles.typeChipActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.titleInput}
            placeholder="Title…"
            placeholderTextColor={COLORS.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.contentInput}
            placeholder="Share your thoughts…"
            placeholderTextColor={COLORS.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          <Pressable
            onPressIn={() => { if (title.trim() && content.trim() && !posting) setPostPressed(true); }}
            onPressOut={() => setPostPressed(false)}
            onPress={handlePost}
            disabled={!title.trim() || !content.trim() || posting}
            style={[styles.submitBtn,
              (!title.trim() || !content.trim() || posting)
                ? styles.submitBtnDisabled
                : [DEPTH.button, postPressed && DEPTH.buttonPressed],
            ]}
          >
            {posting ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Send size={15} color={COLORS.white} />
                <Text style={styles.submitBtnText}>Post</Text>
              </>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  rowHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heading: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  sub: { color: COLORS.textSub, fontSize: 13 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, paddingHorizontal: 14,
    paddingVertical: 9, borderRadius: RADIUS.full,
    ...SHADOW.glow(COLORS.primary),
  },
  newBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  postCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    padding: 16, gap: 8, ...SHADOW.card,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typePill: {
    backgroundColor: COLORS.primaryBg, paddingHorizontal: 10,
    paddingVertical: 3, borderRadius: RADIUS.full,
  },
  typePillQ: { backgroundColor: `${COLORS.accent}22` },
  typeText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  typeTextQ: { color: COLORS.accentDark },
  postTime: { color: COLORS.textMuted, fontSize: 11, marginLeft: 'auto' },
  postTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  postContent: { color: COLORS.textSub, fontSize: 13, lineHeight: 20 },
  postFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  postAuthor: { color: COLORS.textMuted, fontSize: 12 },
  upvoteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primaryBg, paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: RADIUS.full,
  },
  upvoteCount: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  modal: { flex: 1, backgroundColor: COLORS.bg, padding: 20, gap: 14 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  modalClose: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.cardBorder,
  },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { color: COLORS.textSub, fontSize: 13, fontWeight: '600' },
  typeChipTextActive: { color: COLORS.white },
  titleInput: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1.5,
    borderColor: COLORS.cardBorder, padding: 14, color: COLORS.text, fontSize: 15, fontWeight: '600',
  },
  contentInput: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1.5,
    borderColor: COLORS.cardBorder, padding: 14, color: COLORS.text, fontSize: 14,
    minHeight: 140, flex: 1,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 16,
    ...SHADOW.glow(COLORS.primary),
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
