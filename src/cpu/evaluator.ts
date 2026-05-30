import { BOARD_SIZE } from "@/game/directions";
import { legalMovesForBoard } from "@/game/moves";
import type { Board, Color, Coord } from "@/game/types";
import { opposite } from "@/game/types";

// Position weight table — corners high, X squares heavily negative.
// (row, col) layout matches the contract.
export const POSITION_WEIGHTS: ReadonlyArray<readonly number[]> = [
  [100, -20, 10, 5, 5, 10, -20, 100],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [10, -2, 1, 1, 1, 1, -2, 10],
  [5, -2, 1, 1, 1, 1, -2, 5],
  [5, -2, 1, 1, 1, 1, -2, 5],
  [10, -2, 1, 1, 1, 1, -2, 10],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [100, -20, 10, 5, 5, 10, -20, 100],
];

const CORNERS: ReadonlyArray<Coord> = [
  { row: 0, col: 0 },
  { row: 0, col: 7 },
  { row: 7, col: 0 },
  { row: 7, col: 7 },
];

export function positionWeight(c: Coord): number {
  return POSITION_WEIGHTS[c.row][c.col];
}

export function mobility(board: Board, color: Color): number {
  return legalMovesForBoard(board, color).length;
}

function countMaterialWeighted(board: Board, color: Color): number {
  const opp = opposite(color);
  let score = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell === color) score += POSITION_WEIGHTS[r][c];
      else if (cell === opp) score -= POSITION_WEIGHTS[r][c];
    }
  }
  return score;
}

function cornerControl(board: Board, color: Color): number {
  const opp = opposite(color);
  let diff = 0;
  for (const c of CORNERS) {
    const cell = board[c.row][c.col];
    if (cell === color) diff += 1;
    else if (cell === opp) diff -= 1;
  }
  return diff;
}

function emptyCount(board: Board): number {
  let empty = 0;
  for (const row of board) for (const c of row) if (c === "empty") empty++;
  return empty;
}

// Heuristic evaluation from `color`'s perspective.
// Positive = advantageous for `color`.
export function evaluateBoard(board: Board, color: Color): number {
  const empty = emptyCount(board);
  const materialWeighted = countMaterialWeighted(board, color);
  const myMob = mobility(board, color);
  const oppMob = mobility(board, opposite(color));
  const mobDelta = myMob - oppMob;
  const cornerDelta = cornerControl(board, color);
  // In late game disc count matters more than position weights.
  const stage = empty < 16 ? 2 : 1;
  return (
    materialWeighted * stage + mobDelta * 5 + cornerDelta * 30
  );
}

// Terminal evaluation: pure disc differential, multiplied by a large weight
// so it dominates heuristic scores.
export function terminalScore(board: Board, color: Color): number {
  let mine = 0;
  let theirs = 0;
  const opp = opposite(color);
  for (const row of board) {
    for (const c of row) {
      if (c === color) mine++;
      else if (c === opp) theirs++;
    }
  }
  return (mine - theirs) * 100_000;
}

export function emptyCells(board: Board): number {
  return emptyCount(board);
}
