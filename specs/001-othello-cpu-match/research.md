# Phase 0 Research: Othello 対 CPU 対戦 MVP

**Date**: 2026-05-30
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

本ドキュメントは plan.md の Technical Context に出現する不確実項目と、採択スタック
（Next.js 16 / React 19 / Tailwind v4 / TypeScript strict）を Othello MVP に適用する際の
ベストプラクティスを調査・確定した結果を記録する。各項目は **Decision / Rationale /
Alternatives considered** の 3 節構成とする。

---

## 1. Next.js 16 (App Router) の参照ソース確定

**Decision**: Next.js API・規約・ファイル構造の参照は、**実装フェーズで `npm install` 後に
`node_modules/next/dist/docs/` 配下を一次情報として読む**。本 plan ドキュメントでは
「App Router + Client Component + `'use client'` 指定」「`app/page.tsx` をルートエントリと
して使用」「`metadata` ベースの head 管理」までを既定とし、それ以外のリンク仕様・キャッシュ
仕様・Server Action 仕様は実装直前に再確認する。

**Rationale**: AGENTS.md と憲法 (Technology & Design Standards 節) が「学習データ由来の API を
前提にしてはならない」「`node_modules/next/dist/docs/` を正とする」と明示している。
Next.js 16 はメジャーバージョンであり、`use client` 配置、`useFormState` 系 API、`Link` の
prefetch 仕様、`cookies()` / `headers()` の同期/非同期挙動などに破壊的変更が含まれる可能性が
ある。本機能はサーバ側 API を持たない静的に近い SPA のため依存は最小だが、`page.tsx` を
Client Component 化する点と、メタデータ設定の API が変更されている可能性があるため、
実装着手時に再確認する。

**Alternatives considered**:
- 学習データから推測 → 憲法違反。却下。
- Pages Router へフォールバック → リポジトリ既存が App Router (`src/app/`) を採用しており、
  矛盾を生じる。却下。

---

## 2. ゲームロジックの実装スタイル（純粋関数 vs クラス）

**Decision**: `src/game/` 配下を **純粋関数 + 不変データ構造（readonly array / object）** で
実装する。`Board` は `ReadonlyArray<ReadonlyArray<Cell>>` 相当の型として表現し、各操作は
新しい盤面を返す関数として記述する（`applyMove(board, move): Board` 等）。クラスや
mutable state は使用しない。

**Rationale**:
- 憲法 IV「ゲームロジックを UI から分離・型シグネチャで境界を明示」と整合。
- 純粋関数は単体テストが容易（憲法 V の MUST）。同じ入力で同じ出力を保証できる。
- React 19 + React Compiler 環境では、参照同一性（reference equality）が再レンダリング判定に
  使われるため、不変データのほうがメモ化や `useMemo` との相性が良い。
- 盤面 64 マスを毎手コピーしても 1 局 60 手 × 64 = 3840 セルのコピーで、性能上の懸念は無い。

**Alternatives considered**:
- 可変クラス（`class OthelloGame`）：状態管理が暗黙的になり、テスト時のセットアップが複雑化。却下。
- ビットボード（2 つの 64bit BigInt）：強い CPU の探索高速化には有利だが、MVP の探索深度
  （≤6 手）では Map ベースで SC-003 を達成可能と見込まれ、可読性を優先。Phase 2 以降の
  最適化候補として保留（YAGNI、憲法 IV）。

---

## 3. CPU 強さ 3 段階のアルゴリズム選定

**Decision**:

| 強さ | アルゴリズム | 思考時間ターゲット |
|------|--------------|--------------------|
| 弱 | **Random**: 合法手から一様ランダムに 1 手選択 | ≤ 100ms |
| 普通 | **Greedy + 位置重み**: 1 手読みで「反転枚数 + 位置重みテーブル」スコア最大の手を選択。同点は乱択 | ≤ 300ms |
| 強 | **Negamax + αβ枝刈り**: 評価関数は「位置重み + 着手可能数（mobility）+ 確定石数の近似」。**序盤〜中盤は深さ 4、残りマス ≤ 12 から完全読み（深さ最大 12）** | ≤ 1500ms（中央値）／ ≤ 3000ms（95p） |

評価関数の位置重みは、4 隅 +100、X マス -50、辺 +10、その他 +1 を初期値とする（実装で
チューニング）。

**Rationale**:
- SC-005「強 vs 弱 70%、強 vs 普通 55%」を満たすには「強」が中盤以降の戦略的判断を必要とする。
  単一手の貪欲評価では SC-005 未達のリスクが高いため、最低でも 3-4 手読みは必要。
- SC-003「中央値 1 秒・95p 3 秒以内」を満たすため、深さは固定ではなく **時間予算 1.5 秒で
  iterative deepening する設計**にし、時間超過時は最良手のみ確定とする。
- 残りマス ≤ 12 での完全読みは、64 マスの 8-2 終局演算が現代ブラウザの JS で 1 秒未満で完了する
  ことが既知（公開 Reversi AI 実装の前例多数）。
- 「弱」はランダムで十分に「普通」「強」より弱く、SC-005 の 70% を確保しやすい。

**Alternatives considered**:
- 弱 = 1 手読み（最小反転）→ 「普通」との差別化が薄れ SC-005 マージンが減る。却下。
- 強 = MCTS：探索性能は出るが評価関数調整より実装コストが高く、SC-005 達成に過剰。却下（YAGNI）。
- 強 = ニューラルネット → モデル配信・初回ロード遅延（SC-002 の 5 秒）を脅かす。却下。

---

## 4. CPU 思考の実行モデル（同期 / requestIdleCallback / Web Worker）

**Decision**: **Phase 1 では同期 + マイクロタスク遅延（`queueMicrotask` または `setTimeout(.., 0)`）
で実装し、計測で 95p > 3000ms に近づく場合のみ Web Worker への退避を Phase 2 に追加する**。

**Rationale**:
- 強 CPU の見積もり最大計算量（深さ 4 × 平均分岐 8 ≒ 4096 ノード評価）は、現代の V8 で
  数十 ms オーダー。Web Worker のメッセージング往復オーバーヘッド（数 ms）を考えると、
  初期実装は同期で十分。
- 「思考中インジケータ」（FR-019、Story 5）の表示は、`setTimeout` で UI 更新を 1 フレーム
  挟むことで実現可能。
- 完全読み（残り 12 マス、最大 12!  ≒ 5 億だが αβ で 10^4 オーダーに削減）でも 1 秒前後に
  収まる見込み。万一超える場合は時間予算で深さを抑制する。
- Web Worker を初期から導入すると、`postMessage` の構造化クローンで盤面の不変性が崩れる、
  ESM 経由の worker bundling 設定（Next.js 16 では `new Worker(new URL(...))` パターンが
  推奨）など実装コストが増える。YAGNI（憲法 IV）。

**Alternatives considered**:
- 即時 Worker 化：将来の保険として有効だが、現段階で SC を満たせる見込みなら早すぎる抽象。却下。
- `requestIdleCallback`：iOS Safari 未対応のためポータブルでない。却下。

---

## 5. UI 状態管理（useReducer / Context / 外部ライブラリ）

**Decision**: **`useReducer` + 単一ファイルの `matchReducer.ts`** で対局状態を管理し、
`useMatch` カスタムフックを通じて UI に提供する。Context は 1 段（Provider 不要、page.tsx で
直接フックを呼ぶ単一画面構成）。Redux / Zustand / Jotai 等の外部状態管理ライブラリは導入しない。

**Rationale**:
- 状態のスコープが「対局 1 つ」に閉じており、跨コンポーネントの共有量も少ない（盤面 + 設定）。
- 憲法 IV の YAGNI：外部ライブラリは具体的問題が見えてから採用する。
- React 19 + React Compiler 環境では、関数コンポーネントと `useReducer` の組み合わせは
  自動メモ化されるため、外部ライブラリの最適化メリットが薄い。
- リデューサは純粋関数 → `src/game/` の状態遷移関数とほぼ 1:1 対応するため、テストが容易。

**Alternatives considered**:
- Zustand：軽量だが本機能の状態量に対しオーバースペック。却下。
- React Server Component で状態を保持 → CPU 思考はクライアント実行が必須のため不適。却下。

---

## 6. アニメーション実装（CSS transition / Framer Motion / View Transitions）

**Decision**: **Tailwind v4 の utility + CSS transition** で実装する。具体的には:
- 合法手ハイライト: `transition-opacity duration-150`
- 石の反転: 各セルに `transform rotateY` + `transition-transform duration-300` を当て、
  反転を CSS の 3D 変換で表現
- 思考中インジケータ: Tailwind の `animate-pulse` 相当

ライブラリ（Framer Motion）は導入しない。CSS View Transitions API は対応ブラウザに偏りが
あるため利用しない。

**Rationale**:
- 憲法 II「アニメ ≤ 300ms」かつ「目的明確な場合のみ」と整合し、CSS のみで実装可能。
- バンドルサイズ増を避け、SC-002（初手到達 5 秒）に寄与。
- Tailwind v4 は zero-config で transition utilities を提供。

**Alternatives considered**:
- Framer Motion：宣言的 API は読みやすいが本機能のアニメ量に対しオーバースペック。却下。
- View Transitions API：Safari 対応が不完全（2026-05 時点で iOS 旧バージョンに残存）。却下。

---

## 7. テストフレームワーク

**Decision**: **Vitest** + **@testing-library/react** を実装フェーズで `package.json` に追加する。
- ゲームロジック単体テストは `tests/game/` 配下の `.test.ts`
- CPU 戦略テストは `tests/cpu/` 配下（強さの相対比較は seed 固定 + 100 局自己対戦で確率的判定）

**Rationale**:
- Next.js 16 + React 19 + Vite ベースの Vitest は ESM 完全対応で `tsconfig` の `moduleResolution: bundler` と
  相性が良い。
- Jest は ESM 設定が依然煩雑で、React Compiler / SWC 環境との統合が Vitest より複雑。
- 憲法 V の MUST「ゲームロジック単体テストが通過」を最小コストで満たせる。

**Alternatives considered**:
- Jest：歴史的に Next.js と組み合わされてきたが ESM 設定コスト高。却下。
- node:test 標準ランナー：TSX / @testing-library との統合に追加設定が必要。却下。

---

## 8. 永続化（プレイヤー選好の再現）

**Decision**: **`localStorage` に単一キー `othello.profile.v1`** で `PlayerProfile` を保存する。
読み込みは初回マウント時 1 回、保存は対戦開始ボタン押下時 1 回。書込み失敗（Safari Private モード
等で `QuotaExceededError`）は黙って無視する（UX を阻害しない）。

**Rationale**:
- FR-011（直前選好の再現）を満たす最小実装。
- IndexedDB は対局単位の小データに対しオーバースペック。
- キー名にバージョン suffix を入れることで、将来のスキーマ変更時のマイグレーション逃げ道を確保。

**Alternatives considered**:
- Cookie：サーバ送信が不要な情報をネットワークに乗せる無駄。却下。
- IndexedDB：本機能のデータ量に対し過剰。却下（YAGNI）。

---

## 9. アクセシビリティ実装方針

**Decision**: 盤面を `role="grid"`、各セルを `role="gridcell"` + `aria-label="{column}{row}, {state}"`
（例: "D5, 黒石" / "C4, 合法手"）とし、矢印キーで隣接マスにフォーカス移動・Enter / Space で
着手する。CPU の手番・思考中・終局結果は `aria-live="polite"` のリージョンで読み上げる。

**Rationale**:
- 憲法 III「キーボード操作 / スクリーンリーダーで完結」を満たす（SHOULD）。
- FR-021「キーボード操作で着手可能・説明文を読まずに発見可能」と整合。
- WCAG 2.1 AA の Grid パターン（ARIA Authoring Practices）に準拠。

**Alternatives considered**:
- 各マスを `<button>` 列挙：単純だがフォーカス管理が冗長になり、矢印キー移動が直感的でない。却下。
- ARIA なし：憲法 III の SHOULD を満たせない。却下。

---

## 10. レスポンシブ設計

**Decision**:
- ブレークポイント: Tailwind デフォルト（`sm: 640`, `md: 768`, `lg: 1024`）を採用
- 盤サイズ: `min(90vmin, 640px)` の正方形コンテナに 8×8 = `1fr` の grid-template
- スマホ縦持ち（< 640px）: 盤面下に HUD（手番／スコア／設定ボタン）を縦積み
- PC（≥ 1024px）: 盤面の右に HUD を横並び

**Rationale**:
- SC-006「幅 360px でスクロール無し全表示・タップ領域 32px 以上」を満たすには、`vmin` ベースで
  ビューポート短辺に対する正方形を確保するのが確実。360px の 90vmin = 324px、8 等分で 1 マス
  40.5px、タップ領域 32px の要件を余裕で満たす。
- FR-020「両方で 1 画面に収まる」要件と直結。

**Alternatives considered**:
- 固定ピクセルサイズ：小型端末で見切れる。却下。
- CSS aspect-ratio + width 100%：縦長端末で盤が縦に伸びすぎる。`vmin` のほうが安定。却下。

---

## 11. 既存 `src/app/page.tsx` の扱い

**Decision**: 既存 `page.tsx`（Next.js 初期テンプレート由来）を本機能用に **置き換える**。
本機能はトップ・対戦・結果を単一ルートで状態切替する SPA 構成のため、追加のルートは作らない。

**Rationale**:
- 画面が 3 状態しか無く、ルート分割の保守コストが利益を上回らない（YAGNI）。
- 既存 page.tsx はテンプレートの占位コードで、UX の現状価値は無い。

**Alternatives considered**:
- ルート別ファイル（`/setup`, `/match`, `/result`）：状態遷移時の遷移アニメや戻る挙動を考えると、
  単一ルート + 状態切替のほうが直感的。却下（IV: YAGNI）。

---

## 未解決項目

なし。Technical Context 上の "NEEDS CLARIFICATION" は 0 件で Phase 0 を終了する。

## Phase 0 完了基準チェック

- [x] すべての NEEDS CLARIFICATION 解消
- [x] 主要技術選定の Decision / Rationale / Alternatives 記録
- [x] 憲法と矛盾する選定なし（Constitution Check 通過済）
