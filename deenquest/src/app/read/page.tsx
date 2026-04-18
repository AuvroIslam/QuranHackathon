"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, BookOpen, Loader2, ScrollText } from "lucide-react";
import toast from "react-hot-toast";

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  translated_name: { name: string };
}

interface Verse {
  id: number;
  verse_key: string;
  verse_number: number;
  text_uthmani: string;
  translations: { text: string }[];
}

interface TafsirEntry {
  verse_key: string;
  text: string;
}

async function fetchProxy(path: string, params: Record<string, string> = {}) {
  const q = new URLSearchParams({ path, ...params });
  const res = await fetch(`/api/quran?${q}`);
  if (!res.ok) throw new Error(`QF API error ${res.status}`);
  return res.json();
}

export default function ReadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [search, setSearch] = useState("");
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [tafsirMap, setTafsirMap] = useState<Record<string, string>>({});
  const [showTafsir, setShowTafsir] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [loadingTafsir, setLoadingTafsir] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    fetchProxy("chapters", { language: "en" })
      .then((d) => setChapters(d.chapters ?? []))
      .catch(() => toast.error("Failed to load chapters"))
      .finally(() => setLoadingChapters(false));
  }, []);

  const loadChapter = useCallback(async (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setVerses([]);
    setTafsirMap({});
    setShowTafsir(false);
    setLoadingVerses(true);
    try {
      const data = await fetchProxy(`verses/by_chapter/${chapter.id}`, {
        translations: "131",
        fields: "text_uthmani",
        per_page: "300",
      });
      setVerses(data.verses ?? []);
    } catch {
      toast.error("Failed to load verses");
    }
    setLoadingVerses(false);
  }, []);

  async function loadTafsir() {
    if (!selectedChapter) return;
    setLoadingTafsir(true);
    try {
      const data = await fetchProxy(`tafsirs/169/by_chapter/${selectedChapter.id}`);
      const map: Record<string, string> = {};
      (data.tafsirs ?? []).forEach((t: TafsirEntry) => {
        // Strip HTML tags from tafsir text
        map[t.verse_key] = t.text.replace(/<[^>]+>/g, "").trim();
      });
      setTafsirMap(map);
      setShowTafsir(true);
    } catch {
      toast.error("Failed to load tafsir");
    }
    setLoadingTafsir(false);
  }

  const filtered = chapters.filter(
    (c) =>
      c.name_simple.toLowerCase().includes(search.toLowerCase()) ||
      c.translated_name?.name?.toLowerCase().includes(search.toLowerCase()) ||
      String(c.id).includes(search)
  );

  const currentIndex = chapters.findIndex((c) => c.id === selectedChapter?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-secondary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-screen md:h-[calc(100vh)] overflow-hidden">
      {/* Surah sidebar */}
      <aside className="w-72 shrink-0 flex flex-col border-r border-white/10 bg-black/20 backdrop-blur-sm overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-white">Quran Reader</h2>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search surah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/15 rounded-lg text-xs text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingChapters ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-secondary" size={20} />
            </div>
          ) : (
            filtered.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => loadChapter(chapter)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-white/5 hover:bg-white/10 ${
                  selectedChapter?.id === chapter.id ? "bg-accent/15 border-l-2 border-l-accent" : ""
                }`}
              >
                <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                  {chapter.id}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{chapter.name_simple}</p>
                  <p className="text-xs text-white/45 truncate">{chapter.translated_name?.name}</p>
                </div>
                <span className="text-xs text-white/30 ml-auto shrink-0">{chapter.name_arabic}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main reader */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {!selectedChapter ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center mb-4">
              <ScrollText size={28} className="text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Select a Surah</h2>
            <p className="text-sm text-white/50 max-w-sm">
              Choose any of the 114 surahs from the sidebar to begin reading with translation and tafsir.
            </p>
          </div>
        ) : (
          <>
            {/* Chapter header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4 bg-black/10 backdrop-blur-sm">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white">{selectedChapter.name_simple}</h2>
                  <span className="text-white/40 text-sm">·</span>
                  <span className="text-sm text-white/60">{selectedChapter.translated_name?.name}</span>
                  <span className="text-xs text-white/30 bg-white/10 px-2 py-0.5 rounded-full">
                    {selectedChapter.verses_count} verses
                  </span>
                </div>
                <p className="text-lg font-arabic text-accent/80 mt-0.5">{selectedChapter.name_arabic}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    if (showTafsir) { setShowTafsir(false); return; }
                    if (Object.keys(tafsirMap).length > 0) { setShowTafsir(true); return; }
                    loadTafsir();
                  }}
                  disabled={loadingTafsir}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    showTafsir ? "bg-accent/30 text-accent" : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  {loadingTafsir ? <Loader2 size={12} className="animate-spin" /> : <ScrollText size={12} />}
                  {showTafsir ? "Hide Tafsir" : "Show Tafsir"}
                </button>

                <button
                  disabled={currentIndex <= 0}
                  onClick={() => loadChapter(chapters[currentIndex - 1])}
                  className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={currentIndex >= chapters.length - 1}
                  onClick={() => loadChapter(chapters[currentIndex + 1])}
                  className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Verses */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {loadingVerses ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-secondary" size={28} />
                </div>
              ) : (
                <>
                  {selectedChapter.id !== 9 && (
                    <p className="text-center text-lg font-arabic text-accent/70 py-2">
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                    </p>
                  )}
                  {verses.map((verse) => (
                    <div key={verse.id} className="glass-card rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-secondary bg-accent/15 px-3 py-1 rounded-full">
                          {verse.verse_key}
                        </span>
                        <span className="text-xs text-white/30">Verse {verse.verse_number}</span>
                      </div>

                      <p className="text-right text-2xl leading-loose font-arabic text-primary" dir="rtl" translate="no">
                        {verse.text_uthmani}
                      </p>

                      <p className="text-sm text-white/65 leading-relaxed italic border-t border-white/10 pt-3">
                        &ldquo;{verse.translations?.[0]?.text?.replace(/<[^>]+>/g, "") ?? "Translation unavailable"}&rdquo;
                      </p>

                      {showTafsir && tafsirMap[verse.verse_key] && (
                        <div className="bg-accent/8 border border-accent/20 rounded-xl p-4 mt-2">
                          <p className="text-xs font-semibold text-accent mb-2 flex items-center gap-1.5">
                            <ScrollText size={11} />
                            Ibn Kathir Tafsir
                          </p>
                          <p className="text-xs text-white/60 leading-relaxed line-clamp-6">
                            {tafsirMap[verse.verse_key]}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
