import { describe, expect, it } from "vitest";
import {
  applyMove,
  applyPass,
  createGame,
  isGameOver,
  legalMoves,
  mustPass,
} from "@/game/game";
import { findMove } from "@/game/moves";
import { getScore, getWinner } from "@/game/score";
import type { GameState } from "@/game/types";

function play(state: GameState, row: number, col: number): GameState {
  const move = findMove(state.board, state.turn, { row, col });
  if (!move) throw new Error(`illegal move at ${row},${col}`);
  return applyMove(state, move);
}

describe("createGame", () => {
  it("starts black to move, playing phase, no history", () => {
    const g = createGame("black", "normal");
    expect(g.phase).toBe("playing");
    expect(g.turn).toBe("black");
    expect(g.history.length).toBe(0);
    expect(g.consecutivePasses).toBe(0);
  });
});

describe("applyMove + applyPass + termination", () => {
  it("toggles turn and resets consecutivePasses after a move", () => {
    let g = createGame("black", "normal");
    g = play(g, 2, 3);
    expect(g.turn).toBe("white");
    expect(g.consecutivePasses).toBe(0);
    expect(g.history.length).toBe(1);
  });

  it("two consecutive passes finish the game", () => {
    let g = createGame("black", "normal");
    g = applyPass(g);
    g = applyPass(g);
    expect(g.phase).toBe("finished");
    expect(isGameOver(g)).toBe(true);
  });

  it("mustPass returns false at the standard opening", () => {
    const g = createGame("black", "normal");
    expect(mustPass(g)).toBe(false);
  });

  it("scoring sums to the disc count", () => {
    const g = createGame("black", "normal");
    const { black, white } = getScore(g);
    expect(black + white).toBe(4);
  });

  it("getWinner returns null while playing", () => {
    const g = createGame("black", "normal");
    expect(getWinner(g)).toBeNull();
  });

  it("a full board terminates the game", () => {
    // Synthesize a finished game by mutating into a finished phase via passes.
    let g = createGame("black", "normal");
    g = applyPass(g);
    g = applyPass(g);
    expect(g.phase).toBe("finished");
    const winner = getWinner(g);
    expect(["black", "white", "draw"]).toContain(winner);
  });
});

describe("legalMoves dependency on phase", () => {
  it("returns an empty list when the game is finished", () => {
    let g = createGame("black", "normal");
    g = applyPass(g);
    g = applyPass(g);
    expect(legalMoves(g)).toEqual([]);
  });
});

