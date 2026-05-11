"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "../../components/PageContainer";
import AyahCard from "@/components/AyahCard";
import { searchAyahs } from "@/lib/quran";
import { Loader2 } from "lucide-react";
import { toggleBookmark, getBookmarks } from "@/lib/firestore";
import { getQFAccessToken } from "@/lib/qf-user-auth";

function syncQFBookmark(verseKey: string, nowBookmarked: boolean) {
  const token = getQFAccessToken();
  if (!token) return;
  const [chapterStr, verseStr] = verseKey.split(":");
  const chapterNumber = parseInt(chapterStr, 10);
  const verseNumber = parseInt(verseStr, 10);
  if (!chapterNumber || !verseNumber) return;
  fetch("/api/qf/bookmark", {
    method: nowBookmarked ? "POST" : "DELETE",
    headers: { "x-qf-token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ chapterNumber, verseNumber }),
  }).catch(() => {});
}

const TOPICS = [
  "Patience",
  "Justice",
  "Mercy",
  "Women",
  "Prayer",
  "Charity",
  "Forgiveness",
  "Knowledge",
  "Family",
  "Gratitude",
  "Faith",
  "Truthfulness",
];

interface DawahSections {
  quranView: string;
  scriptures: ScriptureEntry[];
  ummahReasoning: string;
}

interface ScriptureEntry {
  scriptureName: string;
  quote: string;
  reference: string;
  explanation: string;
}

function parseDawahSections(raw: string): DawahSections {
  const clean = raw.trim();

  const fallback: DawahSections = {
    quranView: clean || "No Quranic summary generated yet.",
    scriptures: [],
    ummahReasoning: "Could not parse the ummah-focused reasoning. Please retry.",
  };

  if (!clean) return fallback;

  const fenced = clean.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] || clean).trim();
  const jsonMatch = candidate.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return fallback;

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    const parsedScriptures: ScriptureEntry[] = Array.isArray(parsed?.scriptures)
      ? parsed.scriptures
          .map((entry: any) => ({
            scriptureName: typeof entry?.scriptureName === "string" ? entry.scriptureName.trim() : "",
            quote: typeof entry?.quote === "string" ? entry.quote.trim().replace(/^'+|'+$/g, "") : "",
            reference: typeof entry?.reference === "string" ? entry.reference.trim() : "",
            explanation: typeof entry?.explanation === "string" ? entry.explanation.trim() : "",
          }))
          .filter((entry: ScriptureEntry) => entry.scriptureName && entry.quote && entry.reference)
      : [];

    if (
      typeof parsed?.quranView === "string" &&
      typeof parsed?.ummahReasoning === "string"
    ) {
      return {
        quranView: parsed.quranView.trim(),
        scriptures: parsedScriptures,
        ummahReasoning: parsed.ummahReasoning.trim(),
      };
    }
  } catch {
    return fallback;
  }

  return fallback;
}

const DAWAH_STORAGE_KEY = "deenquest_dawah_state";

function loadDawahState() {
  if (typeof window === "undefined") return null;
  try {
    const saved = sessionStorage.getItem(DAWAH_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

export default function DawahPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const saved = loadDawahState();
  const [selectedTopic, setSelectedTopic] = useState(saved?.selectedTopic ?? "");
  const [ayahs, setAyahs] = useState<any[]>(saved?.ayahs ?? []);
  const [searching, setSearching] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [quranView, setQuranView] = useState(saved?.quranView ?? "");
  const [scriptures, setScriptures] = useState<ScriptureEntry[]>(saved?.scriptures ?? []);
  const [ummahReasoning, setUmmahReasoning] = useState(saved?.ummahReasoning ?? "");
  const [bookmarkedKeys, setBookmarkedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    getBookmarks(user.uid).then((bms) => {
      setBookmarkedKeys(new Set(bms.map((b: any) => b.verseKey as string)));
    }).catch(() => {});
  }, [user]);

  const handleBookmark = useCallback(async (ayah: any) => {
    if (!user) return;
    const result = await toggleBookmark(user.uid, {
      verseKey: ayah.verseKey,
      surahNumber: ayah.surah?.number ?? parseInt(ayah.verseKey?.split(":")[0], 10),
      ayahNumber: ayah.numberInSurah,
      arabic: ayah.text,
      translation: ayah.translation,
    });
    setBookmarkedKeys((prev) => {
      const next = new Set(prev);
      if (result) next.add(ayah.verseKey);
      else next.delete(ayah.verseKey);
      return next;
    });
    syncQFBookmark(ayah.verseKey, result);
  }, [user]);

  useEffect(() => {
    if (!selectedTopic) return;
    try {
      sessionStorage.setItem(DAWAH_STORAGE_KEY, JSON.stringify({ selectedTopic, ayahs, quranView, scriptures, ummahReasoning }));
    } catch { }
  }, [selectedTopic, ayahs, quranView, scriptures, ummahReasoning]);

  async function handleTopicSelect(topic: string) {
    setSelectedTopic(topic);
    setSearching(true);
    setQuranView("");
    setScriptures([]);
    setUmmahReasoning("");

    try {
      const results = await searchAyahs(topic);
      setAyahs(results);

      const verseSummary = results
        .slice(0, 3)
        .map((r: any) => `${r.surah.englishName} ${r.numberInSurah}: "${r.translation}"`)
        .join("\n");

      const verseContext = verseSummary
        ? `Use these relevant Quran verses as primary grounding:\n${verseSummary}`
        : "No direct verse search results were found; use well-known Quranic principles and accurate references.";

      const response = await fetch("/api/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerMode: "dawah",
          groundingQuery: topic,
          messages: [
            {
              role: "user",
              content: `Topic: "${topic}"\n\n${verseContext}\n\nRespond with ONLY a raw JSON object. No markdown fences, no explanation outside the JSON.\n\nLimits per field:\n- quranView: 2-3 sentences, max 500 chars, include 1-2 ayah refs\n- Each scripture quote: max 150 chars. If translation is uncertain, end with " (translation may vary)" — do NOT wrap the quote in single quotes\n- Each scripture explanation: 2-3 sentences, max 220 chars\n- ummahReasoning: 3-4 sentences, max 500 chars\n- Exactly 3 scriptures: Bible, Bhagavad Gita, Torah\n\nShape:\n{"quranView":"...","scriptures":[{"scriptureName":"...","quote":"...","reference":"...","explanation":"..."}],"ummahReasoning":"..."}\n\nCritical: every string must be a complete sentence. Never cut off mid-word or mid-sentence.`,
            },
          ],
          systemPrompt:
            "You are a respectful Islamic dawah educator. Always return only raw valid JSON — no markdown, no prose outside the JSON. Compare scriptures fairly, keep tone non-inflammatory, cite Quranic references accurately, and never use derogatory language about any faith.",
        }),
      });

      const data = await response.json();
      const sections = parseDawahSections(data.content || "");
      setQuranView(sections.quranView);
      setScriptures(sections.scriptures);
      setUmmahReasoning(sections.ummahReasoning);
    } catch {
      setAyahs([]);
      setQuranView("Unable to generate a Quranic summary right now. Please try again.");
      setScriptures([]);
      setUmmahReasoning("Unable to generate the ummah-focused reasoning right now.");
    } finally {
      setSearching(false);
    }
  }

  function handleCustomSearch(e: React.FormEvent) {
    e.preventDefault();
    if (customTopic.trim()) {
      void handleTopicSelect(customTopic.trim());
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageContainer
      size="default"
      className="space-y-8"
      tooltipTitle="Dawah"
      tooltipDescription={[
        "Choose a topic and view Quranic guidance with respectful comparison.",
        "Read how other scriptures approach the topic at a high level.",
        "Understand why Quranic reasoning is strongest for the ummah.",
      ]}
    >
      <div>
        <h1 className="text-2xl font-bold text-primary">Dawah Perspectives</h1>
        <p className="text-primary/50 mt-1">
          Explore Quranic guidance and respectful cross-scripture comparison
        </p>
      </div>

      <div className="glass-strong rounded-2xl p-7">
        <h3 className="text-sm font-medium text-primary/70 mb-3">Choose a topic for dawah</h3>

        <div className="flex flex-wrap gap-2">
          {TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => handleTopicSelect(topic)}
              disabled={searching}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all disabled:opacity-50 backdrop-blur-sm ${
                selectedTopic === topic
                  ? "bg-[rgba(108,36,112,0.72)] border-accent/40 text-accent ring-1 ring-accent/45 scale-105 shadow-md shadow-secondary/20"
                  : "bg-white/20 text-primary/70 border-white/25 hover:bg-white/35"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <p className="text-xs text-primary/45 mb-2">Or describe any topic for dawah comparison</p>
          <form onSubmit={handleCustomSearch} className="flex flex-col gap-2">
            <div className="flex-1">
              <textarea
                placeholder="Or describe any topic for dawah comparison..."
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                disabled={searching}
                rows={3}
                className="w-full px-4 py-2.5 bg-white/25 border border-white/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/30 disabled:opacity-50 placeholder:text-primary/35 transition-all duration-300 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !customTopic.trim()}
              className="self-end px-5 py-2.5 bg-linear-to-r from-secondary to-secondary-dark text-white rounded-xl text-sm font-medium hover:brightness-110 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-secondary/20"
            >
              Explore
            </button>
          </form>
        </div>
      </div>

      {searching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-secondary" />
        </div>
      )}

      {selectedTopic && !searching && (
        <div className="space-y-4">
          {ayahs.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-primary">Related Ayahs ({ayahs.length})</h3>
              {ayahs.map((ayah: any, i: number) => (
                <AyahCard
                  key={i}
                  text={ayah.text}
                  translation={ayah.translation}
                  surahName={ayah.surah.englishName}
                  ayahNumber={ayah.number}
                  numberInSurah={ayah.numberInSurah}
                  verseKey={ayah.verseKey}
                  showAudio={false}
                  bookmarked={bookmarkedKeys.has(ayah.verseKey)}
                  onBookmark={() => handleBookmark(ayah)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-primary/50 py-2">
              No direct ayah search results found, but comparative guidance is shown below.
            </p>
          )}

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-secondary mb-2">What Quran Says{selectedTopic ? ` about \"${selectedTopic}\"` : ""}</h3>
            <p className="text-sm text-primary/75 leading-relaxed whitespace-pre-wrap">{quranView}</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-secondary mb-2">What Other Scriptures Say</h3>
            {scriptures.length > 0 ? (
              <div className="space-y-3 mt-3">
                {scriptures.map((entry, index) => (
                  <div
                    key={`${entry.scriptureName}-${index}`}
                    className="rounded-xl border border-white/15 bg-[rgba(20,20,40,0.64)] p-4"
                  >
                    <h4 className="text-sm font-semibold text-secondary">{entry.scriptureName}</h4>
                    <p className="text-sm text-primary/75 leading-relaxed mt-2">&ldquo;{entry.quote}&rdquo;</p>
                    <p className="text-xs text-accent mt-2">Reference: {entry.reference}</p>
                    <p className="text-sm text-primary/60 leading-relaxed mt-2">{entry.explanation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-primary/60">No scripture-by-scripture entries generated yet. Please try again.</p>
            )}
          </div>

          <div className="rounded-2xl border border-accent/40 ring-1 ring-accent/35 bg-[rgba(108,36,112,0.72)] shadow-lg shadow-secondary/20 p-6">
            <h3 className="text-lg font-extrabold text-white mb-3 pb-2 border-b border-accent/50">Why Quranic Reasoning is Stronger for the Ummah</h3>
            <p className="text-sm text-primary/75 leading-relaxed whitespace-pre-wrap">{ummahReasoning}</p>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
