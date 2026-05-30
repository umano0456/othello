import { applyMove, applyPass, createGame, legalMoves } from "@/game/game";
import { findMove } from "@/game/moves";
import type { Coord, GameState, PlayerProfile } from "@/game/types";

export type MatchState =
  | { readonly phase: "setup"; readonly profile: PlayerProfile }
  | {
      readonly phase: "playing";
      readonly game: GameState;
      readonly profile: PlayerProfile;
      readonly cpuThinking: boolean;
      readonly lastFlips: readonly Coord[];
      readonly focusedCell: Coord | null;
    }
  | {
      readonly phase: "finished";
      readonly game: GameState;
      readonly profile: PlayerProfile;
    };

export type MatchAction =
  | { type: "SETUP_CHANGE"; profile: Partial<PlayerProfile> }
  | { type: "START_MATCH" }
  | { type: "PLACE_STONE"; at: Coord }
  | { type: "CPU_MOVE"; at: Coord }
  | { type: "AUTO_PASS" }
  | { type: "CPU_THINKING"; thinking: boolean }
  | { type: "CLEAR_LAST_FLIPS" }
  | { type: "FOCUS_CELL"; at: Coord | null }
  | { type: "RESTART" };

export function initialMatchState(profile: PlayerProfile): MatchState {
  return { phase: "setup", profile };
}

function defaultFocusFor(game: GameState): Coord | null {
  const moves = legalMoves(game);
  if (moves.length === 0) return null;
  // Bias focus to the player's first legal move so keyboard users land on
  // something actionable when it's their turn.
  if (game.turn === game.playerColor) return moves[0].placedAt;
  return moves[0].placedAt;
}

function fromPlaying(
  state: MatchState & { phase: "playing" },
  game: GameState,
  lastFlips: readonly Coord[],
): MatchState {
  if (game.phase === "finished") {
    return { phase: "finished", game, profile: state.profile };
  }
  return {
    ...state,
    game,
    lastFlips,
    focusedCell: defaultFocusFor(game),
  };
}

export function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case "SETUP_CHANGE": {
      if (state.phase !== "setup") return state;
      const profile: PlayerProfile = {
        playerColor: action.profile.playerColor ?? state.profile.playerColor,
        strength: action.profile.strength ?? state.profile.strength,
        schemaVersion: 1,
      };
      return { phase: "setup", profile };
    }
    case "START_MATCH": {
      const profile = state.profile;
      const game = createGame(profile.playerColor, profile.strength);
      const focusedCell = defaultFocusFor(game);
      return {
        phase: "playing",
        game,
        profile,
        cpuThinking: false,
        lastFlips: [],
        focusedCell,
      };
    }
    case "PLACE_STONE": {
      if (state.phase !== "playing") return state;
      if (state.game.turn !== state.profile.playerColor) return state;
      const move = findMove(state.game.board, state.game.turn, action.at);
      if (!move) return state;
      const next = applyMove(state.game, move);
      return fromPlaying(state, next, move.flips);
    }
    case "CPU_MOVE": {
      if (state.phase !== "playing") return state;
      if (state.game.turn === state.profile.playerColor) return state;
      const move = findMove(state.game.board, state.game.turn, action.at);
      if (!move) return state;
      const next = applyMove(state.game, move);
      const playing = {
        ...state,
        cpuThinking: false,
      };
      return fromPlaying(playing, next, move.flips);
    }
    case "AUTO_PASS": {
      if (state.phase !== "playing") return state;
      if (legalMoves(state.game).length !== 0) return state;
      const next = applyPass(state.game);
      const playing = { ...state, cpuThinking: false };
      return fromPlaying(playing, next, []);
    }
    case "CPU_THINKING": {
      if (state.phase !== "playing") return state;
      if (state.cpuThinking === action.thinking) return state;
      return { ...state, cpuThinking: action.thinking };
    }
    case "CLEAR_LAST_FLIPS": {
      if (state.phase !== "playing") return state;
      if (state.lastFlips.length === 0) return state;
      return { ...state, lastFlips: [] };
    }
    case "FOCUS_CELL": {
      if (state.phase !== "playing") return state;
      return { ...state, focusedCell: action.at };
    }
    case "RESTART": {
      return { phase: "setup", profile: state.profile };
    }
  }
}
