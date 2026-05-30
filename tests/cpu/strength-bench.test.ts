import { describe, expect, it } from "vitest";
import { GreedyStrategy } from "@/cpu/greedy";
import { NegamaxStrategy } from "@/cpu/negamax";
import { RandomStrategy } from "@/cpu/random";
import type { CPUStrategy } from "@/cpu/strategy";
import { applyMove, applyPass, createGame, legalMoves } from "@/game/game";
import { findMove } from "@/game/moves";
import { getWinner } from "@/game/score";
import type { GameState } from "@/game/types";

const NUM_GAMES = Number.parseInt(process.env.OTHELLO_BENCH_GAMES ?? "20", 10);

function playOneGame(
  blackStrategy: CPUStrategy,
  whiteStrategy: CPUStrategy,
): GameState {
  let game = createGame("black", "normal");
  while (game.phase === "playing") {
    const moves = legalMoves(game);
    if (moves.length === 0) {
      game = applyPass(game);
      continue;
    }
    const strategy = game.turn === "black" ? blackStrategy : whiteStrategy;
    const at = strategy.selectMove(game);
    const move = findMove(game.board, game.turn, at);
    if (!move) throw new Error("strategy returned an illegal move");
    game = applyMove(game, move);
  }
  return game;
}

function winRate(a: CPUStrategy, b: CPUStrategy, n: number): number {
  let wins = 0;
  let draws = 0;
  for (let i = 0; i < n; i++) {
    // Alternate sides to keep things fair.
    const finished = i % 2 === 0 ? playOneGame(a, b) : playOneGame(b, a);
    const winner = getWinner(finished);
    if (winner === "draw") {
      draws++;
      continue;
    }
    const sideA = i % 2 === 0 ? "black" : "white";
    if (winner === sideA) wins++;
  }
  // Count draws as half wins for stability.
  return (wins + draws / 2) / n;
}

// Marked `skip` by default — runs on demand via `npm run test:bench` once we
// raise NUM_GAMES to 100 per SC-005.
describe.skip("CPU strength differentiation (SC-005)", () => {
  it(
    `hard vs easy yields >= 70% win-rate over ${NUM_GAMES} games`,
    () => {
      const rate = winRate(new NegamaxStrategy({ timeBudgetMs: 500 }), new RandomStrategy(), NUM_GAMES);
      expect(rate).toBeGreaterThanOrEqual(0.7);
    },
    120_000,
  );

  it(
    `hard vs normal yields >= 55% win-rate over ${NUM_GAMES} games`,
    () => {
      const rate = winRate(new NegamaxStrategy({ timeBudgetMs: 500 }), new GreedyStrategy(), NUM_GAMES);
      expect(rate).toBeGreaterThanOrEqual(0.55);
    },
    120_000,
  );
});
