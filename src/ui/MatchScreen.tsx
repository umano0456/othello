"use client";

import { useMemo } from "react";
import { legalMoves } from "@/game/game";
import { getScore, getWinner } from "@/game/score";
import type { Coord, GameState } from "@/game/types";
import { BoardView, coordKey } from "./BoardView";
import { Hud } from "./Hud";
import { ResultModal } from "./ResultModal";

export type MatchScreenProps = {
  game: GameState;
  cpuThinking: boolean;
  lastFlips: readonly Coord[];
  focusedCell: Coord | null;
  onCellActivate: (coord: Coord) => void;
  onFocusChange: (coord: Coord | null) => void;
  onRestart: () => void;
};

export function MatchScreen({
  game,
  cpuThinking,
  lastFlips,
  focusedCell,
  onCellActivate,
  onFocusChange,
  onRestart,
}: MatchScreenProps) {
  const legalCoords = useMemo(() => {
    const set = new Set<string>();
    if (game.phase === "playing") {
      for (const m of legalMoves(game)) {
        set.add(coordKey(m.placedAt));
      }
    }
    return set;
  }, [game]);

  const { black, white } = getScore(game);
  const winner = getWinner(game);

  const myTurn =
    game.phase === "playing" && game.turn === game.playerColor && !cpuThinking;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6 lg:flex-row lg:items-start lg:gap-10">
      <BoardView
        board={game.board}
        legalCoords={legalCoords}
        lastFlips={lastFlips}
        focusedCell={focusedCell}
        myTurn={myTurn}
        onCellActivate={onCellActivate}
        onFocusChange={onFocusChange}
      />
      <div className="flex w-full max-w-md flex-col gap-4 lg:w-72">
        <Hud
          blackScore={black}
          whiteScore={white}
          turn={game.turn}
          playerColor={game.playerColor}
          cpuThinking={cpuThinking}
        />
        <button
          type="button"
          onClick={onRestart}
          className="rounded-lg border border-zinc-300 bg-[color:var(--color-surface)] py-2 text-sm font-medium hover:bg-zinc-100"
        >
          設定に戻る
        </button>
      </div>
      {winner !== null && (
        <ResultModal
          winner={winner}
          playerColor={game.playerColor}
          blackScore={black}
          whiteScore={white}
          onRestart={onRestart}
        />
      )}
    </div>
  );
}
