"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { getUserProfile, createUserProfile } from "@/lib/firestore";
import type { UserProfile } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (next?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string, next?: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string, next?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

const PUBLIC_PATHS = ["/login", "/setup", "/auth/qf-start", "/auth/qf-callback"];

/** Returns `next` if it is a safe internal relative path, else "/". */
function sanitizeNext(next: string | undefined | null): string {
  if (!next) return "/";
  // Only accept paths that start with a single `/` (and not `//` which is protocol-relative).
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Where to send the user after a successful login. Set by signInWith*().
  const pendingRedirect = useRef<string | null>(null);

  async function loadProfile(u: User): Promise<UserProfile> {
    let p = await getUserProfile(u.uid);
    if (!p) {
      p = await createUserProfile(u.uid, u.displayName || "User", u.email || "");
    }
    setProfile(p);
    return p;
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          await loadProfile(u);
          // Request FCM permission and register token after login — lazy import
          // keeps firebase/messaging out of the initial bundle.
          import("@/lib/notifications")
            .then(({ initNotifications }) => initNotifications(u.uid))
            .catch(() => {});
        } catch (err) {
          // Firestore offline / permission error — keep auth state, drop loading
          // so the UI can render an error state instead of an infinite spinner.
          console.error("Failed to load profile:", err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Routing reacts to user/profile/pathname — keeps logged-in users off /login
  // and bounces logged-out users to /login from protected paths, even on
  // client-side navigations (the auth listener alone only fires on auth changes).
  useEffect(() => {
    if (loading) return;
    if (user) {
      if (profile && !profile.goalSet && pathname !== "/setup") {
        router.replace("/setup");
        return;
      }
      if (pendingRedirect.current) {
        const dest = sanitizeNext(pendingRedirect.current);
        pendingRedirect.current = null;
        router.replace(dest);
        return;
      }
      if (pathname === "/login") {
        router.replace("/");
      }
    } else {
      if (!PUBLIC_PATHS.includes(pathname)) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    }
  }, [user, profile, pathname, loading, router]);

  async function signInWithGoogle(next?: string) {
    pendingRedirect.current = sanitizeNext(next);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async function signInWithEmail(email: string, password: string, next?: string) {
    pendingRedirect.current = sanitizeNext(next);
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUpWithEmail(email: string, password: string, name: string, next?: string) {
    pendingRedirect.current = sanitizeNext(next);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
  }

  async function signOut() {
    await fbSignOut(auth);
    setProfile(null);
  }

  async function refreshProfile() {
    if (user) await loadProfile(user);
  }

  // Whether the current render is mid-decision: auth still hydrating, or a
  // redirect is about to fire. Rendering `children` in any of these states
  // flashes a protected page (home/login) for a frame before the route
  // changes. Show a neutral loader instead until the destination is settled.
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const redirecting =
    loading ||
    (!user && !isPublic) ||
    (!!user && !!profile && !profile.goalSet && pathname !== "/setup") ||
    (!!user && pathname === "/login");

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshProfile,
      }}
    >
      {redirecting ? (
        <div className="flex items-center justify-center min-h-screen w-full">
          <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
