"use client";

import { memo } from "react";
import type { Cell, Coord } from "@/game/types";

const COL_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function describeCell(cell: Cell, isLegal: boolean, coord: Coord): string {
  const label = `${COL_LABELS[coord.col]}${coord.row + 1}`;
  if (cell === "black") return `${label}、黒石`;
  if (cell === "white") return `${label}、白石`;
  if (isLegal) return `${label}、合法手`;
  return `${label}、空`;
}

export type CellViewProps = {
  coord: Coord;
  cell: Cell;
  isLegal: boolean;
  isLastFlip: boolean;
  isFocused: boolean;
  myTurn: boolean;
  onActivate: (coord: Coord) => void;
  onFocus: (coord: Coord) => void;
};

const CellViewImpl = (props: CellViewProps) => {
  const {
    coord,
    cell,
    isLegal,
    isLastFlip,
    isFocused,
    myTurn,
    onActivate,
    onFocus,
  } = props;
  const interactable = myTurn && isLegal;
  const ariaLabel = describeCell(cell, isLegal && myTurn, coord);
  const showHint = isLegal && myTurn && cell === "empty";
  return (
    <button
      type="button"
      role="gridcell"
      aria-label={ariaLabel}
      aria-rowindex={coord.row + 1}
      aria-colindex={coord.col + 1}
      aria-disabled={!interactable}
      tabIndex={isFocused ? 0 : -1}
      data-state={cell}
      data-legal={isLegal && myTurn ? "true" : "false"}
      data-last-flip={isLastFlip ? "true" : "false"}
      onClick={() => {
        if (interactable) onActivate(coord);
      }}
      onFocus={() => onFocus(coord)}
      className={[
        "relative flex items-center justify-center",
        "aspect-square",
        "min-w-[32px] min-h-[32px]",
        "border border-[color:var(--color-board-line)]",
        "bg-[color:var(--color-board)]",
        "transition-colors duration-100",
        interactable ? "cursor-pointer hover:brightness-110" : "cursor-default",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)] focus-visible:ring-inset",
      ].join(" ")}
    >
      {cell !== "empty" && (
        <span
          className={[
            "absolute inset-[10%] rounded-full",
            cell === "black"
              ? "bg-[color:var(--color-stone-black)]"
              : "bg-[color:var(--color-stone-white)]",
            "shadow-[0_2px_4px_rgba(0,0,0,0.3)]",
            isLastFlip ? "othello-flip" : "",
          ].join(" ")}
          aria-hidden="true"
        />
      )}
      {showHint && (
        <span
          aria-hidden="true"
          className="absolute h-[28%] w-[28%] rounded-full bg-[color:var(--color-legal-hint)] opacity-70 transition-opacity"
          style={{ transitionDuration: "var(--duration-hint)" }}
        />
      )}
    </button>
  );
};

export const CellView = memo(CellViewImpl);
