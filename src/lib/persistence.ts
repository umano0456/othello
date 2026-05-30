import type { PlayerProfile } from "@/game/types";
import { getDefaultProfile } from "@/game/types";

const STORAGE_KEY = "othello.profile.v1";

function isBrowser(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { localStorage?: Storage }).localStorage !==
      "undefined"
  );
}

function validate(value: unknown): value is PlayerProfile {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<PlayerProfile>;
  if (v.playerColor !== "black" && v.playerColor !== "white") return false;
  if (
    v.strength !== "easy" &&
    v.strength !== "normal" &&
    v.strength !== "hard"
  ) {
    return false;
  }
  if (v.schemaVersion !== 1) return false;
  return true;
}

export function loadProfile(): PlayerProfile {
  if (!isBrowser()) return getDefaultProfile();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultProfile();
    const parsed = JSON.parse(raw) as unknown;
    if (!validate(parsed)) return getDefaultProfile();
    return parsed;
  } catch {
    return getDefaultProfile();
  }
}

export function saveProfile(profile: PlayerProfile): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Quota exceeded / private mode — ignore silently per spec.
  }
}

export const STORAGE_KEY_FOR_TESTS = STORAGE_KEY;
