import { describe, expect, it } from "vitest";
import {
  initialMatchState,
  matchReducer,
  type MatchState,
} from "@/state/matchReducer";
import { getDefaultProfile } from "@/game/types";

function newState(): MatchState {
  return initialMatchState(getDefaultProfile());
}

describe("matchReducer", () => {
  it("starts a match with the configured profile", () => {
    let state = newState();
    state = matchReducer(state, {
      type: "SETUP_CHANGE",
      profile: { playerColor: "white", strength: "hard" },
    });
    state = matchReducer(state, { type: "START_MATCH" });
    expect(state.phase).toBe("playing");
    if (state.phase === "playing") {
      expect(state.profile.playerColor).toBe("white");
      expect(state.profile.strength).toBe("hard");
      expect(state.game.playerColor).toBe("white");
      expect(state.game.turn).toBe("black");
    }
  });

  it("ignores PLACE_STONE when it's not the player's turn", () => {
    let state: MatchState = matchReducer(newState(), { type: "START_MATCH" });
    // Player is black by default; turn is black, so place once.
    state = matchReducer(state, { type: "PLACE_STONE", at: { row: 2, col: 3 } });
    if (state.phase !== "playing") throw new Error("expected playing phase");
    expect(state.game.turn).toBe("white");
    // Now player tries to place again — should be ignored because it's CPU's turn.
    const before = state.game;
    state = matchReducer(state, { type: "PLACE_STONE", at: { row: 2, col: 4 } });
    if (state.phase !== "playing") throw new Error("expected playing phase");
    expect(state.game).toBe(before);
  });

  it("RESTART returns to setup keeping the profile", () => {
    let state: MatchState = matchReducer(newState(), {
      type: "SETUP_CHANGE",
      profile: { strength: "easy" },
    });
    state = matchReducer(state, { type: "START_MATCH" });
    state = matchReducer(state, { type: "RESTART" });
    expect(state.phase).toBe("setup");
    if (state.phase === "setup") {
      expect(state.profile.strength).toBe("easy");
    }
  });

  it("CPU_THINKING toggles only when value changes", () => {
    let state: MatchState = matchReducer(newState(), { type: "START_MATCH" });
    const before = state;
    state = matchReducer(state, { type: "CPU_THINKING", thinking: false });
    expect(state).toBe(before); // identity preserved
    state = matchReducer(state, { type: "CPU_THINKING", thinking: true });
    expect(state).not.toBe(before);
  });
});
