"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BookOpen, Mail, Lock, User } from "lucide-react";
import PageTooltip from "@/components/PageTooltip";

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setError("");
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ backgroundImage: "url('/kaaba-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* Dark overlay for readability */}
      <div className="overlay" />

      <div className="absolute right-4 top-4 z-40">
        <PageTooltip
          title="Login"
          description={[
            "Sign in or create an account to begin your Quran journey.",
            "Use Google or email to access your personalized progress.",
            "After login, you can track streaks, tasks, and reflections.",
          ]}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white tracking-wide">DeenQuest AI</h1>
          <p className="text-white/75 mt-2">Your Journey Back to the Quran</p>
        </div>

        <div className="glass rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>

          <button
            onClick={handleGoogle}
            className="glass-btn w-full flex items-center justify-center gap-3 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/15" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white/5 backdrop-blur-sm px-4 text-white/40">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 placeholder:text-white/40 transition-all duration-300"
                />
              </div>
            )}
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 placeholder:text-white/40 transition-all duration-300"
              />
            </div>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 placeholder:text-white/40 transition-all duration-300"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="glass-btn w-full py-3 disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : isSignUp
                ? "Create account"
                : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-white/50 mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-accent font-medium hover:text-accent/80 transition-colors"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
