"use client";

import { useEffect, useRef, useState } from "react";
import { CircleHelp } from "lucide-react";

interface PageTooltipProps {
  title: string;
  description: string[];
}

export default function PageTooltip({ title, description }: PageTooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent | TouchEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick, { passive: true });
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative hidden md:inline-flex z-50">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Open help for ${title}`}
        aria-expanded={open}
        className="relative z-50 h-10 w-10 rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md shadow-lg transition-all duration-200 hover:scale-105 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        <CircleHelp size={18} className="mx-auto" />
      </button>

      <div
        className={`absolute right-0 top-[calc(100%+0.75rem)] z-50 w-72 max-w-[calc(100vw-2rem)] origin-top-right isolate rounded-2xl border border-white/20 bg-[rgba(16,22,57,0.86)] p-4 text-left shadow-2xl backdrop-blur-xl transition-all duration-200 ease-out ${
          open
            ? "pointer-events-auto opacity-100 scale-100"
            : "pointer-events-none opacity-0 scale-95"
        }`}
      >
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
        <ul className="mt-2 space-y-2 text-sm text-primary/75">
          {description.map((item, index) => (
            <li key={`${title}-${index}`} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
