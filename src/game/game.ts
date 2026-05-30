import { countCells } from "./board";
import { createInitialBoard } from "./board";
import { applyMoveToBoard, legalMovesForBoard } from "./moves";
import type { Color, GameState, Move, Strength } from "./types";
import { opposite } from "./types";

export function createGame(playerColor: Color, strength: Strength): GameState {
  return {
    board: createInitialBoard(),
    turn: "black",
    playerColor,
    strength,
    history: [],
    consecutivePasses: 0,
    phase: "playing",
  };
}

export function legalMoves(state: GameState): readonly Move[] {
  if (state.phase !== "playing") return [];
  return legalMovesForBoard(state.board, state.turn);
}

function isTerminal(state: Pick<GameState, "board" | "consecutivePasses">): boolean {
  const { black, white, empty } = countCells(state.board);
  if (empty === 0) return true;
  if (black === 0 || white === 0) return true;
  if (state.consecutivePasses >= 2) return true;
  return false;
}

export function applyMove(state: GameState, move: Move): GameState {
  if (state.phase !== "playing") {
    throw new Error("cannot apply move to a non-playing game");
  }
  if (move.color !== state.turn) {
    throw new Error("move color does not match current turn");
  }
  const board = applyMoveToBoard(state.board, move);
  const nextHistory: Move[] = [...state.history, move];
  const next: GameState = {
    ...state,
    board,
    turn: opposite(state.turn),
    consecutivePasses: 0,
    history: nextHistory,
  };
  const finished = isTerminal({ board, consecutivePasses: 0 });
  return finished ? { ...next, phase: "finished" } : next;
}

export function applyPass(state: GameState): GameState {
  if (state.phase !== "playing") {
    throw new Error("cannot pass on a non-playing game");
  }
  const next: GameState = {
    ...state,
    turn: opposite(state.turn),
    consecutivePasses: (state.consecutivePasses + 1) as 0 | 1 | 2,
  };
  const finished = isTerminal({
    board: next.board,
    consecutivePasses: next.consecutivePasses,
  });
  return finished ? { ...next, phase: "finished" } : next;
}

export function isGameOver(state: GameState): boolean {
  return state.phase === "finished";
}

export function mustPass(state: GameState): boolean {
  if (state.phase !== "playing") return false;
  return legalMoves(state).length === 0;
}
