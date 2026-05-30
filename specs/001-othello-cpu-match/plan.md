# Implementation Plan: Othello 対 CPU 対戦 MVP

**Branch**: `claude/issue-3-20260530-2029` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-othello-cpu-match/spec.md`

## Summary

公式ルール準拠の 8×8 オセロを、人間 vs CPU で 1 局通して遊べる Web アプリ MVP を実装する。
ユーザーは対戦開始前に「先手／後手」と CPU 強さ「弱／普通／強」を選択でき、選択をしなければ
既定値（プレイヤー＝先手＝黒、強さ＝普通）で開始する。盤面・反転・パス・終局・勝敗表示まで
公式ルール通りに動作し、合法手ハイライト・反転アニメ・思考中表示などの視覚フィードバックを通じて
チュートリアル無しでも遊べる体験を提供する。スマホ縦持ち（幅 360px〜）と PC 横置き（幅 1280px〜）
の双方で盤面がスクロール無く収まることを必須条件とする。

技術アプローチ: Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind v4 のリポジトリ既定
スタックを採用する。**ゲームロジック層**（盤面状態・合法手判定・反転・終局・勝敗）を `src/game/` 配下の
純粋関数モジュールとして実装し、UI から完全に独立させて単体テスト可能にする（憲法 IV）。
**CPU 戦略層**は `CPUStrategy` インターフェースに従う 3 実装（Random / Greedy / Negamax+αβ）として
差し替え可能に設計する。**UI 層**は `src/app/` の Next.js App Router 上の Client Component として、
状態管理は React の `useReducer` で局面遷移を扱い、外部状態管理ライブラリは導入しない（YAGNI）。
CPU 思考は UI スレッドのブロッキングを避けるため `requestIdleCallback` / Web Worker への退避を Phase 0 で判定する。

## Technical Context

**Language/Version**: TypeScript 5.x（`strict: true` / `noEmit: true`、`tsconfig.json` 既存）

**Primary Dependencies**:
- Next.js 16.2.6（App Router、React Compiler 有効、`next.config.ts` 既存）
- React 19.2.4 / React DOM 19.2.4
- Tailwind CSS v4（`@tailwindcss/postcss`）
- ESLint 9（`eslint-config-next` 16.2.6）
- `babel-plugin-react-compiler` 1.0.0（既存）

**Storage**: ブラウザ `localStorage` のみ（プレイヤー選好の次回再現用、SC は不要）。サーバ側永続化なし。

**Testing**: Vitest + @testing-library/react を Phase 0 で正式化（リポジトリ未導入 → 実装フェーズで `package.json` に追加）。ゲームロジックは I/O を伴わない純粋関数のため単体テスト容易。

**Target Platform**: 最新主要ブラウザ（Chrome / Safari / Edge / Firefox の最新 2 メジャー）。
PWA 化やネイティブパッケージングは v1 スコープ外。

**Project Type**: Web application（Next.js 単一プロジェクト、フロント完結）。バックエンド API は持たない。

**Performance Goals**:
- 初回読み込み〜初手可能まで 5 秒以内（SC-002）
- CPU 応答時間 中央値 1 秒・95p 3 秒以内（SC-003）
- 着手から反転完了までのアニメーション 300ms 以下（SC-008・憲法 II）

**Constraints**:
- 幅 360px ビューポートでスクロール無し全表示・タップ領域 32px 以上（SC-006）
- WCAG 2.1 AA 相当のキーボード／スクリーンリーダー対応（憲法 III、SHOULD）
- Next.js 16 系の破壊的変更については `node_modules/next/dist/docs/` を一次情報とする（AGENTS.md / 憲法）
- ローカル完結（オフライン非保証だが通信前提でない）

**Scale/Scope**:
- 画面数: トップ / 対戦 / 結果（実質単一 SPA）
- 主要モジュール: game-engine, cpu-strategy, ui-components（Board / Cell / SetupPanel / Hud / ResultModal）
- 対局単位の状態量: 64 マス × 3 値 + 履歴最大 60 手程度（メモリ・CPU 共に十分小）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 評価項目 | Pre-Phase 0 | Post-Phase 1 |
|------|----------|-------------|--------------|
| I. UX First | 学習コスト 0・テンポ阻害なし・既存操作と矛盾なし | ✅ チュートリアル不要を SC-004 で計測。合法手ハイライトと反転アニメで操作結果を即時可視化 | ✅ 同左。`useReducer` の状態遷移は同期で UI 応答即時 |
| II. Minimal Design | 色数最小・アニメ ≤300ms・単一テーマ | ✅ ダークモード・複数テーマは v1 スコープ外。CSS transition 300ms 上限 | ✅ data-model に重複表示要素なし。盤マスは石/合法手ヒント/通常の 3 状態のみ |
| III. Intuitive Interaction | 主要操作の発見可能性・キーボード対応 | ✅ FR-021 でキーボード操作を SHOULD。誤クリック無視 (FR-022) | ✅ contracts/ui-contract.md で Cell の `role="gridcell"` / `aria-label` を定義 |
| IV. Extensible Architecture | ゲームロジックの UI 分離・拡張点の阻害なし・YAGNI | ✅ `src/game/` を純粋関数で構成。CPU は Strategy パターンで差し替え可。オンライン対戦・テーマ切替は未実装でも境界は阻害しない | ✅ data-model.md の `Game.mode` を `'pvc'` 固定にせず enum 化、CPUStrategy を interface に。過剰抽象（DI コンテナ等）は導入せず |
| V. Quality Gates | 型ゼロ・Lint 通過・ロジック単体テスト・UI 動作確認 | ✅ TS strict 既設。テストフレームワーク導入を Phase 0 でロックイン。CI は本フィーチャ範囲外 | ✅ contracts/game-engine-contract.md の関数群を単体テスト対象として明示 |

**結果**: Pre-Phase 0 ゲート通過。違反なし → Complexity Tracking 不要。Post-Phase 1 ゲートも通過（下記 Phase 1 完了時点で再評価済み）。

## Project Structure

### Documentation (this feature)

```text
specs/001-othello-cpu-match/
├── plan.md              # This file (/speckit-plan command output)
├── spec.md              # Feature spec (already exists)
├── research.md          # Phase 0 output (/speckit-plan)
├── data-model.md        # Phase 1 output (/speckit-plan)
├── quickstart.md        # Phase 1 output (/speckit-plan)
├── contracts/           # Phase 1 output (/speckit-plan)
│   ├── game-engine-contract.md
│   ├── cpu-strategy-contract.md
│   └── ui-contract.md
├── checklists/
│   └── requirements.md  # Already exists
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created here)
```

### Source Code (repository root)

```text
src/
├── app/                      # Next.js App Router（既存）
│   ├── layout.tsx            # 既存
│   ├── globals.css           # 既存
│   └── page.tsx              # 既存 → トップ / 対戦 / 結果を単一ルートで切替
├── game/                     # 新規: 純粋ゲームロジック（UI 非依存）
│   ├── board.ts              # 盤面初期化・マス参照・複製
│   ├── moves.ts              # 合法手判定・反転計算（8 方向走査）
│   ├── game.ts               # 対局状態遷移・パス・終局判定
│   ├── score.ts              # 石数集計・勝敗判定
│   └── types.ts              # Color / Cell / Board / Move / GameState 型定義
├── cpu/                      # 新規: CPU 戦略（game 層に依存・UI 非依存）
│   ├── strategy.ts           # CPUStrategy インターフェース
│   ├── random.ts             # 弱: ランダム着手
│   ├── greedy.ts             # 普通: 1 手評価（反転数 + 位置重み）
│   ├── negamax.ts            # 強: Negamax + αβ 枝刈り（深さは strength で可変）
│   └── evaluator.ts          # 位置重みテーブルと評価関数（greedy/negamax 共用）
├── ui/                       # 新規: React コンポーネント（presentational）
│   ├── BoardView.tsx
│   ├── CellView.tsx
│   ├── SetupPanel.tsx
│   ├── Hud.tsx               # 手番・スコア・思考中インジケータ
│   └── ResultModal.tsx
├── state/                    # 新規: useReducer ベースの対局ストア
│   ├── matchReducer.ts
│   └── useMatch.ts           # custom hook（CPU 応手の起動も担当）
└── lib/                      # 新規: 汎用ユーティリティ（localStorage 等）
    └── persistence.ts        # PlayerProfile の保存／復元

tests/                        # 新規: Vitest テスト
├── game/
│   ├── board.test.ts
│   ├── moves.test.ts
│   ├── game.test.ts
│   └── score.test.ts
└── cpu/
    ├── random.test.ts
    ├── greedy.test.ts
    └── negamax.test.ts

# 既存リポジトリルート（変更なし）:
# package.json, tsconfig.json, next.config.ts, eslint.config.mjs,
# postcss.config.mjs, public/, .specify/, AGENTS.md, CLAUDE.md, README.md
```

**Structure Decision**: 単一の Next.js アプリ（フロント完結）として実装する。憲法 IV「ゲームロジックを
UI から分離」を満たすため、`src/game/`（純粋関数）と `src/cpu/`（純粋関数 + 戦略実装）と
`src/ui/`（React）と `src/state/`（reducer & hook）を分離し、依存方向は **ui → state → (game, cpu)、
cpu → game** とする。ロジック層は React / Next.js に一切依存させない。これにより:

1. ゲームロジック単体テスト（憲法 V の MUST）が UI を起動せず実行可能。
2. 将来の「2 人ローカル対戦」「オンライン対戦」「リプレイ」追加時にも `src/game/` をそのまま再利用可能（憲法 IV）。
3. CPU 戦略の差し替え・追加が `src/cpu/strategy.ts` の interface 実装だけで完結（憲法 IV）。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

該当なし。Constitution Check は Pre / Post 双方でゲート通過。違反項目なし。
