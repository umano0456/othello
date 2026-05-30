import { describe, expect, it } from "vitest";
import { createInitialBoard, placeStone } from "@/game/board";
import { findMove, legalMovesForBoard } from "@/game/moves";

describe("legalMovesForBoard at the opening", () => {
  it("returns 4 legal moves for black at the official initial position", () => {
    const board = createInitialBoard();
    const moves = legalMovesForBoard(board, "black");
    expect(moves).toHaveLength(4);
    const placed = moves.map((m) => `${m.placedAt.row},${m.placedAt.col}`).sort();
    // Standard opening squares: D3, C4, F5, E6 in (row,col) => (2,3) (3,2) (4,5) (5,4)
    expect(placed).toEqual(["2,3", "3,2", "4,5", "5,4"]);
  });

  it("returns 4 legal moves for white at the official initial position", () => {
    const board = createInitialBoard();
    const moves = legalMovesForBoard(board, "white");
    expect(moves).toHaveLength(4);
  });

  it("each move has at least one flip and does not include the placed square", () => {
    const board = createInitialBoard();
    const moves = legalMovesForBoard(board, "black");
    for (const m of moves) {
      expect(m.flips.length).toBeGreaterThanOrEqual(1);
      const placedKey = `${m.placedAt.row},${m.placedAt.col}`;
      const flipKeys = m.flips.map((f) => `${f.row},${f.col}`);
      expect(flipKeys).not.toContain(placedKey);
    }
  });
});

describe("findMove", () => {
  it("returns null for an occupied square", () => {
    const board = createInitialBoard();
    expect(findMove(board, "black", { row: 3, col: 3 })).toBeNull();
  });

  it("returns null for a non-flanking empty square", () => {
    const board = createInitialBoard();
    expect(findMove(board, "black", { row: 0, col: 0 })).toBeNull();
  });

  it("returns a move that captures exactly one disc on the standard opening", () => {
    const board = createInitialBoard();
    // Black at (2,3) flanks white at (3,3) against existing black at (4,3).
    const m = findMove(board, "black", { row: 2, col: 3 });
    expect(m).not.toBeNull();
    expect(m!.flips).toEqual([{ row: 3, col: 3 }]);
  });

  it("captures along a diagonal direction", () => {
    // Build a custom board: place black at A1 and white at B2; black plays C3
    // should flip B2.
    let board = createInitialBoard();
    // Wipe center then construct a small diagonal pattern away from default
    // discs to keep test focused. Just verify direction logic by patching.
    board = placeStone(board, { row: 0, col: 0 }, "black");
    board = placeStone(board, { row: 1, col: 1 }, "white");
    const m = findMove(board, "black", { row: 2, col: 2 });
    expect(m).not.toBeNull();
    expect(m!.flips).toEqual([{ row: 1, col: 1 }]);
  });
});
