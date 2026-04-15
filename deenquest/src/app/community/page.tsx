"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPost,
  getPosts,
  upvotePost,
  createAnswer,
  getAnswers,
  upvoteAnswer,
} from "@/lib/firestore";
import type { Post, Answer } from "@/lib/types";
import {
  MessageSquare,
  ThumbsUp,
  Send,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Reply,
} from "lucide-react";
import toast from "react-hot-toast";

export default function CommunityPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<"question" | "reflection">("question");
  const [submitting, setSubmitting] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [answerInput, setAnswerInput] = useState<Record<string, string>>({});
  const [newTitle, setNewTitle] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ answerId: string; postId: string; userName: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoadingPosts(true);
    try {
      const data = await getPosts();
      setPosts(data);
      // Pre-load answers for all posts
      const answersMap: Record<string, Answer[]> = {};
      await Promise.all(
        data.map(async (post) => {
          try {
            answersMap[post.id] = await getAnswers(post.id);
          } catch {
            answersMap[post.id] = [];
          }
        })
      );
      setAnswers(answersMap);
    } catch {
      toast.error("Failed to load posts");
    }
    setLoadingPosts(false);
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile || !newContent.trim() || !newTitle.trim()) return;
    setSubmitting(true);
    try {
      const post = await createPost(user.uid, profile.name, newContent.trim(), newType, newTitle.trim());
      setPosts((prev) => [post, ...prev]);
      setAnswers((prev) => ({ ...prev, [post.id]: [] }));
      setNewContent("");
      setNewTitle("");
      setShowNewPost(false);
      toast.success("Posted successfully");
    } catch {
      toast.error("Failed to create post");
    }
    setSubmitting(false);
  }

  async function handleUpvote(postId: string) {
    if (!user) return;
    try {
      await upvotePost(postId, user.uid);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const already = p.upvotedBy.includes(user.uid);
          return {
            ...p,
            upvotes: already ? p.upvotes - 1 : p.upvotes + 1,
            upvotedBy: already
              ? p.upvotedBy.filter((id) => id !== user.uid)
              : [...p.upvotedBy, user.uid],
          };
        })
      );
    } catch {}
  }

  function toggleExpand(postId: string) {
    setExpandedPost(expandedPost === postId ? null : postId);
  }

  async function handleAnswer(postId: string, parentAnswerId?: string, parentUserName?: string) {
    if (!user || !profile) return;
    const inputKey = parentAnswerId ? `reply_${parentAnswerId}` : postId;
    const content = answerInput[inputKey]?.trim();
    if (!content) return;
    try {
      const answer = await createAnswer(
        postId,
        user.uid,
        profile.name,
        content,
        parentAnswerId,
        parentUserName
      );
      setAnswers((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), answer],
      }));
      setAnswerInput((prev) => ({ ...prev, [inputKey]: "" }));
      setReplyingTo(null);
      toast.success("Reply posted");
    } catch {
      toast.error("Failed to post reply");
    }
  }

  async function handleAnswerUpvote(answerId: string, postId: string) {
    if (!user) return;
    try {
      await upvoteAnswer(answerId, user.uid);
      setAnswers((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((a) => {
          if (a.id !== answerId) return a;
          const already = a.upvotedBy.includes(user.uid);
          return {
            ...a,
            upvotes: already ? a.upvotes - 1 : a.upvotes + 1,
            upvotedBy: already
              ? a.upvotedBy.filter((id) => id !== user.uid)
              : [...a.upvotedBy, user.uid],
          };
        }),
      }));
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl h-40">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/mosque-bg.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#15173D]/60 to-transparent" />
        <div className="relative z-10 h-full flex items-end justify-between px-6 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Community</h1>
            <p className="text-white/70 mt-1">Share reflections and ask questions</p>
          </div>
          <button
            onClick={() => setShowNewPost(!showNewPost)}
            className="flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white rounded-xl text-sm font-medium hover:bg-white/25 transition-all duration-300"
          >
            {showNewPost ? <X size={16} /> : <Plus size={16} />}
            {showNewPost ? "Cancel" : "New Post"}
          </button>
        </div>
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <form
          onSubmit={handleCreatePost}
          className="glass-card rounded-2xl p-6 space-y-4"
        >
          <div className="flex gap-2">
            {(["question", "reflection"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setNewType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  newType === type
                    ? "bg-gradient-to-r from-secondary to-secondary-dark text-white shadow-lg shadow-secondary/20"
                    : "bg-white/20 text-primary/60 hover:bg-white/30"
                }`}
              >
                {type === "question" ? "Question" : "Reflection"}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-4 py-3 bg-white/25 border border-white/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/30 placeholder:text-primary/35 transition-all duration-300"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={
              newType === "question"
                ? "Describe your question about the Quran or Islamic teachings..."
                : "Share a reflection or insight from your Quran reading..."
            }
            rows={4}
            className="w-full px-4 py-3 bg-white/25 border border-white/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/30 resize-none placeholder:text-primary/35 transition-all duration-300"
          />
          <button
            type="submit"
            disabled={submitting || !newContent.trim() || !newTitle.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-secondary to-secondary-dark text-white rounded-xl text-sm font-medium hover:brightness-110 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-secondary/20"
          >
            {submitting ? "Posting..." : "Post"}
          </button>
        </form>
      )}

      {/* Posts */}
      {loadingPosts ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare size={40} className="text-primary/25 mx-auto mb-4" />
          <p className="text-primary/50">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="glass-card rounded-2xl overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary-dark flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                    {post.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary">{post.userName}</p>
                    <p className="text-xs text-primary/35">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      post.type === "question"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-purple-50 text-purple-600"
                    }`}
                  >
                    {post.type}
                  </span>
                </div>

                {post.title && (
                  <h3 className="text-base font-semibold text-primary mb-1">{post.title}</h3>
                )}
                <p className="text-sm text-primary/70 leading-relaxed">{post.content}</p>

                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={() => handleUpvote(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      user && post.upvotedBy.includes(user.uid)
                        ? "text-secondary"
                        : "text-primary/35 hover:text-secondary"
                    }`}
                  >
                    <ThumbsUp size={16} />
                    {post.upvotes}
                  </button>
                  <button
                    onClick={() => toggleExpand(post.id)}
                    className="flex items-center gap-1.5 text-sm text-primary/35 hover:text-primary/60 transition-colors"
                  >
                    <MessageSquare size={16} />
                    {answers[post.id]?.length || 0} replies
                    {expandedPost === post.id ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                </div>
              </div>

              {/* Answers Section */}
              {expandedPost === post.id && (
                <div className="border-t border-white/15 bg-white/10 backdrop-blur-sm">
                  {(() => {
                    const postAnswers = answers[post.id] || [];
                    const topLevel = postAnswers.filter((a) => !a.parentId);
                    const getReplies = (parentId: string) =>
                      postAnswers.filter((a) => a.parentId === parentId);

                    function renderAnswer(answer: Answer, depth: number) {
                      const replies = getReplies(answer.id);
                      const isReplyTarget =
                        replyingTo?.answerId === answer.id &&
                        replyingTo?.postId === post.id;
                      const replyInputKey = `reply_${answer.id}`;

                      return (
                        <div key={answer.id}>
                          <div
                            className={`px-5 py-4 border-b border-white/20 last:border-0`}
                            style={{ paddingLeft: `${20 + depth * 24}px` }}
                          >
                            {depth > 0 && (
                              <div className="absolute left-0 top-0 bottom-0 w-px bg-amber-300/30" />
                            )}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-secondary text-xs font-semibold">
                                {answer.userName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-medium text-primary/70">
                                {answer.userName}
                              </span>
                              <span className="text-xs text-primary/35">
                                {new Date(answer.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {answer.replyToName && (
                              <p className="text-xs text-secondary ml-8 mb-1">
                                Replying to {answer.replyToName}
                              </p>
                            )}
                            <p className="text-sm text-primary/70 ml-8">{answer.content}</p>
                            <div className="flex items-center gap-3 mt-2 ml-8">
                              <button
                                onClick={() => handleAnswerUpvote(answer.id, post.id)}
                                className={`flex items-center gap-1 text-xs transition-colors ${
                                  user && answer.upvotedBy.includes(user.uid)
                                    ? "text-secondary"
                                    : "text-primary/35 hover:text-secondary"
                                }`}
                              >
                                <ThumbsUp size={12} />
                                {answer.upvotes}
                              </button>
                              <button
                                onClick={() =>
                                  setReplyingTo(
                                    isReplyTarget
                                      ? null
                                      : {
                                          answerId: answer.id,
                                          postId: post.id,
                                          userName: answer.userName,
                                        }
                                  )
                                }
                                className="flex items-center gap-1 text-xs text-primary/35 hover:text-secondary transition-colors"
                              >
                                <Reply size={12} />
                                Reply
                              </button>
                            </div>

                            {/* Inline reply input */}
                            {isReplyTarget && (
                              <div className="ml-8 mt-3 flex gap-2">
                                <input
                                  type="text"
                                  placeholder={`Reply to ${answer.userName}...`}
                                  value={answerInput[replyInputKey] || ""}
                                  onChange={(e) =>
                                    setAnswerInput((prev) => ({
                                      ...prev,
                                      [replyInputKey]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleAnswer(post.id, answer.id, answer.userName);
                                    }
                                  }}
                                  autoFocus
                                  className="flex-1 px-3 py-1.5 bg-white/20 border border-accent/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                                />
                                <button
                                  onClick={() => handleAnswer(post.id, answer.id, answer.userName)}
                                  className="px-3 py-1.5 bg-gradient-to-r from-secondary to-secondary-dark text-white rounded-lg hover:brightness-110 transition-all duration-300"
                                >
                                  <Send size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                          {replies.map((r) => renderAnswer(r, depth + 1))}
                        </div>
                      );
                    }

                    return topLevel.map((a) => renderAnswer(a, 0));
                  })()}

                  {/* Top-level Answer Input */}
                  <div className="px-5 py-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a reply..."
                      value={answerInput[post.id] || ""}
                      onChange={(e) =>
                        setAnswerInput((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAnswer(post.id);
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-white/20 border border-white/25 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-transparent backdrop-blur-sm placeholder:text-primary/35 transition-all duration-300"
                    />
                    <button
                      onClick={() => handleAnswer(post.id)}
                      className="px-3 py-2 bg-gradient-to-r from-secondary to-secondary-dark text-white rounded-lg hover:brightness-110 transition-all duration-300"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
