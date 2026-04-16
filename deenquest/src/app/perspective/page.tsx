"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "../../components/PageContainer";
import AyahCard from "@/components/AyahCard";
import { searchAyahs } from "@/lib/quran";
import { Search, Loader2 } from "lucide-react";

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

export default function PerspectivePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState("");
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [explanation, setExplanation] = useState("");
  const [searching, setSearching] = useState(false);
  const [customTopic, setCustomTopic] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  async function handleTopicSelect(topic: string) {
    setSelectedTopic(topic);
    setSearching(true);
    setExplanation("");
    try {
      const results = await searchAyahs(topic);
      setAyahs(results);

      if (results.length > 0) {
        const verseSummary = results
          .slice(0, 3)
          .map(
            (r: any) =>
              `${r.surah.englishName} ${r.numberInSurah}: "${r.translation}"`
          )
          .join("\n");

        fetch("/api/deepseek", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Provide a comprehensive Islamic perspective on "${topic}" based on these Quranic verses:\n${verseSummary}\n\nGive a cohesive explanation of the Quran's perspective on this topic. Keep it under 200 words.`,
              },
            ],
            systemPrompt: `You are an Islamic scholar providing the Quranic perspective on various topics. Be scholarly, balanced, and reference specific verses. Keep responses concise and meaningful.`,
          }),
        })
          .then((r) => r.json())
          .then((data) => setExplanation(data.content || ""))
          .catch(() => {});
      }
    } catch {
      setAyahs([]);
    }
    setSearching(false);
  }

  function handleCustomSearch(e: React.FormEvent) {
    e.preventDefault();
    if (customTopic.trim()) {
      handleTopicSelect(customTopic.trim());
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
    <PageContainer size="default" className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Quranic Perspectives</h1>
        <p className="text-primary/50 mt-1">
          Explore what the Quran says about different topics
        </p>
      </div>

      {/* Topic Pills */}
      <div className="flex flex-wrap gap-2">
        {TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() => handleTopicSelect(topic)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all backdrop-blur-sm ${
              selectedTopic === topic
                ? "bg-gradient-to-r from-secondary to-secondary-dark text-white border-secondary shadow-lg shadow-secondary/20"
                : "bg-white/25 text-primary/70 border-white/30 hover:border-accent/30 hover:bg-accent/8"
            }`}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Custom Search */}
      <form onSubmit={handleCustomSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/35" />
          <input
            type="text"
            placeholder="Or search any topic..."
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/25 border border-white/30 rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/30 backdrop-blur-sm placeholder:text-primary/35"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-6 py-3 bg-gradient-to-r from-secondary to-secondary-dark text-white rounded-xl text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-secondary/20"
        >
          Explore
        </button>
      </form>

      {/* Loading */}
      {searching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-secondary" />
        </div>
      )}

      {/* AI Perspective */}
      {explanation && !searching && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-secondary mb-2">
            Quranic Perspective on &ldquo;{selectedTopic}&rdquo;
          </h3>
          <p className="text-sm text-primary/75 leading-relaxed whitespace-pre-wrap">{explanation}</p>
        </div>
      )}

      {/* Results */}
      {ayahs.length > 0 && !searching && (
        <div className="space-y-4">
          <h3 className="font-semibold text-primary">
            Related Ayahs ({ayahs.length})
          </h3>
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
            />
          ))}
        </div>
      )}

      {selectedTopic && ayahs.length === 0 && !searching && (
        <p className="text-center text-primary/50 py-8">
          No matching ayahs found. Try a different topic.
        </p>
      )}
    </PageContainer>
  );
}
