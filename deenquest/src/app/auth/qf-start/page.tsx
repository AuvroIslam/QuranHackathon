"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { initiateQFOAuth, setOAuthMeta } from "@/lib/qf-user-auth";

function QFStartHandler() {
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const from = searchParams.get("from") ?? "web";
    const uid = searchParams.get("uid") ?? "";

    if (from && uid) {
      setOAuthMeta(from, uid);
    }

    initiateQFOAuth().catch(console.error);
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="glass-card rounded-2xl p-8 text-center max-w-sm w-full mx-4">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-primary font-medium">Redirecting to Quran.com…</p>
        <p className="text-primary/50 text-sm mt-2">
          You&apos;ll be taken to Quran.com to authorise DeenQuest.
        </p>
      </div>
    </div>
  );
}

export default function QFStartPage() {
  return (
    <Suspense>
      <QFStartHandler />
    </Suspense>
  );
}
