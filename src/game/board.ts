import { BOARD_SIZE, inBounds } from "./directions";
import type { Board, BoardRow, Cell, Color, Coord } from "./types";

const EMPTY_ROW: BoardRow = [
  "empty",
  "empty",
  "empty",
  "empty",
  "empty",
  "empty",
  "empty",
  "empty",
];

function rowFromArray(cells: Cell[]): BoardRow {
  if (cells.length !== BOARD_SIZE) {
    throw new RangeError(`row length must be ${BOARD_SIZE}`);
  }
  return [
    cells[0],
    cells[1],
    cells[2],
    cells[3],
    cells[4],
    cells[5],
    cells[6],
    cells[7],
  ] as const;
}

function boardFromArray(rows: BoardRow[]): Board {
  if (rows.length !== BOARD_SIZE) {
    throw new RangeError(`board must have ${BOARD_SIZE} rows`);
  }
  return [
    rows[0],
    rows[1],
    rows[2],
    rows[3],
    rows[4],
    rows[5],
    rows[6],
    rows[7],
  ] as const;
}

export function createInitialBoard(): Board {
  const rows: BoardRow[] = Array.from({ length: BOARD_SIZE }, () => EMPTY_ROW);
  const mid = BOARD_SIZE / 2;
  // Official starting position (row, col): D4=white (3,3), E4=black (3,4),
  // D5=black (4,3), E5=white (4,4).
  rows[mid - 1] = withCellInRow(EMPTY_ROW, mid - 1, "white");
  rows[mid - 1] = withCellInRow(rows[mid - 1], mid, "black");
  rows[mid] = withCellInRow(EMPTY_ROW, mid - 1, "black");
  rows[mid] = withCellInRow(rows[mid], mid, "white");
  return boardFromArray(rows);
}

function withCellInRow(row: BoardRow, col: number, cell: Cell): BoardRow {
  const next = [...row];
  next[col] = cell;
  return rowFromArray(next);
}

export function getCell(board: Board, coord: Coord): Cell {
  if (!inBounds(coord.row, coord.col)) {
    throw new RangeError(
      `coord out of range: row=${coord.row}, col=${coord.col}`,
    );
  }
  return board[coord.row][coord.col];
}

export function placeStone(board: Board, coord: Coord, color: Color): Board {
  if (!inBounds(coord.row, coord.col)) {
    throw new RangeError(
      `coord out of range: row=${coord.row}, col=${coord.col}`,
    );
  }
  const rows = board.map((r, i) =>
    i === coord.row ? withCellInRow(r, coord.col, color) : r,
  );
  return boardFromArray(rows as BoardRow[]);
}

export function flipStones(
  board: Board,
  coords: readonly Coord[],
  color: Color,
): Board {
  if (coords.length === 0) return board;
  const byRow = new Map<number, Set<number>>();
  for (const c of coords) {
    if (!inBounds(c.row, c.col)) {
      throw new RangeError(`coord out of range: row=${c.row}, col=${c.col}`);
    }
    const set = byRow.get(c.row) ?? new Set<number>();
    set.add(c.col);
    byRow.set(c.row, set);
  }
  const rows: BoardRow[] = board.map((row, rowIdx) => {
    const targets = byRow.get(rowIdx);
    if (!targets) return row;
    const next = row.map((cell, colIdx) => (targets.has(colIdx) ? color : cell));
    return rowFromArray(next);
  });
  return boardFromArray(rows);
}

export function countCells(board: Board): {
  black: number;
  white: number;
  empty: number;
} {
  let black = 0;
  let white = 0;
  let empty = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === "black") black++;
      else if (cell === "white") white++;
      else empty++;
    }
  }
  return { black, white, empty };
}
