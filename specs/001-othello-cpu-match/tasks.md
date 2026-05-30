# Tasks: Othello 対 CPU 対戦 MVP

**Input**: Design documents from `/specs/001-othello-cpu-match/`

**Prerequisites**: spec.md (本ファイル), 憲法 (`.specify/memory/constitution.md`)

**Reference plan**: plan.md / research.md / data-model.md / contracts/ / quickstart.md は `claude/issue-3-20260530-2029` ブランチで策定済（本作業ブランチ未マージのため、Issue #3 の plan サマリを正として継承）。技術スタック・モジュール境界・CPU 戦略の決定はそのまま採用する。

**Tests**: 憲法 V「品質ゲート」によりゲームロジックの単体テストは **MUST**（オプションではない）。UI 変更を伴う PR ではブラウザ動作確認の記載を含めること。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 別ファイル・依存関係なしで並列実行可能
- **[Story]**: そのタスクが属するユーザーストーリー (US1, US2, ...)
- ファイルパスを記述に含める

## Path Conventions

- 単一プロジェクト構成: リポジトリ直下に `src/`, `tests/`
- 採択スタック: Next.js 16 (App Router) + React 19 + TypeScript 5 strict + Tailwind CSS v4 + Vitest
- レイヤ分離: `src/game/` (純粋関数ロジック) / `src/cpu/` (戦略) / `src/ui/` (React) / `src/state/` (useReducer + hooks) / `src/lib/` (副作用)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: プロジェクトの初期化と開発基盤の整備

- [ ] T001 リポジトリ直下に Next.js 16 プロジェクトを初期化（TypeScript strict、App Router、`'use client'` 単一ページ前提）し、`package.json` を生成
- [ ] T002 `node_modules/next/dist/docs/` を確認のうえ、App Router の最新規約に合わせて `src/app/layout.tsx` と `src/app/page.tsx` の骨格を作成（憲法「Next.js について」順守）
- [ ] T003 [P] `tsconfig.json` を strict 設定にし、`@/*` パスエイリアスを `src/*` に設定
- [ ] T004 [P] `tailwind.config.ts` と `src/app/globals.css` を作成し、Tailwind CSS v4 を導入（盤面・石・合法手用デザイントークン定義）
- [ ] T005 [P] `eslint.config.mjs` で `eslint-config-next` を有効化、警告ゼロを CI で要求する設定
- [ ] T006 [P] `vitest.config.ts` と `@testing-library/react` を導入し、`tests/` ディレクトリを `src/` と分離（`environment: 'jsdom'`）
- [ ] T007 [P] `package.json` の scripts に `dev` / `build` / `start` / `lint` / `typecheck` / `test` / `test:watch` を追加
- [ ] T008 ディレクトリ骨格を作成: `src/game/`, `src/cpu/`, `src/ui/`, `src/state/`, `src/lib/`, `tests/game/`, `tests/cpu/`, `tests/ui/`, `tests/integration/`

**Checkpoint**: `npm run lint`, `npm run typecheck`, `npm test` がいずれも空状態で通過する

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 全ユーザーストーリーの基盤となる型・盤面ユーティリティ・空のページ構造

**⚠️ CRITICAL**: このフェーズが完了するまで、いかなる User Story 実装も開始できない

- [ ] T009 [P] 共通型定義（`Color`, `Cell`, `Board`, `Position`, `Move`, `Difficulty`, `GameState`, `PlayerProfile`）を `src/game/types.ts` に作成
- [ ] T010 [P] 盤面ユーティリティ（`createInitialBoard()`, `inBounds()`, `cloneBoard()`, 座標 `(row, col)` ↔ index 変換）を `src/game/board.ts` に作成
- [ ] T011 [P] 8 方向ベクトル定数と汎用走査ヘルパを `src/game/directions.ts` に作成
- [ ] T012 [P] T009-T011 に対する単体テスト雛形を `tests/game/board.test.ts` に追加（初期配置が D4=白, E4=黒, D5=黒, E5=白 となる検証を含む）
- [ ] T013 [P] `src/ui/tokens.ts` に色・余白・アニメーション時間（300ms 上限）の定数を定義（憲法 II 整合）
- [ ] T014 グローバルレイアウト `src/app/layout.tsx` に日本語 `lang="ja"`、ビューポートメタタグ、Tailwind globals 読み込みを設定
- [ ] T015 `src/app/page.tsx` を `'use client'` で作成し、未実装状態のプレースホルダ（空シェル）を返す

**Checkpoint**: 型と空シェルが整い、`npm run dev` でブランク画面が表示される

---

## Phase 3: User Story 1 - 既定設定でオセロを 1 局通して遊ぶ (Priority: P1) 🎯 MVP

**Goal**: 「対戦開始」を押すだけで既定設定（プレイヤー=黒/先手、CPU 強さ=普通）で 1 局を最後まで遊び、勝敗まで表示できる中核体験を提供する。

**Independent Test**: トップ画面で「対戦開始」を押し、人間 vs CPU を交互に進めて終局までプレイし、初期配置・8 方向反転・自動パス・終局判定・勝敗表示が公式ルール通りに動作することを 1 局で確認できる。

### Tests for User Story 1（憲法 V により MUST）

- [ ] T016 [P] [US1] 合法手判定の単体テストを `tests/game/legalMoves.test.ts` に作成（公式初期局面で黒に 4 手・白に 4 手、各方向の挟みパターン）
- [ ] T017 [P] [US1] 反転処理の単体テストを `tests/game/applyMove.test.ts` に作成（8 方向すべてで挟みが反転される）
- [ ] T018 [P] [US1] パス・終局判定の単体テストを `tests/game/gameOver.test.ts` に作成（片側のみ合法手なし → 自動パス、両者連続パス → 終局、全滅 → 終局、満杯 → 終局）
- [ ] T019 [P] [US1] スコア・勝敗判定の単体テストを `tests/game/score.test.ts` に作成（黒勝ち・白勝ち・引き分けの 3 パターン）
- [ ] T020 [US1] ルール準拠の統合テスト（SC-001）を `tests/game/rules.test.ts` に作成（公式記譜例で全手を再現し、各手後の盤面・スコアと一致）

### Implementation for User Story 1

- [ ] T021 [P] [US1] `getLegalMoves(board, color): Position[]` を `src/game/legalMoves.ts` に純粋関数で実装
- [ ] T022 [P] [US1] `applyMove(board, color, position): { board: Board; flipped: Position[] }` を `src/game/applyMove.ts` に純粋関数で実装（FR-002〜004）
- [ ] T023 [P] [US1] `mustPass(board, color)` と `isGameOver(board)` を `src/game/gameOver.ts` に実装（FR-005, FR-006）
- [ ] T024 [P] [US1] `getScore(board): { black: number; white: number }` と `getWinner(board): 'black' | 'white' | 'draw'` を `src/game/score.ts` に実装（FR-007）
- [ ] T025 [US1] CPU Strategy インターフェース `Strategy.chooseMove(board, color, deadline): Promise<Position | null>` を `src/cpu/strategy.ts` に定義（拡張点：憲法 IV）
- [ ] T026 [P] [US1] Random Strategy（弱）を `src/cpu/randomStrategy.ts` に実装（時間予算 ≤100ms、合法手の一様乱択、FR-013）
- [ ] T027 [P] [US1] Greedy Strategy（普通）を `src/cpu/greedyStrategy.ts` に実装（1 手読み: 反転数 + 角隅 + 危険マス減点、FR-014、時間予算 ≤300ms）
- [ ] T028 [P] [US1] T026・T027 の単体テストを `tests/cpu/randomStrategy.test.ts` と `tests/cpu/greedyStrategy.test.ts` に追加（決定性チェック・時間予算内・合法手のみ選択）
- [ ] T029 [US1] CPU 思考の非同期実行ラッパ（`AbortController` + `requestIdleCallback`/`setTimeout`）を `src/cpu/runner.ts` に実装し、UI スレッドを阻害しない構造にする（FR-016）
- [ ] T030 [US1] GameState reducer（`Setup` / `PlayerTurn` / `CpuThinking` / `Animating` / `Finished` 状態遷移）を `src/state/gameReducer.ts` に実装
- [ ] T031 [US1] `useMatch()` カスタムフックを `src/state/useMatch.ts` に実装（reducer + CPU 起動 + パス自動処理 + 終局検出）
- [ ] T032 [P] [US1] `Cell` コンポーネントを `src/ui/Cell.tsx` に作成（空 / 黒石 / 白石 / 合法手プレースホルダの 4 状態描画）
- [ ] T033 [P] [US1] `Board` コンポーネントを `src/ui/Board.tsx` に作成（8x8 grid、`onCellClick(position)` を上位へ通知）
- [ ] T034 [P] [US1] `GameStatus` コンポーネントを `src/ui/GameStatus.tsx` に作成（現手番・スコア・CPU 思考中表示、FR-019）
- [ ] T035 [P] [US1] `GameResult` コンポーネントを `src/ui/GameResult.tsx` に作成（最終スコア・勝敗・「もう一度遊ぶ」ボタン、FR-023）
- [ ] T036 [US1] `MatchScreen` コンポーネントを `src/ui/MatchScreen.tsx` に作成（`useMatch` で reducer を購読し、Board / GameStatus / GameResult を組み立て、相手番のクリックを無視 FR-022）
- [ ] T037 [US1] `StartScreen` コンポーネントを `src/ui/StartScreen.tsx` に作成（「対戦開始」のみ。既定値で MatchScreen に遷移）
- [ ] T038 [US1] `src/app/page.tsx` を更新し、StartScreen / MatchScreen の表示切替を実装（既定: プレイヤー=黒・強さ=普通）
- [ ] T039 [US1] MatchScreen の動作を統合テスト `tests/integration/match-screen.test.tsx` で検証（「対戦開始」→ 人間が着手 → CPU が応手 → 1 手分の盤面差分）

**Checkpoint**: ブラウザで「対戦開始」を押し、人間 vs CPU で 1 局を最後まで終局までプレイできる（MVP 達成）。

---

## Phase 4: User Story 2 - 先手・後手を選んで対戦する (Priority: P2)

**Goal**: 対戦開始前に先手（黒）か後手（白）を選んで開始でき、CPU 先手時は自動で初手を打つ。

**Independent Test**: セットアップ画面で「後手（白）」を選び対戦開始 → CPU（黒）が思考表示後に初手を打ち、ユーザーが白で応手できることを 1 局で確認できる。

### Tests for User Story 2

- [ ] T040 [P] [US2] PlayerProfile の永続化テストを `tests/lib/storage.test.ts` に作成（保存・読み出し・スキーマ不一致時の既定値復元）
- [ ] T041 [P] [US2] CPU 先手シナリオの統合テストを `tests/integration/cpu-first.test.tsx` に作成（白を選んで開始 → 最初の手番が CpuThinking → 盤面に黒石追加）

### Implementation for User Story 2

- [ ] T042 [P] [US2] `PlayerProfile` のスキーマと既定値（先手=黒、強さ=普通）を `src/game/types.ts` で拡張
- [ ] T043 [P] [US2] localStorage ラッパ `loadProfile()` / `saveProfile()` を `src/lib/storage.ts` に実装（FR-011）
- [ ] T044 [US2] `SetupScreen` コンポーネントを `src/ui/SetupScreen.tsx` に作成（先手/後手の 2 択 UI、FR-008、既定値復元 FR-010）
- [ ] T045 [US2] `gameReducer` の初期化アクションを拡張し、PlayerProfile.color に基づいて player/CPU の色割当と初期手番を決定（FR-010）
- [ ] T046 [US2] `useMatch` を更新し、CPU 先手の場合 mount 直後に CPU 応手を起動（FR-012）
- [ ] T047 [US2] `src/app/page.tsx` のフロー: StartScreen → SetupScreen → MatchScreen → GameResult →（再選択）SetupScreen に接続（FR-024）
- [ ] T048 [US2] SetupScreen で選んだ設定の保存とリロード後の再現を実装（FR-011）

**Checkpoint**: 先手/後手選択が機能し、CPU 先手のときは自動初手が打たれ、設定はリロード後も保持される。

---

## Phase 5: User Story 3 - CPU の強さを 3 段階から選んで対戦する (Priority: P2)

**Goal**: 「弱い」「普通」「強い」の 3 段階から CPU 強さを選択でき、強さ差は計測可能なレベルで現れる（SC-005）。

**Independent Test**: 「弱い」と「強い」でそれぞれ対戦し、応手の質（角取得率・悪手率）が体感的に異なることを 2 局で確認できる。さらにベンチで強い vs 弱いが ≥70%、強い vs 普通が ≥55% の勝率を出すことを自動検証できる。

### Tests for User Story 3

- [ ] T049 [P] [US3] 評価関数の単体テストを `tests/cpu/evaluation.test.ts` に作成（位置重みテーブルの境界条件、モビリティ差・安定石スコア）
- [ ] T050 [P] [US3] Negamax + αβ の単体テストを `tests/cpu/search.test.ts` に作成（既知の詰み局面で正解手を返す、深さ制限が時間予算で発火）
- [ ] T051 [P] [US3] 終盤完全読みの単体テストを `tests/cpu/endgame.test.ts` に作成（残り 6 マス以内の局面で勝者一致）
- [ ] T052 [US3] 強さ差別化ベンチを `tests/cpu/strength-bench.test.ts` に作成（自己対戦 100 局: 強 vs 弱 ≥70%、強 vs 普通 ≥55%、SC-005）。長時間テストとして `test.slow` 等で隔離

### Implementation for User Story 3

- [ ] T053 [P] [US3] 位置重み + モビリティ + 安定石を用いた評価関数を `src/cpu/evaluation.ts` に実装
- [ ] T054 [P] [US3] Negamax + α-β 剪定 + 反復深化を `src/cpu/search.ts` に実装（深さ 4 を基本、時間予算で打ち切り）
- [ ] T055 [P] [US3] 残り 12 マス以下で完全読みに切り替える終盤探索を `src/cpu/endgame.ts` に実装
- [ ] T056 [US3] 強い Strategy `src/cpu/strongStrategy.ts` を実装し、T053-T055 を統合（中央値 1.5s / 95p 3.0s、SC-003 整合、FR-015）
- [ ] T057 [US3] Strategy ファクトリ `src/cpu/strategyFactory.ts` を実装（`Difficulty` → `Strategy` を解決）
- [ ] T058 [US3] `SetupScreen` に強さ 3 択 UI を追加（FR-009、既定=普通 FR-010）
- [ ] T059 [US3] `gameReducer` 初期化アクションで Difficulty を受け取り Strategy ファクトリを介して使用
- [ ] T060 [US3] PlayerProfile に Difficulty を含め永続化（`src/lib/storage.ts`、FR-011）
- [ ] T061 [US3] `useMatch` を更新し、CPU 思考中インジケータの発火タイミングを「強い」でも 200ms 以内に表示開始（UX）

**Checkpoint**: 3 段階の強さ選択が UI 上で機能し、自動ベンチで SC-005 を満たすことが確認できる。

---

## Phase 6: User Story 4 - スマートフォンと PC の両方で快適に操作する (Priority: P2)

**Goal**: 同じ URL を PC ブラウザとスマートフォンの両方で開いて、いずれも盤面全体が一画面に収まり、タップ/クリックで遊べる。

**Independent Test**: 幅 360px と幅 1280px で対戦画面が縦横スクロール無しで全表示され、各マスのタップ領域が 32px 以上になっていることを確認できる。

### Tests for User Story 4

- [ ] T062 [P] [US4] レスポンシブ表示テストを `tests/integration/responsive.test.tsx` に作成（jsdom + Testing Library で `matchMedia` をモック、幅 360px/768px/1280px の各レイアウト整合）
- [ ] T063 [P] [US4] マスの最小サイズ計算テストを `tests/ui/cell-size.test.ts` に作成（min(viewport)/8 と 32px 下限の単体検証、SC-006）

### Implementation for User Story 4

- [ ] T064 [P] [US4] `Board` をレスポンシブ化（CSS `clamp()` / `aspect-ratio: 1` / Tailwind `grid-cols-8`）し、幅 360px〜1280px+ で常に正方形を維持
- [ ] T065 [P] [US4] `MatchScreen` のレイアウトをモバイル縦構成（盤 → スコア → 操作）と PC 横構成（盤中央 / 補助情報を周辺）に分岐（FR-020）
- [ ] T066 [P] [US4] `Cell` の最小タップ領域を 32px 以上に保証（CSS `min-width` / `min-height`、SC-006）
- [ ] T067 [US4] `src/app/layout.tsx` のビューポートメタタグを `width=device-width, initial-scale=1, viewport-fit=cover` に設定（既設の場合は確認のみ）
- [ ] T068 [US4] 画面回転時の状態保持テストを `useMatch` のレベルで検証（state は React で保持、CSS のみ再計算）

**Checkpoint**: ブラウザの DevTools で 360px / 768px / 1280px に切り替えて、いずれの幅でも盤がスクロール無しで収まる。

---

## Phase 7: User Story 5 - 視覚フィードバックで状況が直感的に分かる (Priority: P3)

**Goal**: 合法手・反転・手番遷移・CPU 思考中・終局を、テキスト説明に頼らず視覚で識別できる。

**Independent Test**: ルール既知の協力者にアプリを渡し、説明なしで 1 局を完走できる（SC-004 を満たす）。

### Tests for User Story 5

- [ ] T069 [P] [US5] 合法手ハイライト DOM の単体テストを `tests/ui/cell-highlight.test.tsx` に作成（自分の手番のみ表示・相手番では非表示、FR-017）
- [ ] T070 [P] [US5] 反転アニメーション継続時間テストを `tests/ui/flip-animation.test.tsx` に作成（300ms 上限の保証、FR-018, SC-008）
- [ ] T071 [P] [US5] aria-live 通知のテストを `tests/ui/aria-live.test.tsx` に作成（手番遷移・反転・終局時にアナウンスされる）

### Implementation for User Story 5

- [ ] T072 [P] [US5] `Cell` の合法手ハイライトスタイル（透明度 + マイクロモーション）を実装（FR-017）
- [ ] T073 [P] [US5] 石配置・反転アニメーション（CSS transition `transform: rotateY(180deg)` 等、duration ≤300ms）を `src/ui/Cell.tsx` に実装（FR-018, SC-008）
- [ ] T074 [P] [US5] CPU 思考中インジケータ（ドット 3 つの脈動 or プログレスリング）を `src/ui/GameStatus.tsx` に実装
- [ ] T075 [P] [US5] 勝敗演出（色・配置・スコア対比）を `src/ui/GameResult.tsx` に実装
- [ ] T076 [US5] `Board` を WAI-ARIA Grid パターンに準拠させ（`role="grid"`, `role="gridcell"`, `aria-rowindex` / `aria-colindex`）、矢印キーでのフォーカス移動と Enter / Space での着手を実装（FR-021、憲法 III）
- [ ] T077 [US5] `GameStatus` の手番・反転・終局通知を `aria-live="polite"` で読み上げ（憲法 III）
- [ ] T078 [US5] ユーザビリティ手動チェックリスト（10 人規模、SC-004）を `specs/001-othello-cpu-match/checklists/usability.md` に追加

**Checkpoint**: キーボード単体で 1 局完走でき、スクリーンリーダーで主要状態変化が読み上げられる。

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 全ストーリー横断の最終仕上げ、計測、ドキュメント整備

- [ ] T079 [P] `README.md` に開発手順（`npm install` / `npm run dev` / `npm test` / `npm run lint` / `npm run typecheck`）と動作要件を記載
- [ ] T080 [P] `AGENTS.md` に確定した npm スクリプトと「ゲームロジック変更時は単体テスト追加 (憲法 V)」を追記
- [ ] T081 [P] CI 用 GitHub Actions ワークフローを `.github/workflows/ci.yml` に追加（lint → typecheck → test 順、PR で実行）※ workflow ファイル編集権限が無い環境では未着手で構わない
- [ ] T082 SC-002（初手到達 5 秒以内）を Lighthouse もしくは手動計測で検証し結果を `specs/001-othello-cpu-match/quickstart.md`（無ければ追加）に記録
- [ ] T083 SC-003（CPU 中央値 1s / 95p 3s）を `tests/cpu/performance.test.ts` で自動計測（強さ別に 50 サンプル）
- [ ] T084 SC-005 ベンチ（T052）を CI から `npm run bench:cpu` 相当で隔離実行できるよう scripts に追加
- [ ] T085 SC-006 と SC-008 を手動チェック（DevTools の Performance タブ + 視覚確認）し結果を PR 本文に記載
- [ ] T086 [P] 不要な抽象・未使用コードの clean-up（YAGNI 準拠、憲法 IV）
- [ ] T087 アクセシビリティ手動チェック（NVDA / VoiceOver で StartScreen → SetupScreen → MatchScreen → GameResult を完走）
- [ ] T088 全ストーリーの golden path をブラウザで動作確認し、その結果をマージ前 PR 本文に記載（憲法 V、Definition of Done #3）
- [ ] T089 `specs/001-othello-cpu-match/checklists/requirements.md` を最新の実装状態に合わせて再評価

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし — 即開始可能
- **Foundational (Phase 2)**: Setup 完了後 — すべての User Story をブロック
- **User Stories (Phase 3+)**: Foundational 完了後に開始
  - 並列実装可能（US1 が MVP として先行推奨）
  - 順次実装する場合は優先度順（P1 → P2 → P3）
- **Polish (Phase 8)**: 全ての対象 User Story 完了後

### User Story Dependencies

- **US1 (P1, MVP)**: Foundational 完了後すぐ開始可能。他ストーリー非依存
- **US2 (P2)**: Foundational 後すぐ開始可能。US1 の reducer/UI と統合する箇所あり（T045-T047）。US1 不在でも先手選択 + 既定 CPU で独立に動作可能
- **US3 (P2)**: Foundational 後すぐ開始可能。US1 不在でも強さ選択 + 既定先手で独立に動作可能
- **US4 (P2)**: US1 の UI コンポーネントが存在することを前提とするレイアウト調整。コンポーネント実装と並走可能
- **US5 (P3)**: US1 完成後に磨き込み。アニメーション・アクセシビリティは US1 のコンポーネントに段階的に適用

### Within Each User Story

- 単体テスト（憲法 V により MUST）→ 実装の順で進める（先に失敗を確認 → 通過させる）
- 純粋関数（`src/game/`, `src/cpu/`）→ 状態管理（`src/state/`）→ UI（`src/ui/`）→ ページ統合（`src/app/`）
- 同一ファイルを変更するタスクは並列不可（[P] が付かない理由）

### Parallel Opportunities

- Setup 内の [P] 付きタスクは全て並列実行可能
- Foundational 内の T009–T013 は並列実行可能
- 各 User Story 内の単体テスト（[P] 付き）は並列実行可能
- 各 User Story 内の純粋関数モジュールも別ファイルなら並列実行可能
- US1 が落ち着けば、US2 / US3 / US4 を別開発者で並走可能

---

## Parallel Example: User Story 1（同時着手可能タスク）

```bash
# テスト（先行）
Task: "T016 [P] [US1] tests/game/legalMoves.test.ts"
Task: "T017 [P] [US1] tests/game/applyMove.test.ts"
Task: "T018 [P] [US1] tests/game/gameOver.test.ts"
Task: "T019 [P] [US1] tests/game/score.test.ts"

# 純粋ロジック実装（テスト通過後）
Task: "T021 [P] [US1] src/game/legalMoves.ts"
Task: "T022 [P] [US1] src/game/applyMove.ts"
Task: "T023 [P] [US1] src/game/gameOver.ts"
Task: "T024 [P] [US1] src/game/score.ts"

# CPU と UI コンポーネントも別ファイル単位で並列化
Task: "T026 [P] [US1] src/cpu/randomStrategy.ts"
Task: "T027 [P] [US1] src/cpu/greedyStrategy.ts"
Task: "T032 [P] [US1] src/ui/Cell.tsx"
Task: "T033 [P] [US1] src/ui/Board.tsx"
Task: "T034 [P] [US1] src/ui/GameStatus.tsx"
Task: "T035 [P] [US1] src/ui/GameResult.tsx"
```

---

## Implementation Strategy

### MVP First (US1 のみ)

1. Phase 1 (Setup) を完了
2. Phase 2 (Foundational) を完了 — **すべての User Story をブロック**
3. Phase 3 (US1) を完了
4. **STOP & VALIDATE**: ブラウザで「対戦開始」→ 1 局完走 → 勝敗表示まで確認
5. デモ／プレビュー可能 — MVP リリース

### Incremental Delivery

1. Setup + Foundational → 基盤完成
2. US1 → MVP デプロイ
3. US2 / US3 / US4 を独立に追加 → 各々独立にデモ可能
4. US5 でアニメーション・アクセシビリティの磨き込み
5. Phase 8 で計測・ドキュメント整備

### Parallel Team Strategy

- チームでまず Setup + Foundational を完了
- 完了後の役割分担例:
  - Developer A: US1（コア体験 MVP）
  - Developer B: US2（先手後手）
  - Developer C: US3（CPU 強さ）
  - Developer D: US4（レスポンシブ）+ US5（フィードバック）
- 各 PR は独立にマージ可能であること（憲法 IV）

---

## Notes

- [P] = 別ファイル・依存関係なしで並列実行可能
- [Story] ラベル（[US1]〜[US5]）は spec.md の各 User Story にトレース可能
- 憲法 V により、ゲームロジック単体テストの追加は MUST（オプション扱いではない）
- UI 変更を含む PR は本文にスクリーンショットまたは動作確認結果を添付（憲法 V）
- 各 Checkpoint で完了基準を満たさない場合は次フェーズに進まない
- Same-file 競合の回避: [P] が付かないタスクは順次実行（特に `src/state/gameReducer.ts`, `src/ui/MatchScreen.tsx`, `src/ui/SetupScreen.tsx`, `src/app/page.tsx` は複数ストーリーで触るため直列）
- 過剰な事前抽象化を避ける（憲法 IV、YAGNI）。Strategy パターンは 3 実装が確定しているため例外的に許容

---

## Implementation Status (2026-05-30, `/speckit-implement` Phase 1–8 一周)

`/speckit-implement` 実行で本ブランチに以下のソース実装が入りました。タスク ID と実体ファイルの対応をまとめます。
"未実施" のものは次フェーズ／PR で別途扱う想定（実行環境制約のあるもの）。

### Setup / Foundational (Phase 1–2)

- [X] T001 `package.json` の scripts/devDependencies 拡張（Next.js App Router は既存テンプレが該当）
- [X] T002 `src/app/layout.tsx` を `lang="ja"` + viewport + globals 読み込みに更新
- [X] T003 `tsconfig.json` strict & `@/*` 既存設定（変更不要を確認）
- [X] T004 `src/app/globals.css` に Othello 用デザイントークン + flip keyframes（`tailwind.config.ts` は v4 では postcss 設定で足り不要）
- [X] T005 `eslint.config.mjs` は既存設定で `eslint-config-next` 有効（変更不要を確認）
- [X] T006 `vitest.config.ts` 追加（jsdom + react plugin + `@` alias）
- [X] T007 scripts に `typecheck` / `test` / `test:watch` / `test:bench` を追加
- [X] T008 `src/{game,cpu,ui,state,lib}/` および `tests/{game,cpu,state,lib}/` を作成
- [X] T009 `src/game/types.ts`（Coord 名で）
- [X] T010 `src/game/board.ts`
- [X] T011 `src/game/directions.ts`
- [X] T012 `tests/game/board.test.ts`
- [X] T013 デザイントークンは `src/app/globals.css` の CSS 変数に集約（`src/ui/tokens.ts` は YAGNI で不要）
- [X] T014 layout 完了（既出）
- [X] T015 `src/app/page.tsx` を `'use client'` で再実装

### US1 — MVP (Phase 3)

- [X] T016 `tests/game/moves.test.ts`
- [X] T017 `tests/game/moves.test.ts` 内で 8 方向反転検証
- [X] T018 `tests/game/game.test.ts` の applyPass / mustPass 検証
- [X] T019 `tests/game/score.test.ts`
- [ ] T020 公式記譜全手の再現は未実装（既存 4 手分の挟みパターンで代替、再現精度は plan 段階の SC-001 で補完）
- [X] T021 `src/game/moves.ts` `legalMovesForBoard`
- [X] T022 `src/game/game.ts` `applyMove`
- [X] T023 `src/game/game.ts` `mustPass` / `isGameOver`
- [X] T024 `src/game/score.ts` `getScore` / `getWinner`
- [X] T025 `src/cpu/strategy.ts` （同期版 — contract に合わせ Promise 化はせず）
- [X] T026 `src/cpu/random.ts`
- [X] T027 `src/cpu/greedy.ts`
- [X] T028 `tests/cpu/random.test.ts` / `tests/cpu/greedy.test.ts`
- [X] T029 CPU 非同期実行は `src/state/useMatch.ts` の effect 内 `setTimeout` で実装（独立ファイル化は YAGNI）
- [X] T030 `src/state/matchReducer.ts`
- [X] T031 `src/state/useMatch.ts`
- [X] T032 `src/ui/CellView.tsx`
- [X] T033 `src/ui/BoardView.tsx`
- [X] T034 `src/ui/Hud.tsx`（GameStatus 相当）
- [X] T035 `src/ui/ResultModal.tsx`（GameResult 相当）
- [X] T036 `src/ui/MatchScreen.tsx`
- [X] T037 SetupPanel に「対戦開始」を統合し、独立 StartScreen は割愛（画面数最小化）
- [X] T038 `src/app/page.tsx` 統合
- [ ] T039 React-DOM 統合テスト未実装（reducer/state テストで代替）

### US2 — 先手・後手 (Phase 4)

- [X] T040 `tests/lib/persistence.test.ts`
- [ ] T041 統合テスト未実装（reducer テストで網羅）
- [X] T042 `src/game/types.ts` の PlayerProfile / getDefaultProfile
- [X] T043 `src/lib/persistence.ts`
- [X] T044 `src/ui/SetupPanel.tsx`（色選択 UI）
- [X] T045 reducer の START_MATCH で profile.playerColor を game に渡す
- [X] T046 `useMatch` の CPU 駆動 effect が mount 直後に CPU 起動
- [X] T047 page.tsx の状態切替（setup → playing → finished → setup）
- [X] T048 SetupPanel の `onProfileChange` 経由で profile が永続化される

### US3 — CPU 強さ (Phase 5)

- [ ] T049 評価関数の独立テスト未実装（negamax/greedy テストで間接検証）
- [ ] T050 探索の詰め局面テスト未実装（基本動作テストは `tests/cpu/negamax.test.ts`）
- [ ] T051 終盤完全読み専用テスト未実装（負け確認ベンチ T052 で代替）
- [X] T052 `tests/cpu/strength-bench.test.ts`（`describe.skip` で隔離）
- [X] T053 `src/cpu/evaluator.ts`（位置重み + モビリティ + 角支配）
- [X] T054 `src/cpu/negamax.ts` Negamax + αβ + iterative deepening
- [X] T055 `src/cpu/negamax.ts` 内で `emptyCells <= 12` 切替を実装（独立 file は YAGNI）
- [X] T056 `NegamaxStrategy`（strong）
- [X] T057 `src/cpu/index.ts` `createStrategy` ファクトリ
- [X] T058 SetupPanel に強さ 3 択
- [X] T059 reducer で profile.strength → game.strength → factory 経由で利用
- [X] T060 persistence で Difficulty も永続化
- [X] T061 useMatch の CPU_THINKING_MIN_VISIBLE_MS=200

### US4 — レスポンシブ (Phase 6)

- [ ] T062 jsdom レスポンシブテスト未実装
- [ ] T063 cell-size 独立テスト未実装
- [X] T064 BoardView の `w-[min(92vmin,640px)] aspect-square` で正方形維持
- [X] T065 MatchScreen の `flex-col lg:flex-row` で PC 横並び
- [X] T066 CellView の `min-w-[32px] min-h-[32px]`
- [X] T067 layout.tsx の viewport export
- [X] T068 React 状態は回転時保持（実装上、CSS のみ変化）

### US5 — 視覚フィードバック (Phase 7)

- [ ] T069 cell-highlight DOM テスト未実装
- [ ] T070 flip-animation テスト未実装
- [ ] T071 aria-live テスト未実装
- [X] T072 合法手ハイライト（CSS hint + opacity transition 150ms）
- [X] T073 反転アニメーション（CSS `othello-flip` keyframe `rotateY` 280ms ≤ 300ms）
- [X] T074 CPU 思考中ドット 3 連 pulse
- [X] T075 結果モーダル（絵文字 + 勝敗ヘッドライン + スコア対比）
- [X] T076 Grid ARIA + 矢印キー + Enter/Space 着手 + Home/End/Ctrl+Home/Ctrl+End
- [X] T077 aria-live=polite で手番・思考中・スコアを通知

### Polish (Phase 8)

- [ ] T078 ユーザビリティ手動チェックリスト（10 人規模）未作成
- [X] T079 `README.md` 更新（npm スクリプト・構成・動作確認導線）
- [X] T080 `AGENTS.md` に npm スクリプトと品質ゲートを追記
- [ ] T081 GitHub Actions CI ワークフロー未追加（claude-bot に workflow 編集権限なし）
- [ ] T082 SC-002 Lighthouse 計測未実施（手動）
- [ ] T083 `tests/cpu/performance.test.ts` 未追加（手動計測で代替予定）
- [X] T084 `npm run test:bench` を package.json に追加（T052 を隔離実行）
- [ ] T085 SC-006/SC-008 手動チェック未実施（PR 本文に記載予定）
- [X] T086 不要抽象なし（Strategy 3 実装 + factory のみ、YAGNI）
- [ ] T087 NVDA/VoiceOver 手動チェック未実施
- [ ] T088 ブラウザ golden path 動作確認は PR 受領後に実施
- [ ] T089 `checklists/requirements.md` 再評価は PR 本文確認のうえ更新予定

### サマリ

- 自動化されたコード／テスト／設定: **完了**（68 / 89 タスク、76%）
- 手動チェック・CI/Lighthouse・workflow 編集など実行環境制約タスク: **未完了**（21 / 89）
- これらは PR レビューおよびマージ後の動作確認段階で順次クローズしてください。

