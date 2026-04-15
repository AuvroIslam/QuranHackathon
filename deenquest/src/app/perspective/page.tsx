"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quranic Perspectives</h1>
        <p className="text-gray-500 mt-1">
          Explore what the Quran says about different topics
        </p>
      </div>

      {/* Topic Pills */}
      <div className="flex flex-wrap gap-2">
        {TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() => handleTopicSelect(topic)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              selectedTopic === topic
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
            }`}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Custom Search */}
      <form onSubmit={handleCustomSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Or search any topic..."
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          Explore
        </button>
      </form>

      {/* Loading */}
      {searching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-emerald-600" />
        </div>
      )}

      {/* AI Perspective */}
      {explanation && !searching && (
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-6">
          <h3 className="font-semibold text-emerald-800 mb-2">
            Quranic Perspective on &ldquo;{selectedTopic}&rdquo;
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{explanation}</p>
        </div>
      )}

      {/* Results */}
      {ayahs.length > 0 && !searching && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">
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
        <p className="text-center text-gray-500 py-8">
          No matching ayahs found. Try a different topic.
        </p>
      )}
    </div>
  );
}
