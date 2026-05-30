export type Color = "black" | "white";

export type Cell = "empty" | "black" | "white";

export type Coord = { readonly row: number; readonly col: number };

export type BoardRow = readonly [
  Cell,
  Cell,
  Cell,
  Cell,
  Cell,
  Cell,
  Cell,
  Cell,
];

export type Board = readonly [
  BoardRow,
  BoardRow,
  BoardRow,
  BoardRow,
  BoardRow,
  BoardRow,
  BoardRow,
  BoardRow,
];

export type Move = {
  readonly color: Color;
  readonly placedAt: Coord;
  readonly flips: readonly Coord[];
};

export type Strength = "easy" | "normal" | "hard";

export type MatchPhase = "setup" | "playing" | "finished";

export type GameState = {
  readonly board: Board;
  readonly turn: Color;
  readonly playerColor: Color;
  readonly strength: Strength;
  readonly history: readonly Move[];
  readonly consecutivePasses: 0 | 1 | 2;
  readonly phase: MatchPhase;
};

export type PlayerProfile = {
  readonly playerColor: Color;
  readonly strength: Strength;
  readonly schemaVersion: 1;
};

export const STRENGTH_LABEL_JA: Record<Strength, string> = {
  easy: "弱い",
  normal: "普通",
  hard: "強い",
};

export const COLOR_LABEL_JA: Record<Color, string> = {
  black: "黒",
  white: "白",
};

export function opposite(color: Color): Color {
  return color === "black" ? "white" : "black";
}

export function getDefaultProfile(): PlayerProfile {
  return { playerColor: "black", strength: "normal", schemaVersion: 1 };
}
