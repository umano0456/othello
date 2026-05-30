"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { createStrategy } from "@/cpu";
import { legalMoves } from "@/game/game";
import type { Coord, PlayerProfile } from "@/game/types";
import { loadProfile, saveProfile } from "@/lib/persistence";
import {
  initialMatchState,
  matchReducer,
  type MatchAction,
  type MatchState,
} from "./matchReducer";

const FLIP_ANIMATION_MS = 280;
const CPU_THINKING_MIN_VISIBLE_MS = 200;

export function useMatch(initialProfile?: PlayerProfile): {
  state: MatchState;
  dispatch: (action: MatchAction) => void;
  changeProfile: (next: Partial<PlayerProfile>) => void;
  startMatch: () => void;
  placeStone: (at: Coord) => void;
  restart: () => void;
  focusCell: (at: Coord | null) => void;
} {
  const [state, dispatch] = useReducer(
    matchReducer,
    initialProfile ?? null,
    (seed) =>
      seed ? initialMatchState(seed) : initialMatchState(loadProfile()),
  );

  // On first mount in the browser, hydrate from localStorage if no initial
  // profile was provided.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (initialProfile) return;
    const profile = loadProfile();
    dispatch({ type: "SETUP_CHANGE", profile });
  }, [initialProfile]);

  // Persist profile whenever it changes while still in setup.
  const setupProfile = state.phase === "setup" ? state.profile : null;
  useEffect(() => {
    if (setupProfile) saveProfile(setupProfile);
  }, [setupProfile]);

  // Drive CPU turns and auto-pass.
  const playingGame = state.phase === "playing" ? state.game : null;
  const playerColorForEffect =
    state.phase === "playing" ? state.profile.playerColor : null;
  useEffect(() => {
    if (!playingGame || !playerColorForEffect) return;
    const game = playingGame;
    const moves = legalMoves(game);

    if (moves.length === 0) {
      const id = window.setTimeout(() => {
        dispatch({ type: "AUTO_PASS" });
      }, 400);
      return () => window.clearTimeout(id);
    }

    if (game.turn === playerColorForEffect) return;

    let cancelled = false;
    const thinkingStart = Date.now();
    dispatch({ type: "CPU_THINKING", thinking: true });

    const compute = () => {
      try {
        const strategy = createStrategy(game.strength);
        const at = strategy.selectMove(game);
        const elapsed = Date.now() - thinkingStart;
        const remainingForVisibility = Math.max(
          0,
          CPU_THINKING_MIN_VISIBLE_MS - elapsed,
        );
        window.setTimeout(() => {
          if (cancelled) return;
          dispatch({ type: "CPU_MOVE", at });
        }, remainingForVisibility);
      } catch {
        if (!cancelled) {
          dispatch({ type: "CPU_THINKING", thinking: false });
        }
      }
    };

    // Defer one frame so the "CPU thinking" indicator is visible before any
    // synchronous heavy search blocks the main thread.
    const handle = window.setTimeout(compute, 30);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [playingGame, playerColorForEffect]);

  // Clear last flips after the animation completes.
  const playingFlips = state.phase === "playing" ? state.lastFlips : null;
  useEffect(() => {
    if (!playingFlips || playingFlips.length === 0) return;
    const id = window.setTimeout(() => {
      dispatch({ type: "CLEAR_LAST_FLIPS" });
    }, FLIP_ANIMATION_MS);
    return () => window.clearTimeout(id);
  }, [playingFlips]);

  const changeProfile = useCallback((next: Partial<PlayerProfile>) => {
    dispatch({ type: "SETUP_CHANGE", profile: next });
  }, []);
  const startMatch = useCallback(() => {
    dispatch({ type: "START_MATCH" });
  }, []);
  const placeStone = useCallback((at: Coord) => {
    dispatch({ type: "PLACE_STONE", at });
  }, []);
  const restart = useCallback(() => {
    dispatch({ type: "RESTART" });
  }, []);
  const focusCell = useCallback((at: Coord | null) => {
    dispatch({ type: "FOCUS_CELL", at });
  }, []);

  return {
    state,
    dispatch,
    changeProfile,
    startMatch,
    placeStone,
    restart,
    focusCell,
  };
}
