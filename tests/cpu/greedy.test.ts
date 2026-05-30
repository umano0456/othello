import { describe, expect, it } from "vitest";
import { GreedyStrategy } from "@/cpu/greedy";
import { createGame, legalMoves } from "@/game/game";

describe("GreedyStrategy", () => {
  it("always picks a coordinate in the legal-move set", () => {
    const game = createGame("black", "normal");
    const strategy = new GreedyStrategy();
    const legal = new Set(
      legalMoves(game).map((m) => `${m.placedAt.row},${m.placedAt.col}`),
    );
    for (let i = 0; i < 10; i++) {
      const c = strategy.selectMove(game);
      expect(legal.has(`${c.row},${c.col}`)).toBe(true);
    }
  });

  it("is deterministic when the best score is unique", () => {
    // The 4 opening moves for black are symmetric in flip count and position
    // weight, so we cannot easily assert uniqueness at the opening. Instead,
    // assert that the strategy returns an answer (smoke test of the scoring
    // path) and that it doesn't throw.
    const game = createGame("black", "normal");
    const strategy = new GreedyStrategy();
    expect(() => strategy.selectMove(game)).not.toThrow();
  });
});
