"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "../../components/PageContainer";
import AyahCard from "@/components/AyahCard";
import { getRandomAyah, searchAyahs } from "@/lib/quran";
import { toggleBookmark, getBookmarks } from "@/lib/firestore";
import { RefreshCw, Search } from "lucide-react";
import toast from "react-hot-toast";

export default function AyahPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ayah, setAyah] = useState<any>(null);
  const [loadingAyah, setLoadingAyah] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    loadRandomAyah();
    if (user) {
      getBookmarks(user.uid).then((b) => setBookmarks(new Set(b)));
    }
  }, [user]);

  async function loadRandomAyah() {
    setLoadingAyah(true);
    try {
      const data = await getRandomAyah();
      setAyah(data);
    } catch {
      toast.error("Failed to load ayah");
    }
    setLoadingAyah(false);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchAyahs(searchQuery);
      setSearchResults(results);
      if (results.length === 0) toast("No results found");
    } catch {
      toast.error("Search failed");
    }
    setSearching(false);
  }

  async function handleBookmark(ayahKey: string) {
    if (!user) return;
    const bookmarked = await toggleBookmark(user.uid, ayahKey);
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (bookmarked) next.add(ayahKey);
      else next.delete(ayahKey);
      return next;
    });
    toast.success(bookmarked ? "Bookmarked" : "Bookmark removed");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageContainer size="default" className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Explore Ayahs</h1>
          <p className="text-primary/50 mt-1">Discover the words of Allah</p>
        </div>
        <button
          onClick={loadRandomAyah}
          disabled={loadingAyah}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-secondary to-secondary-dark text-white rounded-xl text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-secondary/20"
        >
          <RefreshCw size={16} className={loadingAyah ? "animate-spin" : ""} />
          Random Ayah
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/35" />
          <input
            type="text"
            placeholder="Search by keyword (e.g., patience, mercy, prayer)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/25 border border-white/30 rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/30 backdrop-blur-sm placeholder:text-primary/35"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-6 py-3 bg-gradient-to-r from-secondary to-secondary-dark text-white rounded-xl text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-secondary/20"
        >
          {searching ? "..." : "Search"}
        </button>
      </form>

      {/* Random Ayah */}
      {loadingAyah ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        ayah && (
          <AyahCard
            text={ayah.text}
            translation={ayah.translation}
            surahName={ayah.surah.englishName}
            ayahNumber={ayah.number}
            numberInSurah={ayah.numberInSurah}
            verseKey={ayah.verseKey}
            bookmarked={bookmarks.has(`${ayah.surah.number}:${ayah.numberInSurah}`)}
            onBookmark={() => handleBookmark(`${ayah.surah.number}:${ayah.numberInSurah}`)}
          />
        )
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-primary">
            Search Results ({searchResults.length})
          </h3>
          {searchResults.map((result: any, i: number) => (
            <AyahCard
              key={i}
              text={result.text}
              translation={result.translation}
              surahName={result.surah.englishName}
              ayahNumber={result.number}
              numberInSurah={result.numberInSurah}
              verseKey={result.verseKey}
              bookmarked={bookmarks.has(`${result.surah.number}:${result.numberInSurah}`)}
              onBookmark={() =>
                handleBookmark(`${result.surah.number}:${result.numberInSurah}`)
              }
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
