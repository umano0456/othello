import { describe, expect, it } from "vitest";
import { NegamaxStrategy } from "@/cpu/negamax";
import { applyMove, createGame, legalMoves } from "@/game/game";
import { findMove } from "@/game/moves";
import type { GameState } from "@/game/types";

function playByCoord(state: GameState, row: number, col: number): GameState {
  const move = findMove(state.board, state.turn, { row, col });
  if (!move) throw new Error(`illegal move at ${row},${col}`);
  return applyMove(state, move);
}

describe("NegamaxStrategy", () => {
  it("always picks a coordinate in the legal-move set at the opening", () => {
    const game = createGame("black", "hard");
    const strategy = new NegamaxStrategy({ timeBudgetMs: 200 });
    const legal = new Set(
      legalMoves(game).map((m) => `${m.placedAt.row},${m.placedAt.col}`),
    );
    const c = strategy.selectMove(game);
    expect(legal.has(`${c.row},${c.col}`)).toBe(true);
  });

  it("returns a result within a reasonable time budget", () => {
    const game = createGame("black", "hard");
    const strategy = new NegamaxStrategy({ timeBudgetMs: 200 });
    const start = Date.now();
    strategy.selectMove(game);
    const elapsed = Date.now() - start;
    // Allow generous slack on slow CI; we mainly assert the budget mechanism
    // does not hang.
    expect(elapsed).toBeLessThan(2000);
  });

  it("continues to return legal moves after a few plies", () => {
    let game = createGame("black", "hard");
    game = playByCoord(game, 2, 3); // black opens
    // White to move; let the strategy pick.
    const strategy = new NegamaxStrategy({ timeBudgetMs: 200 });
    const c = strategy.selectMove(game);
    const legal = new Set(
      legalMoves(game).map((m) => `${m.placedAt.row},${m.placedAt.col}`),
    );
    expect(legal.has(`${c.row},${c.col}`)).toBe(true);
  });
});
