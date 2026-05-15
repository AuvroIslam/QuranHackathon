import { ChevronDown, ChevronUp, MessageSquare, Plus, Search, Send, ThumbsUp, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {
  Answer, createAnswer, createPost, getAnswers, getPosts, upvoteAnswer, upvotePost,
} from '../../lib/firestore-community';
import { DEPTH, RADIUS, SHADOW } from '../../theme';

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
  const { colors } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'question' | 'reflection'>('reflection');
  const [posting, setPosting] = useState(false);
  const [postPressed, setPostPressed] = useState(false);
  const [newBtnPressed, setNewBtnPressed] = useState(false);

  // Replies state
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [answerInput, setAnswerInput] = useState<Record<string, string>>({});
  const [answerLoading, setAnswerLoading] = useState<Record<string, boolean>>({});
  const [loadingAnswers, setLoadingAnswers] = useState<Record<string, boolean>>({});
  // replyingTo[postId] = { answerId, userName } when replying to a specific answer
  const [replyingTo, setReplyingTo] = useState<Record<string, { answerId: string; userName: string } | null>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    try {
      const data = await getPosts();
      setPosts(data as Post[]);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggleExpand = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    setExpandedPost(postId);
    if (answers[postId]) return; // already loaded
    setLoadingAnswers((prev) => ({ ...prev, [postId]: true }));
    try {
      const data = await getAnswers(postId);
      setAnswers((prev) => ({ ...prev, [postId]: data }));
    } catch {
      setAnswers((prev) => ({ ...prev, [postId]: [] }));
    }
    setLoadingAnswers((prev) => ({ ...prev, [postId]: false }));
  };

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
        prev.map((p) => {
          if (p.id !== postId) return p;
          const already = p.upvotedBy.includes(currentUid);
          return {
            ...p,
            upvotes: already ? p.upvotes - 1 : p.upvotes + 1,
            upvotedBy: already
              ? p.upvotedBy.filter((id) => id !== currentUid)
              : [...p.upvotedBy, currentUid],
          };
        })
      );
    } catch {}
  };

  const handleReply = async (postId: string) => {
    const text = answerInput[postId]?.trim();
    if (!text || !uid) return;
    setAnswerLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const parent = replyingTo[postId];
      const answer = await createAnswer(postId, uid, user?.displayName ?? 'Anonymous', text, parent?.answerId ?? null);
      setAnswers((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), answer] }));
      setAnswerInput((prev) => ({ ...prev, [postId]: '' }));
      setReplyingTo((prev) => ({ ...prev, [postId]: null }));
    } catch {}
    setAnswerLoading((prev) => ({ ...prev, [postId]: false }));
  };

  const handleAnswerUpvote = async (answerId: string, postId: string) => {
    if (!uid) return;
    try {
      await upvoteAnswer(answerId, uid);
      setAnswers((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? []).map((a) => {
          if (a.id !== answerId) return a;
          const already = a.upvotedBy.includes(uid);
          return {
            ...a,
            upvotes: already ? a.upvotes - 1 : a.upvotes + 1,
            upvotedBy: already
              ? a.upvotedBy.filter((id) => id !== uid)
              : [...a.upvotedBy, uid],
          };
        }),
      }));
    } catch {}
  };

  const postAnswers = (postId: string) => answers[postId] ?? [];

  const filteredPosts = posts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.title?.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
  });

  const styles = useMemo(() => StyleSheet.create({
    flex: { flex: 1 },
    container: { padding: 16, gap: 12, paddingBottom: 40 },

    rowHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    heading: { color: colors.text, fontSize: 20, fontWeight: '800' },
    sub: { color: colors.textSub, fontSize: 13 },
    newBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: colors.primary, paddingHorizontal: 14,
      paddingVertical: 9, borderRadius: RADIUS.full,
      ...SHADOW.glow(colors.primary),
    },
    newBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },

    searchWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: RADIUS.xl,
      borderWidth: 1.5, borderColor: colors.cardBorder,
      paddingHorizontal: 12, paddingVertical: 8, gap: 8,
    },
    searchInput: { flex: 1, color: colors.text, fontSize: 13, paddingVertical: 0 },
    searchClear: { padding: 2 },

    emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 12 },
    emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },

    postCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.xl,
      borderWidth: 1.5, borderColor: colors.cardBorder,
      overflow: 'hidden', ...SHADOW.card,
    },
    postHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, paddingBottom: 6 },
    typePill: {
      backgroundColor: colors.primaryBg, paddingHorizontal: 10,
      paddingVertical: 3, borderRadius: RADIUS.full,
    },
    typePillQ: { backgroundColor: `${colors.accent}22` },
    typeText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
    typeTextQ: { color: colors.accentDark },
    postTime: { color: colors.textMuted, fontSize: 11, marginLeft: 'auto' },
    postTitle: { color: colors.text, fontSize: 15, fontWeight: '700', paddingHorizontal: 14, marginBottom: 4 },
    postContent: { color: colors.textSub, fontSize: 13, lineHeight: 20, paddingHorizontal: 14 },
    postFooter: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 14, paddingVertical: 10, marginTop: 4,
    },
    postAuthor: { color: colors.textMuted, fontSize: 12 },
    postActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: colors.primaryBg, paddingHorizontal: 10,
      paddingVertical: 5, borderRadius: RADIUS.full,
      borderWidth: 1, borderColor: `${colors.primary}33`,
    },
    actionChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    actionChipText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
    actionChipTextActive: { color: colors.white },
    replyChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 10, paddingVertical: 5,
      backgroundColor: colors.surfaceDark, borderRadius: RADIUS.full,
      borderWidth: 1, borderColor: colors.cardBorder,
    },
    replyChipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },

    // Replies
    repliesSection: { paddingHorizontal: 14, paddingBottom: 12, gap: 10 },
    repliesDivider: { height: 1, backgroundColor: colors.cardBorder, marginBottom: 4 },
    noReplies: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },

    replyRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    replyAvatar: {
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: colors.primaryBg,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    replyAvatarText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
    replyBody: { flex: 1, gap: 3 },
    replyMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    replyName: { color: colors.text, fontSize: 12, fontWeight: '700' },
    replyTime: { color: colors.textMuted, fontSize: 11 },
    replyContent: { color: colors.textSub, fontSize: 13, lineHeight: 19 },
    replyActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
    replyUpvote: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    replyUpvoteText: { color: colors.textMuted, fontSize: 11 },
    replyUpvoteTextActive: { color: colors.primary },
    replyToBtn: { color: colors.primary, fontSize: 11, fontWeight: '700' },
    subReplyRow: { flexDirection: 'row', marginLeft: 14, marginTop: 6 },
    subReplyLine: { width: 2, backgroundColor: colors.cardBorder, borderRadius: 2, marginRight: 8, marginLeft: 6 },
    subReplyAvatar: { width: 24, height: 24, borderRadius: 12 },
    replyingToBanner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.primaryBg, borderRadius: RADIUS.md,
      paddingHorizontal: 10, paddingVertical: 6, marginBottom: 4,
    },
    replyingToText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
    replyingToCancel: { color: colors.primary, fontSize: 13, fontWeight: '700', paddingHorizontal: 4 },

    replyInput: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 8,
      marginTop: 4,
    },
    replyTextInput: {
      flex: 1,
      backgroundColor: colors.surfaceDark,
      borderRadius: RADIUS.lg,
      borderWidth: 1.5, borderColor: colors.cardBorder,
      paddingHorizontal: 12, paddingVertical: 8,
      color: colors.text, fontSize: 13, maxHeight: 80,
    },
    replySendBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    replySendBtnDisabled: { opacity: 0.4 },

    // Modal
    modal: { flex: 1, backgroundColor: colors.bg, padding: 20, gap: 14 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
    modalTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
    modalClose: { color: colors.primary, fontSize: 15, fontWeight: '600' },
    typeRow: { flexDirection: 'row', gap: 10 },
    typeChip: {
      paddingHorizontal: 16, paddingVertical: 8,
      borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: colors.cardBorder,
    },
    typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    typeChipText: { color: colors.textSub, fontSize: 13, fontWeight: '600' },
    typeChipTextActive: { color: colors.white },
    titleInput: {
      backgroundColor: colors.card, borderRadius: RADIUS.lg, borderWidth: 1.5,
      borderColor: colors.cardBorder, padding: 14, color: colors.text, fontSize: 15, fontWeight: '600',
    },
    contentInput: {
      backgroundColor: colors.card, borderRadius: RADIUS.lg, borderWidth: 1.5,
      borderColor: colors.cardBorder, padding: 14, color: colors.text, fontSize: 14,
      minHeight: 140, flex: 1,
    },
    submitBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.primary, borderRadius: RADIUS.xl, paddingVertical: 16,
      ...SHADOW.glow(colors.primary),
    },
    submitBtnDisabled: { opacity: 0.45 },
    submitBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  }), [colors]);

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
            <Plus size={16} color={colors.white} />
            <Text style={styles.newBtnText}>Post</Text>
          </Pressable>
        </View>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <Search size={15} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts by keyword…"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClear}>
              <X size={13} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MessageSquare size={36} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery.trim() ? 'No posts match your search.' : 'No posts yet — be the first to share!'}
            </Text>
          </View>
        ) : (
          filteredPosts.map((post) => {
            const expanded = expandedPost === post.id;
            const replies = postAnswers(post.id);
            const replyCount = expanded ? replies.length : (answers[post.id]?.length ?? 0);
            const isUpvoted = uid ? post.upvotedBy.includes(uid) : false;

            return (
              <View key={post.id} style={styles.postCard}>
                {/* Post header */}
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
                <Text style={styles.postContent} numberOfLines={expanded ? undefined : 3}>{post.content}</Text>

                {/* Post footer actions */}
                <View style={styles.postFooter}>
                  <Text style={styles.postAuthor}>by {post.userName}</Text>
                  <View style={styles.postActions}>
                    <TouchableOpacity
                      style={[styles.actionChip, isUpvoted && styles.actionChipActive]}
                      onPress={() => handleUpvote(post.id)}
                    >
                      <ThumbsUp size={13} color={isUpvoted ? colors.white : colors.primary} />
                      <Text style={[styles.actionChipText, isUpvoted && styles.actionChipTextActive]}>
                        {post.upvotes}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.replyChip}
                      onPress={() => handleToggleExpand(post.id)}
                    >
                      <MessageSquare size={13} color={colors.textMuted} />
                      <Text style={styles.replyChipText}>
                        {replyCount > 0 ? replyCount : ''} {replyCount === 1 ? 'Reply' : 'Replies'}
                      </Text>
                      {expanded
                        ? <ChevronUp size={13} color={colors.textMuted} />
                        : <ChevronDown size={13} color={colors.textMuted} />}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Expanded replies section */}
                {expanded && (
                  <View style={styles.repliesSection}>
                    <View style={styles.repliesDivider} />

                    {loadingAnswers[post.id] ? (
                      <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
                    ) : replies.filter((r) => !r.parentAnswerId).length === 0 ? (
                      <Text style={styles.noReplies}>No replies yet — add the first one!</Text>
                    ) : (
                      replies.filter((r) => !r.parentAnswerId).map((answer) => {
                        const answerUpvoted = uid ? answer.upvotedBy.includes(uid) : false;
                        const subReplies = replies.filter((r) => r.parentAnswerId === answer.id);
                        return (
                          <View key={answer.id}>
                            <View style={styles.replyRow}>
                              <View style={styles.replyAvatar}>
                                <Text style={styles.replyAvatarText}>
                                  {answer.userName.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                              <View style={styles.replyBody}>
                                <View style={styles.replyMeta}>
                                  <Text style={styles.replyName}>{answer.userName}</Text>
                                  <Text style={styles.replyTime}>
                                    {new Date(answer.createdAt).toLocaleDateString()}
                                  </Text>
                                </View>
                                <Text style={styles.replyContent}>{answer.content}</Text>
                                <View style={styles.replyActions}>
                                  <TouchableOpacity
                                    style={styles.replyUpvote}
                                    onPress={() => handleAnswerUpvote(answer.id, post.id)}
                                  >
                                    <ThumbsUp size={11} color={answerUpvoted ? colors.primary : colors.textMuted} />
                                    <Text style={[styles.replyUpvoteText, answerUpvoted && styles.replyUpvoteTextActive]}>
                                      {answer.upvotes > 0 ? answer.upvotes : ''}
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => setReplyingTo((prev) => ({
                                      ...prev,
                                      [post.id]: prev[post.id]?.answerId === answer.id
                                        ? null
                                        : { answerId: answer.id, userName: answer.userName },
                                    }))}
                                  >
                                    <Text style={styles.replyToBtn}>Reply</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                            {/* Sub-replies indented */}
                            {subReplies.map((sub) => {
                              const subUpvoted = uid ? sub.upvotedBy.includes(uid) : false;
                              return (
                                <View key={sub.id} style={styles.subReplyRow}>
                                  <View style={styles.subReplyLine} />
                                  <View style={[styles.replyRow, { flex: 1 }]}>
                                    <View style={[styles.replyAvatar, styles.subReplyAvatar]}>
                                      <Text style={styles.replyAvatarText}>
                                        {sub.userName.charAt(0).toUpperCase()}
                                      </Text>
                                    </View>
                                    <View style={styles.replyBody}>
                                      <View style={styles.replyMeta}>
                                        <Text style={styles.replyName}>{sub.userName}</Text>
                                        <Text style={styles.replyTime}>
                                          {new Date(sub.createdAt).toLocaleDateString()}
                                        </Text>
                                      </View>
                                      <Text style={styles.replyContent}>{sub.content}</Text>
                                      <TouchableOpacity
                                        style={styles.replyUpvote}
                                        onPress={() => handleAnswerUpvote(sub.id, post.id)}
                                      >
                                        <ThumbsUp size={11} color={subUpvoted ? colors.primary : colors.textMuted} />
                                        <Text style={[styles.replyUpvoteText, subUpvoted && styles.replyUpvoteTextActive]}>
                                          {sub.upvotes > 0 ? sub.upvotes : ''}
                                        </Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        );
                      })
                    )}

                    {/* Reply input */}
                    {replyingTo[post.id] && (
                      <View style={styles.replyingToBanner}>
                        <Text style={styles.replyingToText}>↩ Replying to {replyingTo[post.id]!.userName}</Text>
                        <TouchableOpacity onPress={() => setReplyingTo((prev) => ({ ...prev, [post.id]: null }))}>
                          <Text style={styles.replyingToCancel}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <View style={styles.replyInput}>
                      <TextInput
                        style={styles.replyTextInput}
                        placeholder={replyingTo[post.id] ? `Reply to ${replyingTo[post.id]!.userName}…` : 'Write a reply…'}
                        placeholderTextColor={colors.textMuted}
                        value={answerInput[post.id] ?? ''}
                        onChangeText={(t) => setAnswerInput((prev) => ({ ...prev, [post.id]: t }))}
                        multiline
                        returnKeyType="send"
                        onSubmitEditing={() => handleReply(post.id)}
                      />
                      <TouchableOpacity
                        style={[
                          styles.replySendBtn,
                          (!answerInput[post.id]?.trim() || answerLoading[post.id]) && styles.replySendBtnDisabled,
                        ]}
                        onPress={() => handleReply(post.id)}
                        disabled={!answerInput[post.id]?.trim() || answerLoading[post.id]}
                      >
                        {answerLoading[post.id]
                          ? <ActivityIndicator size="small" color={colors.white} />
                          : <Send size={15} color={colors.white} />}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })
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
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.contentInput}
            placeholder="Share your thoughts…"
            placeholderTextColor={colors.textMuted}
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
            style={[
              styles.submitBtn,
              (!title.trim() || !content.trim() || posting)
                ? styles.submitBtnDisabled
                : [DEPTH.button, postPressed && DEPTH.buttonPressed],
            ]}
          >
            {posting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Send size={15} color={colors.white} />
                <Text style={styles.submitBtnText}>Post</Text>
              </>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
