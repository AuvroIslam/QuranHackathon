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
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-500 mt-1">Share reflections and ask questions</p>
        </div>
        <button
          onClick={() => setShowNewPost(!showNewPost)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          {showNewPost ? <X size={16} /> : <Plus size={16} />}
          {showNewPost ? "Cancel" : "New Post"}
        </button>
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <form
          onSubmit={handleCreatePost}
          className="bg-white rounded-xl border border-gray-100 p-6 space-y-4"
        >
          <div className="flex gap-2">
            {(["question", "reflection"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setNewType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  newType === type
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
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
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none"
          />
          <button
            type="submit"
            disabled={submitting || !newContent.trim() || !newTitle.trim()}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post"}
          </button>
        </form>
      )}

      {/* Posts */}
      {loadingPosts ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-semibold">
                    {post.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{post.userName}</p>
                    <p className="text-xs text-gray-400">
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
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{post.title}</h3>
                )}
                <p className="text-sm text-gray-800 leading-relaxed">{post.content}</p>

                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={() => handleUpvote(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      user && post.upvotedBy.includes(user.uid)
                        ? "text-emerald-600"
                        : "text-gray-400 hover:text-emerald-600"
                    }`}
                  >
                    <ThumbsUp size={16} />
                    {post.upvotes}
                  </button>
                  <button
                    onClick={() => toggleExpand(post.id)}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
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
                <div className="border-t border-gray-50 bg-gray-50/50">
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
                            className={`px-5 py-4 border-b border-gray-100 last:border-0`}
                            style={{ paddingLeft: `${20 + depth * 24}px` }}
                          >
                            {depth > 0 && (
                              <div className="absolute left-0 top-0 bottom-0 w-px bg-emerald-200" />
                            )}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-semibold">
                                {answer.userName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-medium text-gray-700">
                                {answer.userName}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(answer.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {answer.replyToName && (
                              <p className="text-xs text-emerald-600 ml-8 mb-1">
                                Replying to {answer.replyToName}
                              </p>
                            )}
                            <p className="text-sm text-gray-700 ml-8">{answer.content}</p>
                            <div className="flex items-center gap-3 mt-2 ml-8">
                              <button
                                onClick={() => handleAnswerUpvote(answer.id, post.id)}
                                className={`flex items-center gap-1 text-xs transition-colors ${
                                  user && answer.upvotedBy.includes(user.uid)
                                    ? "text-emerald-600"
                                    : "text-gray-400 hover:text-emerald-600"
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
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors"
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
                                  className="flex-1 px-3 py-1.5 border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white"
                                />
                                <button
                                  onClick={() => handleAnswer(post.id, answer.id, answer.userName)}
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleAnswer(post.id)}
                      className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
