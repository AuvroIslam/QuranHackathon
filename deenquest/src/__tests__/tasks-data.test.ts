import { getTasksForDate, DAILY_TASKS } from "../lib/tasks-data";

describe("getTasksForDate", () => {
  it("always returns exactly 3 tasks", () => {
    const tasks = getTasksForDate(new Date("2026-05-14"));
    expect(tasks).toHaveLength(3);
  });

  it("returns the same tasks for the same date (deterministic)", () => {
    const date = new Date("2026-05-14");
    const first = getTasksForDate(date).map((t) => t.id);
    const second = getTasksForDate(date).map((t) => t.id);
    expect(first).toEqual(second);
  });

  it("returns different tasks on different days", () => {
    const day1 = getTasksForDate(new Date("2026-05-14")).map((t) => t.id);
    const day2 = getTasksForDate(new Date("2026-05-15")).map((t) => t.id);
    expect(day1).not.toEqual(day2);
  });

  it("returns no duplicate tasks within a single day", () => {
    const tasks = getTasksForDate(new Date("2026-05-14"));
    const ids = tasks.map((t) => t.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("all returned tasks exist in DAILY_TASKS", () => {
    const validIds = new Set(DAILY_TASKS.map((t) => t.id));
    const tasks = getTasksForDate(new Date("2026-05-14"));
    tasks.forEach((t) => expect(validIds.has(t.id)).toBe(true));
  });

  it("each task has required fields", () => {
    const tasks = getTasksForDate(new Date("2026-05-14"));
    tasks.forEach((t) => {
      expect(t.id).toBeTruthy();
      expect(t.title).toBeTruthy();
      expect(t.xpReward).toBeGreaterThan(0);
    });
  });
});
