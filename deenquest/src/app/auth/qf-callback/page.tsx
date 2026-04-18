"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  setQFSession,
  getStoredVerifier,
  getStoredState,
  clearOAuthStorage,
} from "@/lib/qf-user-auth";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Connecting your Quran.com account…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function handle() {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error || !code) {
        setStatus("Connection cancelled.");
        setTimeout(() => router.push("/"), 1500);
        return;
      }

      if (state !== getStoredState()) {
        setStatus("Security check failed. Please try again.");
        setTimeout(() => router.push("/"), 1500);
        return;
      }

      const verifier = getStoredVerifier();
      if (!verifier) {
        setStatus("Session expired. Please try again.");
        setTimeout(() => router.push("/"), 1500);
        return;
      }

      try {
        const res = await fetch("/api/qf/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            codeVerifier: verifier,
            redirectUri: `${window.location.origin}/auth/qf-callback`,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error("[QF callback] token exchange failed:", data);
          throw new Error(data?.error || "Token exchange failed");
        }

        const accessToken = typeof data.access_token === "string" ? data.access_token : null;
        const refreshToken = typeof data.refresh_token === "string" ? data.refresh_token : "";
        const expiresIn = typeof data.expires_in === "number" && data.expires_in > 0
          ? data.expires_in
          : 3600;

        if (!accessToken) throw new Error("No access token in response");

        setQFSession(accessToken, refreshToken, expiresIn);
        clearOAuthStorage();
        setStatus("Quran.com account connected!");
        setTimeout(() => router.push("/"), 1200);
      } catch (err) {
        console.error("[QF callback] error:", err);
        setStatus("Connection failed. Please try again.");
        clearOAuthStorage();
        setTimeout(() => router.push("/"), 2000);
      }
    }

    handle();
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="glass-card rounded-2xl p-8 text-center max-w-sm w-full mx-4">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-primary font-medium">{status}</p>
        <p className="text-primary/50 text-sm mt-2">You&apos;ll be redirected shortly.</p>
      </div>
    </div>
  );
}

export default function QFCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
