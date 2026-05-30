"use client";

import { MatchScreen } from "@/ui/MatchScreen";
import { SetupPanel } from "@/ui/SetupPanel";
import { useMatch } from "@/state/useMatch";

export default function Home() {
  const {
    state,
    changeProfile,
    startMatch,
    placeStone,
    restart,
    focusCell,
  } = useMatch();

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[color:var(--color-bg)] px-4 py-6">
      {state.phase === "setup" && (
        <SetupPanel
          profile={state.profile}
          onProfileChange={changeProfile}
          onStart={startMatch}
        />
      )}
      {(state.phase === "playing" || state.phase === "finished") && (
        <MatchScreen
          game={state.game}
          cpuThinking={state.phase === "playing" ? state.cpuThinking : false}
          lastFlips={state.phase === "playing" ? state.lastFlips : []}
          focusedCell={state.phase === "playing" ? state.focusedCell : null}
          onCellActivate={placeStone}
          onFocusChange={focusCell}
          onRestart={restart}
        />
      )}
    </main>
  );
}
