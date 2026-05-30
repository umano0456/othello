# Contract: UI Components & Accessibility (`src/ui/`)

**Owner module**: `src/ui/`, `src/app/page.tsx`
**Consumers**: ユーザー（人間プレイヤー）／スクリーンリーダー／キーボード操作
**Stability**: 公開コンポーネント props は v1 で凍結。内部実装の差し替えは自由。

UI レイヤーが守るべきレンダリング契約・操作契約・アクセシビリティ契約を定義する。
これは「ユーザーから見える振る舞い」と「DOM 構造のうち外部から依存される部分」の
2 種類を含む。Spec の FR-017〜FR-022 / SC-006 と直結する。

---

## 1. ルートエントリ：`src/app/page.tsx`

- **役割**: トップ・対戦・結果を `MatchState.phase` で切り替える単一クライアントコンポーネント
- **ディレクティブ**: `'use client'`（Reducer 利用のため）
- **責務**:
  - `useMatch()` フックを呼び、`state` と `dispatch` を取得
  - `state.phase` で `SetupPanel` / `BoardView + Hud` / `ResultModal` を切替表示
  - ページのメタデータ（`metadata` export）でタイトル「オセロ対戦」を設定（Next.js 16 の API に従う、
    実装時に `node_modules/next/dist/docs/` を要参照）

---

## 2. `SetupPanel`

```ts
type SetupPanelProps = {
  profile: PlayerProfile;
  onProfileChange: (next: Partial<PlayerProfile>) => void;
  onStart: () => void;
};
```

**DOM 契約**:
- ルート要素: `<section aria-labelledby="setup-heading">`
- 見出し: `<h1 id="setup-heading">` で「対戦設定」相当の日本語テキスト
- 先手後手選択: `<fieldset>` + `<legend>` + `<input type="radio" name="player-color">` × 2
- 強さ選択: `<fieldset>` + `<legend>` + `<input type="radio" name="strength">` × 3
- 開始ボタン: `<button type="button">` ラベル「対戦開始」

**振る舞い契約**:
- 何も選ばずに開始ボタンを押せる（既定値 = `getDefaultProfile()`）
- 開始時に `onStart()` 呼び出し → reducer は `START_MATCH` を発火 → `localStorage` 保存

---

## 3. `BoardView` / `CellView`

```ts
type BoardViewProps = {
  board: Board;
  legalCoords: ReadonlySet<string>;       // "row,col" 形式の文字列セット
  lastFlips: readonly Coord[];
  focusedCell: Coord | null;
  myTurn: boolean;                         // false なら入力無効化
  onCellActivate: (coord: Coord) => void;
  onFocusChange: (coord: Coord | null) => void;
};
```

**DOM 契約（盤）**:
- ルート要素: `<div role="grid" aria-label="オセロ盤面 8 行 8 列" aria-rowcount="8" aria-colcount="8">`
- 各行: `<div role="row">`
- 各セル: `CellView` が `<button role="gridcell" tabindex={...}>` を出力

**DOM 契約（セル）**:
- `aria-label`: `"D5、黒石"` / `"C4、合法手"` / `"A1、空"` の形式
- `aria-disabled="true"` を非合法 OR `!myTurn` の場合に付与
- `tabindex`: `focusedCell` と一致するセルのみ `0`、それ以外 `-1`（Grid ロービング tabindex パターン）
- データ属性: `data-state="empty|black|white"`, `data-legal="true|false"`, `data-last-flip="true|false"`
  （CSS スタイリング・自動テストのフックとして使用）

**キーボード契約**:
- 矢印キー: 隣接マスへフォーカス移動（盤外はラップしない）
- Home / End: 行内の左端 / 右端へ
- Ctrl+Home / Ctrl+End: 盤の A1 / H8 へ
- Enter / Space: 合法手かつ自分の手番なら着手（非合法は no-op）
- フォーカス中のセルは可視のリング表示（`focus-visible` で青系の outline）

**マウス／タッチ契約**:
- セルクリック / タップで `onCellActivate(coord)`
- `myTurn === false` のときは `aria-disabled` のみ付与、`onClick` は何もしない（FR-022）
- ホバー時に合法手のセルは強調（CSS `:hover` + Tailwind ユーティリティ、ホバー無し環境では効果なし）

**アニメーション契約**:
- セル状態が `'empty' → color` に変化したとき: 入りアニメ 200ms
- `lastFlips` に含まれるセルが反転する: 200ms の 3D 回転アニメ
- 合法手ハイライト: opacity トランジション 150ms
- 合計上限 300ms（憲法 II・SC-008）

---

## 4. `Hud`

```ts
type HudProps = {
  blackScore: number;
  whiteScore: number;
  turn: Color;
  playerColor: Color;
  cpuThinking: boolean;
};
```

**DOM 契約**:
- スコア表示: `<div aria-live="polite">黒: X / 白: Y</div>`（変化時に SR 通知）
- 手番表示: 視覚 + `<div role="status" aria-live="polite">{turn}の手番です</div>`
- 思考中インジケータ: `cpuThinking === true` のとき視覚的なローディング (`animate-pulse`) と
  `<div role="status" aria-live="polite">CPU が考えています</div>` を同時表示

**振る舞い契約**:
- スコア更新は `applyMove` の reducer 結果から直接導出
- `cpuThinking` が立ち上がってから次に false になるまで、ローダ表示が必ず 200ms 以上維持される
  （ちらつき防止・SC-008 と独立の UX 配慮、実装は `setTimeout` で最小表示時間を保証）

---

## 5. `ResultModal`

```ts
type ResultModalProps = {
  winner: Color | 'draw';
  blackScore: number;
  whiteScore: number;
  onRestart: () => void;
};
```

**DOM 契約**:
- ルート要素: `<dialog open aria-labelledby="result-heading">`（Next.js 16 + React 19 で
  サポートされる `<dialog>` 要素ベース。実装時に `node_modules/next/dist/docs/` を確認）
- 見出し: `<h2 id="result-heading">あなたの勝ち！ / CPU の勝ち / 引き分け</h2>`
- スコア: `黒: X / 白: Y` テキスト
- もう一度遊ぶボタン: `<button type="button">` ラベル「もう一度遊ぶ」、フォーカス自動

**振る舞い契約**:
- 開いた瞬間にもう一度遊ぶボタンへ自動フォーカス（Enter で再戦可能）
- Esc キーでも `onRestart()` を発火（オセロでは「閉じる ≠ 何もしない」のため、Esc も再戦と解釈）

---

## 6. レイアウト契約（レスポンシブ）

| ビューポート幅 | 盤サイズ | HUD 位置 | 検証対象 |
|----------------|----------|----------|----------|
| < 640px | `min(90vmin, 100vw - 32px)` 正方形 | 盤の下に縦積み | SC-006（360px で全表示・タップ 32px+） |
| 640〜1023px | `min(80vmin, 480px)` | 盤の下、HUD は横並び | 中間サイズ動作確認 |
| ≥ 1024px | `min(70vmin, 640px)` | 盤の右に横並び | PC 体験 |

**追加制約**:
- 縦持ち→横持ちの回転で盤状態は失われない（state は React 上に保持され、CSS のみ再レイアウト）
- スクロールバーが対戦画面に出ないこと（`overflow: hidden` をルートに、盤コンテナは `aspect-square`）

---

## 7. 永続化との連携契約

- `SetupPanel` 初期表示時に `loadProfile()` を呼ぶ（`useMatch` フック内）。失敗時は default
- `START_MATCH` 実行時に `saveProfile(profile)` を呼ぶ（失敗黙殺）

---

## 8. テスト可能性

- 各 props は純粋に外部から制御可能（uncontrolled な内部 state を持たない）
- @testing-library/react で `BoardView` を render し、`role="gridcell"` をクエリして合法手数や
  aria-label を検証
- キーボード操作は `userEvent.keyboard('{ArrowRight}{Enter}')` で再現
