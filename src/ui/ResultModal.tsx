"use client";

import { useEffect, useRef } from "react";
import { COLOR_LABEL_JA, type Color } from "@/game/types";

export type ResultModalProps = {
  winner: Color | "draw";
  playerColor: Color;
  blackScore: number;
  whiteScore: number;
  onRestart: () => void;
};

function headlineFor(
  winner: Color | "draw",
  playerColor: Color,
): { title: string; emoji: string } {
  if (winner === "draw") return { title: "引き分け", emoji: "🤝" };
  if (winner === playerColor) return { title: "あなたの勝ち！", emoji: "🎉" };
  return { title: "CPU の勝ち", emoji: "🤖" };
}

export function ResultModal({
  winner,
  playerColor,
  blackScore,
  whiteScore,
  onRestart,
}: ResultModalProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onRestart();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRestart]);

  const { title, emoji } = headlineFor(winner, playerColor);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-[color:var(--color-surface)] p-6 shadow-xl">
        <div className="text-center text-5xl" aria-hidden="true">
          {emoji}
        </div>
        <h2
          id="result-heading"
          className="text-center text-2xl font-bold"
        >
          {title}
        </h2>
        <p className="text-center text-base text-[color:var(--color-text-muted)]">
          {COLOR_LABEL_JA.black}: <span className="tabular-nums">{blackScore}</span>{" "}
          / {COLOR_LABEL_JA.white}:{" "}
          <span className="tabular-nums">{whiteScore}</span>
        </p>
        <button
          ref={buttonRef}
          type="button"
          onClick={onRestart}
          className="mt-2 rounded-lg bg-[color:var(--color-accent)] py-3 text-base font-semibold text-white shadow-sm hover:brightness-110"
        >
          もう一度遊ぶ
        </button>
      </div>
    </div>
  );
}
