export type StreakStatus =
  | { status: 'ok' }
  | { status: 'recovery'; tasksNeeded: 1 | 3; streak: number }
  | { status: 'broken' };

function toDateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}

function dateDiffDays(a: string, b: string): number {
  return Math.floor((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}

export function getStreakStatus(lastSessionDate: string | null | undefined, streak: number): StreakStatus {
  const today = toDateOnly(new Date());
  if (!lastSessionDate) return { status: 'ok' };
  const missedDays = dateDiffDays(today, lastSessionDate) - 1;
  if (missedDays <= 0) return { status: 'ok' };
  if (missedDays === 1) return { status: 'recovery', tasksNeeded: 1, streak };
  if (missedDays === 2) return { status: 'recovery', tasksNeeded: 3, streak };
  return { status: 'broken' };
}
