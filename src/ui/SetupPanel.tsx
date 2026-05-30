"use client";

import {
  COLOR_LABEL_JA,
  STRENGTH_LABEL_JA,
  type Color,
  type PlayerProfile,
  type Strength,
} from "@/game/types";

export type SetupPanelProps = {
  profile: PlayerProfile;
  onProfileChange: (next: Partial<PlayerProfile>) => void;
  onStart: () => void;
};

const COLORS: ReadonlyArray<Color> = ["black", "white"];
const STRENGTHS: ReadonlyArray<Strength> = ["easy", "normal", "hard"];

export function SetupPanel({ profile, onProfileChange, onStart }: SetupPanelProps) {
  return (
    <section
      aria-labelledby="setup-heading"
      className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-xl bg-[color:var(--color-surface)] p-6 shadow-sm"
    >
      <h1
        id="setup-heading"
        className="text-2xl font-semibold tracking-tight"
      >
        対戦設定
      </h1>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-[color:var(--color-text-muted)]">
          あなたの手番
        </legend>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <label
              key={c}
              className={[
                "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm",
                profile.playerColor === c
                  ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 font-semibold"
                  : "border-zinc-200 hover:border-zinc-300",
              ].join(" ")}
            >
              <input
                type="radio"
                name="player-color"
                value={c}
                className="sr-only"
                checked={profile.playerColor === c}
                onChange={() => onProfileChange({ playerColor: c })}
              />
              <span
                aria-hidden="true"
                className={[
                  "h-3 w-3 rounded-full",
                  c === "black"
                    ? "bg-[color:var(--color-stone-black)]"
                    : "bg-[color:var(--color-stone-white)] ring-1 ring-zinc-300",
                ].join(" ")}
              />
              {COLOR_LABEL_JA[c]}（{c === "black" ? "先手" : "後手"}）
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-[color:var(--color-text-muted)]">
          CPU の強さ
        </legend>
        <div className="flex gap-2">
          {STRENGTHS.map((s) => (
            <label
              key={s}
              className={[
                "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm",
                profile.strength === s
                  ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 font-semibold"
                  : "border-zinc-200 hover:border-zinc-300",
              ].join(" ")}
            >
              <input
                type="radio"
                name="strength"
                value={s}
                className="sr-only"
                checked={profile.strength === s}
                onChange={() => onProfileChange({ strength: s })}
              />
              {STRENGTH_LABEL_JA[s]}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={onStart}
        className="rounded-lg bg-[color:var(--color-accent)] py-3 text-base font-semibold text-white shadow-sm transition hover:brightness-110"
      >
        対戦開始
      </button>
    </section>
  );
}
