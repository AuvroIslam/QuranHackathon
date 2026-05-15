import { getStreakStatus } from "../lib/streakUtils";

const TODAY = "2026-05-14";
const TWO_DAYS_AGO = "2026-05-12";
const THREE_DAYS_AGO = "2026-05-11";

jest.useFakeTimers();
jest.setSystemTime(new Date(TODAY));

describe("getStreakStatus", () => {
  it("returns ok when no last session date", () => {
    expect(getStreakStatus(null, 5)).toEqual({ status: "ok" });
    expect(getStreakStatus(undefined, 5)).toEqual({ status: "ok" });
  });

  it("returns ok when last session was today", () => {
    expect(getStreakStatus(TODAY, 5)).toEqual({ status: "ok" });
  });

  it("returns ok when last session was yesterday", () => {
    expect(getStreakStatus("2026-05-13", 5)).toEqual({ status: "ok" });
  });

  it("returns recovery with 1 task when missed 1 day", () => {
    expect(getStreakStatus(TWO_DAYS_AGO, 7)).toEqual({
      status: "recovery",
      tasksNeeded: 1,
      streak: 7,
    });
  });

  it("returns recovery with 3 tasks when missed 2 days", () => {
    expect(getStreakStatus(THREE_DAYS_AGO, 3)).toEqual({
      status: "recovery",
      tasksNeeded: 3,
      streak: 3,
    });
  });

  it("returns broken when missed more than 2 days", () => {
    expect(getStreakStatus("2026-05-10", 10)).toEqual({ status: "broken" });
  });
});
