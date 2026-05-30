import { describe, expect, it } from "vitest";
import { getScoreFromBoard } from "@/game/score";
import { createInitialBoard, placeStone } from "@/game/board";

describe("getScoreFromBoard", () => {
  it("returns 2-2 at the initial position", () => {
    const board = createInitialBoard();
    expect(getScoreFromBoard(board)).toEqual({ black: 2, white: 2 });
  });

  it("increments black after placing a black stone", () => {
    let board = createInitialBoard();
    board = placeStone(board, { row: 0, col: 0 }, "black");
    expect(getScoreFromBoard(board)).toEqual({ black: 3, white: 2 });
  });
});
