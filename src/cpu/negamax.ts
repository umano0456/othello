import { applyMoveToBoard, legalMovesForBoard } from "@/game/moves";
import type { Board, Color, Coord, GameState } from "@/game/types";
import { opposite } from "@/game/types";
import {
  emptyCells,
  evaluateBoard,
  positionWeight,
  terminalScore,
} from "./evaluator";
import type { CPUStrategy } from "./strategy";

const DEFAULT_TIME_BUDGET_MS = 1500;
const ENDGAME_THRESHOLD = 12;

type SearchOptions = {
  timeBudgetMs?: number;
  maxDepth?: number;
};

function orderMoves(
  board: Board,
  color: Color,
): { coord: Coord; nextBoard: Board }[] {
  const moves = legalMovesForBoard(board, color);
  return moves
    .map((m) => ({ coord: m.placedAt, nextBoard: applyMoveToBoard(board, m) }))
    .sort(
      (a, b) => positionWeight(b.coord) - positionWeight(a.coord),
    );
}

function isTimeUp(deadline: number): boolean {
  return Date.now() >= deadline;
}

function negamax(
  board: Board,
  color: Color,
  depth: number,
  alpha: number,
  beta: number,
  deadline: number,
  endgame: boolean,
): number {
  if (isTimeUp(deadline)) {
    return endgame ? terminalScore(board, color) : evaluateBoard(board, color);
  }
  if (depth === 0) {
    return endgame ? terminalScore(board, color) : evaluateBoard(board, color);
  }
  const children = orderMoves(board, color);
  if (children.length === 0) {
    const oppMoves = legalMovesForBoard(board, opposite(color));
    if (oppMoves.length === 0) {
      return terminalScore(board, color);
    }
    // pass
    return -negamax(
      board,
      opposite(color),
      depth - 1,
      -beta,
      -alpha,
      deadline,
      endgame,
    );
  }
  let best = Number.NEGATIVE_INFINITY;
  let a = alpha;
  for (const child of children) {
    const score = -negamax(
      child.nextBoard,
      opposite(color),
      depth - 1,
      -beta,
      -a,
      deadline,
      endgame,
    );
    if (score > best) best = score;
    if (best > a) a = best;
    if (a >= beta) break;
    if (isTimeUp(deadline)) break;
  }
  return best;
}

export function findBestMove(
  state: GameState,
  options: SearchOptions = {},
): Coord {
  const moves = legalMovesForBoard(state.board, state.turn);
  if (moves.length === 0) {
    throw new Error("findBestMove called with no legal moves");
  }
  const empties = emptyCells(state.board);
  const endgame = empties <= ENDGAME_THRESHOLD;
  const deadline = Date.now() + (options.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS);

  const targetDepth = endgame
    ? Math.min(empties, options.maxDepth ?? empties)
    : (options.maxDepth ?? 4);

  let bestCoord: Coord = moves[0].placedAt;

  // Iterative deepening with αβ; restart at each depth using the previous
  // best as the head of the move list to improve pruning.
  for (let depth = 1; depth <= targetDepth; depth++) {
    let depthBest: { coord: Coord; score: number } | null = null;
    let alpha = Number.NEGATIVE_INFINITY;
    const beta = Number.POSITIVE_INFINITY;
    const ordered = orderMoves(state.board, state.turn);
    // Move the previous best to the front.
    ordered.sort((a, b) => {
      if (sameCoord(a.coord, bestCoord)) return -1;
      if (sameCoord(b.coord, bestCoord)) return 1;
      return positionWeight(b.coord) - positionWeight(a.coord);
    });
    for (const child of ordered) {
      const score = -negamax(
        child.nextBoard,
        opposite(state.turn),
        depth - 1,
        -beta,
        -alpha,
        deadline,
        endgame,
      );
      if (depthBest === null || score > depthBest.score) {
        depthBest = { coord: child.coord, score };
      }
      if (score > alpha) alpha = score;
      if (isTimeUp(deadline)) break;
    }
    if (depthBest) bestCoord = depthBest.coord;
    if (isTimeUp(deadline)) break;
  }
  return bestCoord;
}

function sameCoord(a: Coord, b: Coord): boolean {
  return a.row === b.row && a.col === b.col;
}

export class NegamaxStrategy implements CPUStrategy {
  readonly strength = "hard" as const;
  private readonly options: SearchOptions;

  constructor(options: SearchOptions = {}) {
    this.options = options;
  }

  selectMove(state: GameState): Coord {
    return findBestMove(state, this.options);
  }
}
