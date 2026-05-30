"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
} from "react";
import { BOARD_SIZE } from "@/game/directions";
import type { Board, Coord } from "@/game/types";
import { CellView } from "./CellView";

export type BoardViewProps = {
  board: Board;
  legalCoords: ReadonlySet<string>;
  lastFlips: readonly Coord[];
  focusedCell: Coord | null;
  myTurn: boolean;
  onCellActivate: (coord: Coord) => void;
  onFocusChange: (coord: Coord | null) => void;
};

export function coordKey(c: Coord): string {
  return `${c.row},${c.col}`;
}

function clampCoord(row: number, col: number): Coord {
  return {
    row: Math.max(0, Math.min(BOARD_SIZE - 1, row)),
    col: Math.max(0, Math.min(BOARD_SIZE - 1, col)),
  };
}

export function BoardView({
  board,
  legalCoords,
  lastFlips,
  focusedCell,
  myTurn,
  onCellActivate,
  onFocusChange,
}: BoardViewProps) {
  const lastFlipKeys = new Set(lastFlips.map(coordKey));
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Move keyboard focus to the focused cell when it changes.
  useEffect(() => {
    if (!focusedCell) return;
    const container = containerRef.current;
    if (!container) return;
    const selector = `[aria-rowindex="${focusedCell.row + 1}"][aria-colindex="${focusedCell.col + 1}"]`;
    const el = container.querySelector<HTMLButtonElement>(selector);
    if (el && document.activeElement !== el && container.contains(document.activeElement)) {
      el.focus();
    }
  }, [focusedCell]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!focusedCell) return;
      const { row, col } = focusedCell;
      let next: Coord | null = null;
      switch (event.key) {
        case "ArrowUp":
          next = clampCoord(row - 1, col);
          break;
        case "ArrowDown":
          next = clampCoord(row + 1, col);
          break;
        case "ArrowLeft":
          next = clampCoord(row, col - 1);
          break;
        case "ArrowRight":
          next = clampCoord(row, col + 1);
          break;
        case "Home":
          next = event.ctrlKey ? { row: 0, col: 0 } : { row, col: 0 };
          break;
        case "End":
          next = event.ctrlKey
            ? { row: BOARD_SIZE - 1, col: BOARD_SIZE - 1 }
            : { row, col: BOARD_SIZE - 1 };
          break;
        case "Enter":
        case " ":
          if (myTurn && legalCoords.has(coordKey(focusedCell))) {
            event.preventDefault();
            onCellActivate(focusedCell);
          }
          return;
        default:
          return;
      }
      if (next) {
        event.preventDefault();
        onFocusChange(next);
      }
    },
    [focusedCell, legalCoords, myTurn, onCellActivate, onFocusChange],
  );

  return (
    <div
      ref={containerRef}
      role="grid"
      aria-label="オセロ盤面 8 行 8 列"
      aria-rowcount={BOARD_SIZE}
      aria-colcount={BOARD_SIZE}
      onKeyDown={handleKeyDown}
      className={[
        "grid grid-cols-8 grid-rows-8",
        "w-[min(92vmin,640px)] aspect-square",
        "rounded-md overflow-hidden",
        "border-2 border-[color:var(--color-board-line)]",
        "shadow-[0_4px_16px_rgba(0,0,0,0.15)]",
        "bg-[color:var(--color-board)]",
      ].join(" ")}
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const coord = { row: r, col: c };
          const key = coordKey(coord);
          return (
            <CellView
              key={key}
              coord={coord}
              cell={cell}
              isLegal={legalCoords.has(key)}
              isLastFlip={lastFlipKeys.has(key)}
              isFocused={
                focusedCell
                  ? focusedCell.row === r && focusedCell.col === c
                  : r === 0 && c === 0
              }
              myTurn={myTurn}
              onActivate={onCellActivate}
              onFocus={onFocusChange}
            />
          );
        }),
      )}
    </div>
  );
}
