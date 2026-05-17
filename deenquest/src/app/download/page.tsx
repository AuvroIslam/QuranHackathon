import Link from "next/link";
import Image from "next/image";
import { BookOpen, Flame, Zap, Star } from "lucide-react";

// Material Design Android robot (24×24) — clean, full-body, no clipping
function AndroidLogo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zm-2.5-1c.83 0 1.5-.67 1.5-1.5v-5c0-.83-.67-1.5-1.5-1.5S2 9.67 2 10.5v5c0 .83.67 1.5 1.5 1.5zm17 0c.83 0 1.5-.67 1.5-1.5v-5c0-.83-.67-1.5-1.5-1.5S19 9.67 19 10.5v5c0 .83.67 1.5 1.5 1.5zM15.53 2.16l1.3-1.3c.2-.19.2-.51 0-.7-.19-.19-.51-.19-.7 0l-1.52 1.52C14.02 1.52 13.06 1.3 12 1.3c-1.05 0-2.02.22-2.6.38L7.87.16c-.19-.19-.51-.19-.7 0-.19.19-.19.51 0 .7l1.3 1.3C6.9 3.08 6 4.96 6 7h12c0-2.04-.9-3.92-2.47-4.84zM10 5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  );
}

function AppleLogo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

export const metadata = {
  title: "Download DeenQuest",
  description: "Get the DeenQuest mobile app — your daily Quran companion on Android and iOS.",
};

const APK_URL =
  "https://github.com/AuvroIslam/QuranHackathon/releases/latest/download/deenquest.apk";

const FEATURES = [
  { icon: BookOpen, label: "114 Surahs with audio" },
  { icon: Flame,    label: "Daily streaks & XP" },
  { icon: Zap,      label: "AI Islamic guidance" },
  { icon: Star,     label: "Quran.com sync" },
];

export default function DownloadPage() {
  return (
    <div className="min-h-screen relative">
      {/* Background blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -top-40 -left-40 w-120 h-120 rounded-full bg-secondary/20 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-100 h-100 rounded-full bg-accent/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-85 h-85 rounded-full bg-secondary/10 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="flex justify-center mb-6">
            <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl shadow-secondary/40 ring-2 ring-white/15">
              <Image
                src="/deenQuestLogo.png"
                alt="DeenQuest"
                width={112}
                height={112}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-3">
            Get DeenQuest
          </h1>
          <p className="text-white/55 text-base max-w-xs mx-auto leading-relaxed">
            Your daily Quran companion, now on mobile.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2.5 mt-6">
            {FEATURES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass border border-white/10 text-white/70 text-xs font-medium"
              >
                <Icon size={13} className="text-accent" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Platform cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Android card */}
          <div className="glass-card rounded-2xl p-7 flex flex-col items-center text-center gap-5 border border-white/10 hover:border-accent/30 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-[#3DDC84]/15 flex items-center justify-center ring-1 ring-[#3DDC84]/30">
              <AndroidLogo size={36} className="text-[#3DDC84]" />
            </div>

            <div>
              <h2 className="font-heading text-xl font-semibold text-white mb-1">Android</h2>
              <p className="text-white/50 text-sm">APK · v1.0 · Free</p>
            </div>

            <ul className="text-sm text-white/55 space-y-1.5 self-stretch text-left">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC84] shrink-0" />
                Android 8.0+
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC84] shrink-0" />
                Enable &ldquo;Install unknown apps&rdquo; in Settings
              </li>
            </ul>

            <a
              href={APK_URL}
              download
              className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl bg-[#3DDC84]/20 hover:bg-[#3DDC84]/30 border border-[#3DDC84]/40 text-[#3DDC84] font-semibold text-sm transition-all active:scale-95"
              aria-label="Download DeenQuest APK for Android"
            >
              <AndroidLogo size={16} />
              Download APK
            </a>

            <p className="text-xs text-white/30 leading-relaxed">
              Direct GitHub release download.{" "}
              <a
                href="https://github.com/AuvroIslam/QuranHackathon/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent/60 hover:text-accent underline underline-offset-2 transition-colors"
              >
                View all releases
              </a>
            </p>
          </div>

          {/* iOS card */}
          <div className="glass-card rounded-2xl p-7 flex flex-col items-center text-center gap-5 border border-white/10 opacity-75">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center ring-1 ring-white/20">
              <AppleLogo size={36} className="text-white/70" />
            </div>

            <div>
              <h2 className="font-heading text-xl font-semibold text-white mb-2">iPhone</h2>
              <span className="inline-block px-3 py-1 rounded-full bg-accent/15 border border-accent/25 text-accent text-xs font-semibold tracking-wide">
                Coming Soon
              </span>
            </div>

            <ul className="text-sm text-white/40 space-y-1.5 self-stretch text-left">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
                iOS 16+
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
                App Store distribution
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
                In review
              </li>
            </ul>

            <div
              aria-disabled="true"
              className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl bg-white/5 border border-white/10 text-white/30 font-semibold text-sm cursor-not-allowed select-none"
            >
              <AppleLogo size={16} className="opacity-50" />
              App Store — Soon
            </div>

            <p className="text-xs text-white/25 leading-relaxed">
              iOS release is in progress. Use the{" "}
              <a
                href="https://quran-hackathon-omega.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent/50 hover:text-accent underline underline-offset-2 transition-colors"
              >
                web app
              </a>{" "}
              in the meantime.
            </p>
          </div>
        </div>

        {/* Web fallback nudge */}
        <p className="text-center text-sm text-white/35 mt-10">
          Prefer not to download?{" "}
          <Link href="/" className="text-accent/70 hover:text-accent underline underline-offset-2 transition-colors">
            Use the web app instead
          </Link>
        </p>
      </div>
    </div>
  );
}
