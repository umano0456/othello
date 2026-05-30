import { describe, expect, it } from "vitest";
import { RandomStrategy } from "@/cpu/random";
import { createGame, legalMoves } from "@/game/game";

describe("RandomStrategy", () => {
  it("always picks a coordinate in the legal-move set", () => {
    const game = createGame("black", "easy");
    const strategy = new RandomStrategy();
    const legal = new Set(
      legalMoves(game).map((m) => `${m.placedAt.row},${m.placedAt.col}`),
    );
    for (let i = 0; i < 50; i++) {
      const c = strategy.selectMove(game);
      expect(legal.has(`${c.row},${c.col}`)).toBe(true);
    }
  });

  it("throws if asked for a move when there are none", () => {
    const game = createGame("black", "easy");
    const strategy = new RandomStrategy();
    // Construct an artificially finished game where legalMoves returns [].
    const finished = { ...game, phase: "finished" as const };
    expect(() => strategy.selectMove(finished)).toThrow();
  });
});
