import type { Coord, GameState, Strength } from "@/game/types";

export interface CPUStrategy {
  readonly strength: Strength;
  selectMove(state: GameState): Coord;
}
