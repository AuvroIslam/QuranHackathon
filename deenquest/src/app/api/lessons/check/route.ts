import { NextRequest, NextResponse } from "next/server";
import { getLesson } from "@/lib/server/lessons-bank";
import type { UserLevel } from "@/lib/types";

function levelToKey(level: string | null | undefined): "beginner" | "intermediate" | "fluent" {
  const map: Record<UserLevel, "beginner" | "intermediate" | "fluent"> = {
    newbie: "beginner",
    intermediate: "intermediate",
    fluent: "fluent",
  };
  return map[(level as UserLevel) ?? "newbie"] ?? "beginner";
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const level = levelToKey(body?.level);
  const day = parseInt(String(body?.day ?? "1"), 10);
  const selectedIndex = Number(body?.selectedIndex);

  if (!Number.isFinite(day) || day < 1 || !Number.isInteger(selectedIndex)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const lesson = getLesson(level, day);
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const { mcq } = lesson;
  const correct = selectedIndex === mcq.correctIndex;

  return NextResponse.json({
    correct,
    correctIndex: mcq.correctIndex,
    correctOption: mcq.options[mcq.correctIndex],
  });
}
