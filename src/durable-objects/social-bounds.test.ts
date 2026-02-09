import { describe, expect, it } from "vitest";
import { capByVolumeKeepingPinnedMap, capByVolumeKeepingPinnedRecord } from "./social-bounds";

describe("social-bounds", () => {
  it("caps Map by volume while keeping pinned symbols", () => {
    const snapshot = new Map<string, { volume: number; extra: string }>([
      ["A", { volume: 100, extra: "a" }],
      ["B", { volume: 80, extra: "b" }],
      ["C", { volume: 60, extra: "c" }],
      ["D", { volume: 40, extra: "d" }],
      ["E", { volume: 20, extra: "e" }],
    ]);

    const capped = capByVolumeKeepingPinnedMap(snapshot, 3, ["E"]);

    expect(Array.from(capped.keys()).sort()).toEqual(["A", "B", "E"].sort());
    expect(capped.get("E")?.extra).toBe("e");
  });

  it("caps Record by volume while keeping pinned symbols", () => {
    const cache = {
      A: { volume: 100, kind: "a" },
      B: { volume: 80, kind: "b" },
      C: { volume: 60, kind: "c" },
      D: { volume: 40, kind: "d" },
      E: { volume: 20, kind: "e" },
    };

    const capped = capByVolumeKeepingPinnedRecord(cache, 3, ["E"]);

    expect(Object.keys(capped).sort()).toEqual(["A", "B", "E"].sort());
    expect(capped.E?.kind).toBe("e");
  });

  it("returns only pinned when pinned exceeds maxSymbols", () => {
    const snapshot = new Map<string, { volume: number }>([
      ["A", { volume: 1 }],
      ["B", { volume: 2 }],
      ["C", { volume: 3 }],
    ]);

    const capped = capByVolumeKeepingPinnedMap(snapshot, 2, ["A", "B", "C"]);
    expect(capped.size).toBe(2);
    expect(Array.from(capped.keys()).sort()).toEqual(["B", "C"].sort());
  });
});
