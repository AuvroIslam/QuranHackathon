"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Daily-mode switching now lives in the Profile panel (open it from the
// sidebar). This route is kept only so old links / bookmarks don't 404 —
// it just sends the user back home.
export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
