import { getTasksForDate, DAILY_TASKS } from "../lib/tasks-data";

describe("getTasksForDate", () => {
  it("always returns exactly 3 tasks", () => {
    expect(getTasksForDate(new Date("2026-05-14"))).toHaveLength(3);
  });

  it("is deterministic — same date gives same tasks", () => {
    const date = new Date("2026-05-14");
    const a = getTasksForDate(date).map((t) => t.id);
    const b = getTasksForDate(date).map((t) => t.id);
    expect(a).toEqual(b);
  });

  it("gives different tasks on different days", () => {
    const day1 = getTasksForDate(new Date("2026-05-14")).map((t) => t.id);
    const day2 = getTasksForDate(new Date("2026-05-15")).map((t) => t.id);
    expect(day1).not.toEqual(day2);
  });

  it("has no duplicate tasks within a single day", () => {
    const tasks = getTasksForDate(new Date("2026-05-14"));
    const ids = tasks.map((t) => t.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("all returned tasks exist in DAILY_TASKS", () => {
    const validIds = new Set(DAILY_TASKS.map((t) => t.id));
    getTasksForDate(new Date("2026-05-14")).forEach((t) =>
      expect(validIds.has(t.id)).toBe(true)
    );
  });
});
