export interface WordResult {
  word: string;
  correct: boolean;
}

// Uses explicit Unicode escapes to avoid encoding issues with Arabic character ranges.
// Tashkeel range: U+064B–U+065F (fathatan→wavy hamza), U+0670 (superscript alef),
// U+06D6–U+06DC, U+06DF–U+06E4, U+06E7, U+06E8, U+06EA–U+06ED (Quranic marks)
export function normalize(text: string): string {
  return text
    .replace(/[ً-ٰٟۖ-ۜ۟-۪ۤۧۨ-ۭ]/g, "")
    .replace(/[أإآٱ]/g, "ا") // أإآٱ → ا
    .replace(/ة/g, "ه")                      // ة → ه
    .replace(/ى/g, "ي")                      // ى → ي
    .replace(/\s+/g, " ")
    .trim();
}

export function compareTexts(spoken: string, ayah: string): { words: WordResult[]; score: number } {
  const spokenWords = normalize(spoken).split(" ").filter(Boolean);
  const ayahWords = ayah.split(" ").filter(Boolean);
  const ayahNorm = ayahWords.map(normalize);

  const matched = new Set<number>();

  const words: WordResult[] = ayahWords.map((original, i) => {
    if (spokenWords[i] !== undefined && spokenWords[i] === ayahNorm[i] && !matched.has(i)) {
      matched.add(i);
      return { word: original, correct: true };
    }
    const elsewhere = spokenWords.findIndex((w, j) => w === ayahNorm[i] && !matched.has(j));
    if (elsewhere !== -1) {
      matched.add(elsewhere);
      return { word: original, correct: true };
    }
    return { word: original, correct: false };
  });

  const score = ayahWords.length > 0 ? matched.size / ayahWords.length : 0;
  return { words, score };
}
