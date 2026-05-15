import { NextRequest, NextResponse } from "next/server";
import { getLesson } from "@/lib/server/lessons-bank";
import { fetchVerseContent } from "@/lib/server/qf-verse";
import type { UserLevel } from "@/lib/types";

function levelToKey(level: string | null): "beginner" | "intermediate" | "fluent" {
  const map: Record<UserLevel, "beginner" | "intermediate" | "fluent"> = {
    newbie: "beginner",
    intermediate: "intermediate",
    fluent: "fluent",
  };
  return map[(level as UserLevel) ?? "newbie"] ?? "beginner";
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const level = levelToKey(searchParams.get("level"));
  const day = parseInt(searchParams.get("day") ?? "1", 10);

  if (!Number.isFinite(day) || day < 1) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }

  const lesson = getLesson(level, day);
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Strip correctIndex from the MCQ before sending to the client.
  const { mcq, ...rest } = lesson;

  // The lesson bank holds NO Quran text — only the verse reference + pedagogy.
  // The Arabic / transliteration / translation are fetched live from the Quran
  // Foundation Content API (public api.quran.com fallback, 1h cache). If the
  // verse cannot be fetched we FAIL rather than serve hardcoded Quran text;
  // the client shows a retry state.
  let verse;
  try {
    verse = await fetchVerseContent(rest.learnContent.reference);
  } catch {
    return NextResponse.json(
      { error: "Verse text temporarily unavailable" },
      { status: 503 }
    );
  }

  return NextResponse.json({
    lesson: {
      ...rest,
      learnContent: {
        reference: rest.learnContent.reference,
        explanation: rest.learnContent.explanation,
        audioUrl: rest.learnContent.audioUrl,
        arabic: verse.arabic,
        transliteration: verse.transliteration,
        translation: verse.translation,
      },
      mcq: { question: mcq.question, options: mcq.options },
    },
    source: "live",
  });
}
