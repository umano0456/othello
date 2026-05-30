# オセロ対戦アプリ

モダンでミニマルな UI のオセロ（リバーシ）対戦アプリ。人間 vs CPU の 1 局を最後まで遊べる
MVP を提供します。

- 仕様: `specs/001-othello-cpu-match/spec.md`
- 計画: `specs/001-othello-cpu-match/plan.md`
- タスク: `specs/001-othello-cpu-match/tasks.md`
- 憲法: `.specify/memory/constitution.md`

## 主な機能（v1）

- 公式ルール準拠の 8×8 オセロ（合法手判定 / 8 方向反転 / 自動パス / 終局・勝敗）
- プレイヤー先手・後手の選択
- CPU 強さ 3 段階: 弱（Random）／ 普通（1 手 Greedy）／ 強（Negamax + αβ + 終盤完全読み）
- 合法手ハイライト・反転アニメ（≤300ms）・CPU 思考中表示
- スマホ縦持ち（幅 360px〜）と PC 横置きの両対応
- 矢印キー操作と aria-live を備えたアクセシビリティ

## セットアップ

```bash
npm install
```

## 開発サーバー起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## テスト

```bash
npm test          # ゲームロジック / CPU / 永続化の単体テスト
npm run test:watch
npm run test:bench  # SC-005 強さ差別化ベンチ（自己対戦・現在は describe.skip）
```

憲法 V（品質ゲート）により、ゲームロジックの単体テストは MUST です。

## 型チェック & Lint

```bash
npm run typecheck
npm run lint
```

両者ゼロエラーが憲法 V の必須条件です。

## ビルド & 本番起動

```bash
npm run build
npm start
```

## プロジェクト構成

```
src/
  app/        Next.js App Router（layout.tsx, page.tsx, globals.css）
  game/       純粋関数のゲームロジック（UI 非依存・単体テスト対象）
  cpu/        CPU 戦略（CPUStrategy インターフェース + 3 実装）
  ui/         React コンポーネント（presentational）
  state/      useReducer + useMatch カスタムフック
  lib/        localStorage 等の副作用ユーティリティ
tests/
  game/  cpu/  state/  lib/   Vitest 単体テスト
```

依存方向は `ui → state → (game, cpu)`, `cpu → game`。憲法 IV「ゲームロジックを
UI から分離」を構造的に保証しています。

## 動作確認

`specs/001-othello-cpu-match/quickstart.md` に各 User Story の手動チェック手順をまとめています。
UI 変更を含む PR では本文にスクリーンショットまたは動作確認結果を添付してください（憲法 V）。
