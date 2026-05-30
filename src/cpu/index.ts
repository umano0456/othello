import type { Strength } from "@/game/types";
import { GreedyStrategy } from "./greedy";
import { NegamaxStrategy } from "./negamax";
import { RandomStrategy } from "./random";
import type { CPUStrategy } from "./strategy";

export type { CPUStrategy } from "./strategy";
export { GreedyStrategy } from "./greedy";
export { NegamaxStrategy } from "./negamax";
export { RandomStrategy } from "./random";

export function createStrategy(strength: Strength): CPUStrategy {
  switch (strength) {
    case "easy":
      return new RandomStrategy();
    case "normal":
      return new GreedyStrategy();
    case "hard":
      return new NegamaxStrategy();
  }
}
