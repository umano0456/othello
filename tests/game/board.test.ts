import { describe, expect, it } from "vitest";
import {
  countCells,
  createInitialBoard,
  flipStones,
  getCell,
  placeStone,
} from "@/game/board";

describe("createInitialBoard", () => {
  it("places the official starting four discs at the center", () => {
    const board = createInitialBoard();
    expect(getCell(board, { row: 3, col: 3 })).toBe("white");
    expect(getCell(board, { row: 3, col: 4 })).toBe("black");
    expect(getCell(board, { row: 4, col: 3 })).toBe("black");
    expect(getCell(board, { row: 4, col: 4 })).toBe("white");
  });

  it("has 60 empty cells, 2 black, 2 white", () => {
    const board = createInitialBoard();
    const counts = countCells(board);
    expect(counts).toEqual({ black: 2, white: 2, empty: 60 });
  });

  it("is structurally equal between invocations", () => {
    const a = createInitialBoard();
    const b = createInitialBoard();
    expect(a).toEqual(b);
  });
});

describe("getCell", () => {
  it("throws on out-of-range coordinates", () => {
    const board = createInitialBoard();
    expect(() => getCell(board, { row: -1, col: 0 })).toThrow(RangeError);
    expect(() => getCell(board, { row: 0, col: 8 })).toThrow(RangeError);
  });
});

describe("placeStone / flipStones", () => {
  it("returns a new board without mutating the original", () => {
    const original = createInitialBoard();
    const next = placeStone(original, { row: 2, col: 3 }, "black");
    expect(next).not.toBe(original);
    expect(getCell(original, { row: 2, col: 3 })).toBe("empty");
    expect(getCell(next, { row: 2, col: 3 })).toBe("black");
  });

  it("flips multiple coordinates to the given color", () => {
    const original = createInitialBoard();
    const flipped = flipStones(
      original,
      [
        { row: 3, col: 3 },
        { row: 4, col: 4 },
      ],
      "black",
    );
    expect(getCell(flipped, { row: 3, col: 3 })).toBe("black");
    expect(getCell(flipped, { row: 4, col: 4 })).toBe("black");
    expect(getCell(original, { row: 3, col: 3 })).toBe("white");
  });
});
