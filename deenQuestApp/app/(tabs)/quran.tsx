import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Search, ChevronLeft, BookOpen } from "lucide-react-native";
import { fetchSurahList, fetchVerses } from "../../lib/api";

interface Surah {
  id: number;
  name_simple: string;
  name_arabic: string;
  translated_name: { name: string };
  verses_count: number;
  revelation_place: string;
}

interface Verse {
  id: number;
  verse_key: string;
  text_uthmani: string;
  translations: { text: string }[];
}

export default function QuranScreen() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [filtered, setFiltered] = useState<Surah[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Surah | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loadingSurahs, setLoadingSurahs] = useState(true);
  const [loadingVerses, setLoadingVerses] = useState(false);

  useEffect(() => {
    fetchSurahList()
      .then((d) => {
        const list: Surah[] = d.chapters || [];
        setSurahs(list);
        setFiltered(list);
      })
      .finally(() => setLoadingSurahs(false));
  }, []);

  function handleSearch(text: string) {
    setQuery(text);
    const q = text.toLowerCase();
    setFiltered(
      surahs.filter(
        (s) =>
          s.name_simple.toLowerCase().includes(q) ||
          s.translated_name?.name?.toLowerCase().includes(q) ||
          String(s.id).includes(q)
      )
    );
  }

  async function openSurah(surah: Surah) {
    setSelected(surah);
    setVerses([]);
    setLoadingVerses(true);
    try {
      const d = await fetchVerses(surah.id);
      setVerses(d.verses || []);
    } catch {}
    setLoadingVerses(false);
  }

  if (selected) {
    return (
      <LinearGradient colors={["#0F1639", "#15173D", "#1a0a2e"]} style={s.container}>
        <View style={s.verseHeader}>
          <TouchableOpacity onPress={() => { setSelected(null); setVerses([]); }} style={s.backBtn}>
            <ChevronLeft size={22} color="#fff" />
          </TouchableOpacity>
          <View style={s.verseHeaderInfo}>
            <Text style={s.verseHeaderTitle}>{selected.name_simple}</Text>
            <Text style={s.verseHeaderSub}>{selected.translated_name?.name} · {selected.verses_count} verses</Text>
          </View>
          <Text style={s.verseHeaderArabic}>{selected.name_arabic}</Text>
        </View>

        {loadingVerses ? (
          <View style={s.center}>
            <ActivityIndicator color="#E491C9" size="large" />
            <Text style={s.loadingText}>Loading verses…</Text>
          </View>
        ) : (
          <FlatList
            data={verses}
            keyExtractor={(v) => v.verse_key}
            contentContainerStyle={s.verseList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: verse }) => (
              <View style={s.verseCard}>
                <View style={s.verseNumBadge}>
                  <Text style={s.verseNum}>{verse.verse_key.split(":")[1]}</Text>
                </View>
                <Text style={s.verseArabic}>{verse.text_uthmani}</Text>
                <Text style={s.verseTrans}>
                  {verse.translations?.[0]?.text?.replace(/<[^>]*>/g, "") ?? ""}
                </Text>
              </View>
            )}
          />
        )}
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0F1639", "#15173D", "#1a0a2e"]} style={s.container}>
      <View style={s.scroll}>
        <View style={s.header}>
          <Text style={s.title}>Quran</Text>
          <Text style={s.subtitle}>114 Surahs · Noble Quran</Text>
        </View>

        <View style={s.searchBox}>
          <Search size={16} color="rgba(255,255,255,0.35)" style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search surahs…"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={query}
            onChangeText={handleSearch}
          />
        </View>

        {loadingSurahs ? (
          <View style={s.center}>
            <ActivityIndicator color="#E491C9" size="large" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(s) => String(s.id)}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: surah }) => (
              <TouchableOpacity style={s.surahRow} onPress={() => openSurah(surah)} activeOpacity={0.75}>
                <View style={s.surahNum}>
                  <Text style={s.surahNumText}>{surah.id}</Text>
                </View>
                <View style={s.surahInfo}>
                  <Text style={s.surahName}>{surah.name_simple}</Text>
                  <Text style={s.surahMeta}>
                    {surah.translated_name?.name} · {surah.verses_count} verses · {surah.revelation_place}
                  </Text>
                </View>
                <Text style={s.surahArabic}>{surah.name_arabic}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, paddingTop: 56, paddingHorizontal: 20 },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#fff" },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  searchInput: { flex: 1, color: "#fff", fontSize: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  loadingText: { color: "rgba(255,255,255,0.4)", marginTop: 12, fontSize: 13 },
  surahRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, marginBottom: 8, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  surahNum: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(152,37,152,0.3)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  surahNumText: { color: "#E491C9", fontWeight: "700", fontSize: 13 },
  surahInfo: { flex: 1 },
  surahName: { color: "#fff", fontWeight: "600", fontSize: 15 },
  surahMeta: { color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 },
  surahArabic: { color: "rgba(255,255,255,0.5)", fontSize: 16, fontWeight: "500" },
  verseHeader: { flexDirection: "row", alignItems: "center", paddingTop: 56, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  backBtn: { padding: 6, marginRight: 8 },
  verseHeaderInfo: { flex: 1 },
  verseHeaderTitle: { color: "#fff", fontWeight: "700", fontSize: 17 },
  verseHeaderSub: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 1 },
  verseHeaderArabic: { color: "rgba(255,255,255,0.5)", fontSize: 18 },
  verseList: { padding: 16, paddingBottom: 40 },
  verseCard: { backgroundColor: "rgba(20,20,50,0.8)", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  verseNumBadge: { alignSelf: "flex-end", backgroundColor: "rgba(152,37,152,0.25)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 10 },
  verseNum: { color: "#E491C9", fontWeight: "700", fontSize: 12 },
  verseArabic: { fontSize: 20, color: "#fff", textAlign: "right", lineHeight: 34, marginBottom: 12 },
  verseTrans: { fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 20 },
});
