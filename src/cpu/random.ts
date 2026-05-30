import { legalMoves } from "@/game/game";
import type { Coord, GameState } from "@/game/types";
import type { CPUStrategy } from "./strategy";

export class RandomStrategy implements CPUStrategy {
  readonly strength = "easy" as const;

  selectMove(state: GameState): Coord {
    const moves = legalMoves(state);
    if (moves.length === 0) {
      throw new Error("RandomStrategy.selectMove called with no legal moves");
    }
    const idx = Math.floor(Math.random() * moves.length);
    return moves[idx].placedAt;
  }
}
