import { beforeEach, describe, expect, it } from "vitest";
import {
  STORAGE_KEY_FOR_TESTS,
  loadProfile,
  saveProfile,
} from "@/lib/persistence";

describe("persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns the default profile when nothing is stored", () => {
    expect(loadProfile()).toEqual({
      playerColor: "black",
      strength: "normal",
      schemaVersion: 1,
    });
  });

  it("round-trips a profile via save/load", () => {
    saveProfile({ playerColor: "white", strength: "hard", schemaVersion: 1 });
    expect(loadProfile()).toEqual({
      playerColor: "white",
      strength: "hard",
      schemaVersion: 1,
    });
  });

  it("falls back to default for invalid stored JSON", () => {
    window.localStorage.setItem(STORAGE_KEY_FOR_TESTS, "{not-json");
    expect(loadProfile()).toEqual({
      playerColor: "black",
      strength: "normal",
      schemaVersion: 1,
    });
  });

  it("falls back to default for schema-mismatched stored values", () => {
    window.localStorage.setItem(
      STORAGE_KEY_FOR_TESTS,
      JSON.stringify({ playerColor: "red", strength: "extreme" }),
    );
    expect(loadProfile()).toEqual({
      playerColor: "black",
      strength: "normal",
      schemaVersion: 1,
    });
  });
});
