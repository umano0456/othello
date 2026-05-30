import { legalMoves } from "@/game/game";
import type { Coord, GameState } from "@/game/types";
import { positionWeight } from "./evaluator";
import type { CPUStrategy } from "./strategy";

export class GreedyStrategy implements CPUStrategy {
  readonly strength = "normal" as const;

  selectMove(state: GameState): Coord {
    const moves = legalMoves(state);
    if (moves.length === 0) {
      throw new Error("GreedyStrategy.selectMove called with no legal moves");
    }
    let bestScore = Number.NEGATIVE_INFINITY;
    const bestCoords: Coord[] = [];
    for (const m of moves) {
      const score = m.flips.length * 1 + positionWeight(m.placedAt) * 2;
      if (score > bestScore) {
        bestScore = score;
        bestCoords.length = 0;
        bestCoords.push(m.placedAt);
      } else if (score === bestScore) {
        bestCoords.push(m.placedAt);
      }
    }
    return bestCoords[Math.floor(Math.random() * bestCoords.length)];
  }
}
