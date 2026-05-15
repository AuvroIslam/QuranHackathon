import { normalize, compareTexts } from "../lib/arabic-utils";

describe("normalize", () => {
  it("removes tashkeel (diacritics)", () => {
    expect(normalize("بِسْمِ")).toBe("بسم");
  });

  it("normalizes alef variants to bare alef", () => {
    expect(normalize("أإآٱ")).toBe("ااا ا".replace(/\s/g, ""));
  });

  it("normalizes taa marbuta to haa", () => {
    expect(normalize("رحمة")).toBe("رحمه");
  });

  it("normalizes alef maqsura to yaa", () => {
    expect(normalize("على")).toBe("علي");
  });

  it("collapses multiple spaces", () => {
    expect(normalize("كلمة   كلمة")).toBe("كلمه كلمه");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalize("  بسم  ")).toBe("بسم");
  });

  it("returns empty string for empty input", () => {
    expect(normalize("")).toBe("");
  });
});

describe("compareTexts", () => {
  it("returns score 1.0 when spoken matches ayah exactly", () => {
    const ayah = "بسم الله الرحمن";
    const { score, words } = compareTexts(ayah, ayah);
    expect(score).toBe(1);
    expect(words.every((w) => w.correct)).toBe(true);
  });

  it("returns score 0 when nothing was spoken", () => {
    const { score, words } = compareTexts("", "بسم الله");
    expect(score).toBe(0);
    expect(words.every((w) => !w.correct)).toBe(true);
  });

  it("returns score 0 when ayah is empty", () => {
    const { score, words } = compareTexts("بسم الله", "");
    expect(score).toBe(0);
    expect(words).toHaveLength(0);
  });

  it("gives partial credit for partially correct recitation", () => {
    const ayah = "بسم الله الرحمن الرحيم";
    const spoken = "بسم الله";
    const { score } = compareTexts(spoken, ayah);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it("matches words out of order via fallback search", () => {
    const ayah = "الله بسم";
    const spoken = "بسم الله";
    const { score } = compareTexts(spoken, ayah);
    expect(score).toBe(1);
  });

  it("does not double-count the same spoken word", () => {
    // spoken has one "الله", ayah has two — only one should match
    const ayah = "الله الله";
    const spoken = "الله";
    const { score } = compareTexts(spoken, ayah);
    expect(score).toBe(0.5);
  });

  it("strips diacritics before comparing so tashkeel differences still match", () => {
    const ayah = "بِسْمِ اللَّهِ";
    const spoken = "بسم الله";
    const { score } = compareTexts(spoken, ayah);
    expect(score).toBe(1);
  });

  it("preserves original word (with diacritics) in word results", () => {
    const ayah = "بِسْمِ";
    const { words } = compareTexts("بسم", ayah);
    expect(words[0].word).toBe("بِسْمِ");
  });
});
