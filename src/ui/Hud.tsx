"use client";

import { COLOR_LABEL_JA, type Color } from "@/game/types";

export type HudProps = {
  blackScore: number;
  whiteScore: number;
  turn: Color;
  playerColor: Color;
  cpuThinking: boolean;
};

export function Hud({
  blackScore,
  whiteScore,
  turn,
  playerColor,
  cpuThinking,
}: HudProps) {
  const isPlayerTurn = turn === playerColor;
  const turnLabel = isPlayerTurn
    ? `あなた（${COLOR_LABEL_JA[playerColor]}）の手番`
    : `CPU（${COLOR_LABEL_JA[turn]}）の手番`;

  return (
    <section
      aria-label="対局情報"
      className="flex flex-col gap-3 rounded-lg bg-[color:var(--color-surface)] p-4 shadow-sm"
    >
      <div className="flex items-center gap-4">
        <ScoreBadge color="black" label={COLOR_LABEL_JA.black} score={blackScore} />
        <ScoreBadge color="white" label={COLOR_LABEL_JA.white} score={whiteScore} />
      </div>
      <div
        role="status"
        aria-live="polite"
        className="text-base font-medium text-[color:var(--color-text)]"
      >
        {turnLabel}
      </div>
      {cpuThinking && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-[color:var(--color-text-muted)]"
        >
          <span className="inline-flex gap-1" aria-hidden="true">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--color-accent)]" />
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--color-accent)]"
              style={{ animationDelay: "0.15s" }}
            />
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--color-accent)]"
              style={{ animationDelay: "0.3s" }}
            />
          </span>
          CPU が考えています…
        </div>
      )}
    </section>
  );
}

type ScoreBadgeProps = { color: Color; label: string; score: number };

function ScoreBadge({ color, label, score }: ScoreBadgeProps) {
  return (
    <div
      className="flex items-center gap-2 rounded-full bg-[color:var(--color-bg)] px-3 py-1"
      aria-label={`${label}石 ${score} 個`}
    >
      <span
        aria-hidden="true"
        className={[
          "inline-block h-4 w-4 rounded-full",
          color === "black"
            ? "bg-[color:var(--color-stone-black)]"
            : "bg-[color:var(--color-stone-white)] ring-1 ring-zinc-300",
        ].join(" ")}
      />
      <span className="text-sm font-semibold tabular-nums">
        {label}: {score}
      </span>
    </div>
  );
}
