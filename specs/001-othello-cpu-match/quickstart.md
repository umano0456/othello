# Quickstart: Othello 対 CPU 対戦 MVP

**Date**: 2026-05-30
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

本機能を開発・検証するための手順をまとめる。`/speckit-tasks` および `/speckit-implement` から
参照することを想定する。

---

## 1. 前提

- Node.js 20 以上（`@types/node: ^20` 採用）
- npm（`package-lock.json` をリポジトリで管理）
- リポジトリのルートが `/home/runner/work/othello/othello`（または各環境のチェックアウト先）
- 現在のフィーチャブランチ: `claude/issue-3-20260530-2029`

---

## 2. 依存関係のインストール

```bash
npm install
```

実装フェーズで以下を追加する（plan で確定済み・本コマンドはまだ実行しない）:

```bash
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
```

> Vitest は ESM 前提。`vitest.config.ts` を `vite-plugin-react` 込みで配置する。設定詳細は
> 実装フェーズで `node_modules/next/dist/docs/` の testing 章とともに最終決定する（research §7）。

---

## 3. 開発サーバーの起動

```bash
npm run dev
```

- 既定で `http://localhost:3000` が立ち上がる
- 既存 `src/app/page.tsx` を置き換えて UI を組み込む
- React Compiler が有効（`next.config.ts`）

---

## 4. ユーザーストーリーごとの動作確認

すべて localhost で人手確認。本フィーチャは PR 要件で「UI 変更はブラウザ動作確認を PR 本文に
記載」（憲法 V）が必須なので、各 PR で対応するストーリーをチェックする。

### Story 1 — 既定設定で 1 局を完了

1. `npm run dev` 後 `http://localhost:3000` を開く
2. 何も触らず「対戦開始」をクリック
3. 中央 4 マスの初期配置を目視確認（D4=白、E4=黒、D5=黒、E5=白）
4. 合法手のハイライトを確認
5. 1 マス着手 → 反転アニメ → CPU の応手まで進む
6. 終局まで進めて結果モーダルが出ることを確認

### Story 2 — 先手・後手を切替

1. セットアップで「後手（白）」を選択 → 開始
2. CPU が黒で先に着手することを確認
3. リロード後、セットアップ画面に「白」が初期選択として残っていることを確認

### Story 3 — CPU 強さ切替

1. 「弱い」で 1 局：CPU の手が露骨に弱い（角を簡単に渡す等）ことを観察
2. 「強い」で 1 局：CPU が角を取り返す・確定石を作る挙動を観察
3. ベンチ実行（任意）: `npm run test:bench` で SC-005 の勝率（強 vs 弱 70%、強 vs 普通 55%）を確認

### Story 4 — スマホ / PC 両対応

1. Chrome DevTools のデバイスエミュレータで iPhone SE (375×667) を選択
2. 盤面が縦スクロールなしで全表示されることを確認
3. デスクトップ幅 1280px に戻し、盤の右に HUD が並ぶレイアウトを確認
4. 縦横回転（ローテートボタン）で盤状態が維持されることを確認

### Story 5 — 視覚フィードバック

1. ルール未学習の知人に URL を渡し、口頭説明なしで 1 局完走できるかを観察
2. 合法手ハイライト・反転アニメ・思考中インジケータ・結果モーダルが言語非依存で伝わるかを確認

---

## 5. 単体テスト

```bash
npm run test                   # game / cpu ロジックの単体テスト
npm run test:watch             # 開発中
npm run test:bench             # SC-005 自己対戦ベンチ（時間がかかる）
```

カバレッジ対象:
- `src/game/board.ts` / `moves.ts` / `game.ts` / `score.ts` の全公開関数
- `src/cpu/random.ts` / `greedy.ts` / `negamax.ts` の `selectMove` 出力検証
- リデューサ `src/state/matchReducer.ts` の状態遷移

憲法 V の MUST「ゲームロジック単体テスト通過」を最低条件とする。

---

## 6. Lint / 型チェック

```bash
npm run lint
npx tsc --noEmit
```

両者ゼロエラーであることが憲法 V の MUST。

---

## 7. ビルド確認

```bash
npm run build
npm run start
```

`build` が通り、`start` でローカルでも本番ビルドが動作することを最終確認する。

---

## 8. Acceptance Criteria のマッピング

| Story | Acceptance Scenarios | 確認手段 |
|-------|---------------------|----------|
| Story 1 | 1〜5 | §4 Story 1 手順 + `tests/game/game.test.ts` |
| Story 2 | 1〜3 | §4 Story 2 手順 + `tests/state/matchReducer.test.ts` |
| Story 3 | 1〜3 | §4 Story 3 手順 + `tests/cpu/strength-bench.test.ts` |
| Story 4 | 1〜3 | §4 Story 4 手順（DevTools 目視） |
| Story 5 | 1〜4 | §4 Story 5 手順（人手ヒューリスティック） |

---

## 9. 既知の落とし穴

- **Next.js 16 の破壊的変更**: 学習データ由来の API を使わないこと。実装時に
  `node_modules/next/dist/docs/` を必ず参照する（AGENTS.md / 憲法）。
- **React Compiler**: 既定で有効。`useMemo` / `useCallback` の手書きは原則不要。手書きが
  あった場合は理由をコメントで残す。
- **Strict Mode**: `tsconfig.strict: true` 既設。`any` の混入禁止（憲法 V）。
- **localStorage**: Safari Private モードで `setItem` が例外を投げる。try/catch で握る。
- **CPU 思考のブロッキング**: 強 CPU の探索でメインスレッドが詰まる場合は research §4 に
  従い Web Worker への退避を後追いで検討。

---

## 10. 完了の定義（DoD）

憲法「Definition of Done」より:

1. 型チェックと Lint が通過
2. ゲームロジックの単体テストが通過（`npm run test`）
3. UI 変更は §4 の golden path をブラウザで 1 度は動作確認
4. CLAUDE.md / AGENTS.md / Constitution に反する記述・実装を含まない
