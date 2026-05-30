import { flipStones, getCell, placeStone } from "./board";
import { BOARD_SIZE, DIRECTIONS, inBounds } from "./directions";
import type { Board, Color, Coord, Move } from "./types";
import { opposite } from "./types";

function flipsForDirection(
  board: Board,
  color: Color,
  start: Coord,
  dr: number,
  dc: number,
): Coord[] {
  const opp = opposite(color);
  const captured: Coord[] = [];
  let r = start.row + dr;
  let c = start.col + dc;
  while (inBounds(r, c) && board[r][c] === opp) {
    captured.push({ row: r, col: c });
    r += dr;
    c += dc;
  }
  if (captured.length === 0) return [];
  if (!inBounds(r, c)) return [];
  if (board[r][c] !== color) return [];
  return captured;
}

export function findMove(board: Board, color: Color, target: Coord): Move | null {
  if (!inBounds(target.row, target.col)) return null;
  if (board[target.row][target.col] !== "empty") return null;
  const flips: Coord[] = [];
  for (const [dr, dc] of DIRECTIONS) {
    const dirFlips = flipsForDirection(board, color, target, dr, dc);
    for (const f of dirFlips) flips.push(f);
  }
  if (flips.length === 0) return null;
  return { color, placedAt: target, flips };
}

export function legalMovesForBoard(board: Board, color: Color): readonly Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== "empty") continue;
      const m = findMove(board, color, { row: r, col: c });
      if (m) moves.push(m);
    }
  }
  return moves;
}

export function applyMoveToBoard(board: Board, move: Move): Board {
  const placed = placeStone(board, move.placedAt, move.color);
  return flipStones(placed, move.flips, move.color);
}

// Re-export helpers used internally elsewhere
export { getCell, opposite };
