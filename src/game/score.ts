import { countCells } from "./board";
import type { Board, Color, GameState } from "./types";

export function getScoreFromBoard(board: Board): {
  black: number;
  white: number;
} {
  const { black, white } = countCells(board);
  return { black, white };
}

export function getScore(state: GameState): { black: number; white: number } {
  return getScoreFromBoard(state.board);
}

export function getWinner(state: GameState): Color | "draw" | null {
  if (state.phase !== "finished") return null;
  const { black, white } = getScore(state);
  if (black > white) return "black";
  if (white > black) return "white";
  return "draw";
}
