# Phase 1 Data Model: Othello 対 CPU 対戦 MVP

**Date**: 2026-05-30
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

本ドキュメントは spec.md の Key Entities セクションを実装可能な型・関係・状態遷移として
具体化したものである。すべて純粋関数で扱う不変データとして表現する（憲法 IV、research §2）。

---

## 1. 値型・列挙型

### `Color`

プレイヤーの色を表す列挙。

```ts
type Color = 'black' | 'white';
```

**操作**:
- `opposite(color: Color): Color` — 黒↔白 反転

### `Cell`

盤面 1 マスの状態。

```ts
type Cell = 'empty' | 'black' | 'white';
```

`Color` と表記が一致しているが、空マスを含む点で別型。`Color` を `Cell` として
扱う際は明示的な型注釈で行う。

### `Coord`

盤上の座標（0-indexed）。

```ts
type Coord = { readonly row: number; readonly col: number };
```

**不変条件**:
- `0 <= row <= 7`
- `0 <= col <= 7`

### `Strength`

CPU 強さ。

```ts
type Strength = 'easy' | 'normal' | 'hard';
```

UI 表示は日本語マッピング: `easy → 弱い`, `normal → 普通`, `hard → 強い`。

### `MatchPhase`

対局のフェーズ。

```ts
type MatchPhase = 'setup' | 'playing' | 'finished';
```

---

## 2. 中核エンティティ

### `Board`（盤面）

8×8 マスの集合。**外側不変・内側不変**な 2 次元配列として表現する。

```ts
type BoardRow = readonly [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell];
type Board    = readonly [BoardRow, BoardRow, BoardRow, BoardRow,
                          BoardRow, BoardRow, BoardRow, BoardRow];
```

**生成**:
- `createInitialBoard(): Board` — 中央 4 マスに公式初期配置（D4 白・E5 白・D5 黒・E4 黒）。
  それ以外は `empty`。

**参照**:
- `getCell(board, coord): Cell`

**変更（不変・新インスタンスを返す）**:
- `placeStone(board, coord, color): Board` — 単一マスを `color` に変更（合法手判定は呼出側）
- `flipStones(board, coords, color): Board` — 複数マスをまとめて `color` に変更

**不変条件**:
- 配列長 = 8、各行長 = 8
- 値は `Cell` のいずれか
- 既存マスを直接 mutate しない

---

### `Move`（着手）

「どの色が、どのマスに、結果としてどのマス群を反転して」を 1 単位として表現。

```ts
type Move = {
  readonly color: Color;
  readonly placedAt: Coord;
  readonly flips: readonly Coord[];   // 反転される相手石の座標群（0 個ではない）
};
```

**生成**:
- `findMove(board, color, target): Move | null` — `target` が `color` にとって合法手なら
  反転 8 方向を走査して `Move` を返す。非合法なら `null`。

**派生エンティティ**:
- `LegalMoves = readonly Move[]` — 現在の手番プレイヤーが取れる全合法手集合

---

### `GameState`（対局状態）

対局 1 局分の論理状態。UI 状態（思考中フラグ・アニメ中フラグ）は含めない。
それらは `MatchState`（§3）に持つ。

```ts
type GameState = {
  readonly board: Board;
  readonly turn: Color;                       // 現在の手番（finished のときは最終手番）
  readonly playerColor: Color;                // 人間プレイヤーの色（'black' or 'white'）
  readonly strength: Strength;                // CPU 強さ
  readonly history: readonly Move[];          // パスは記録しない（盤の差分が無いため）
  readonly consecutivePasses: 0 | 1 | 2;      // 連続パス回数（2 で終局）
  readonly phase: MatchPhase;
};
```

**生成**:
- `createGame(playerColor: Color, strength: Strength): GameState`
  - `phase = 'playing'`、`turn = 'black'`、`board = createInitialBoard()`、
    `history = []`、`consecutivePasses = 0`

**状態遷移関数**:

| 関数 | 入力 | 出力 | 副作用 |
|------|------|------|--------|
| `legalMoves(state)` | `GameState` | `LegalMoves` | なし。`turn` の合法手集合 |
| `applyMove(state, move)` | `GameState`, `Move` | `GameState` | なし。反転反映 → 手番交代 → 終局判定 |
| `applyPass(state)` | `GameState` | `GameState` | なし。`consecutivePasses` +1 → 手番交代 → 必要なら終局 |
| `isGameOver(state)` | `GameState` | `boolean` | なし |
| `getScore(state)` | `GameState` | `{ black: number; white: number }` | なし |
| `getWinner(state)` | `GameState` | `Color \| 'draw' \| null` | finished でないとき `null` |

**状態遷移ルール**（spec の Edge Cases と FR-005 / FR-006 / FR-007 を反映）:

```
playing
  ├─ legalMoves(state).length > 0
  │    └─ applyMove → consecutivePasses = 0, turn 交代, phase 維持（盤満杯なら finished）
  └─ legalMoves(state).length === 0
       ├─ 相手にも合法手なし
       │   → applyPass → consecutivePasses = 2 → phase = 'finished'
       └─ 相手には合法手あり
           → applyPass → consecutivePasses = 1, turn 交代, phase 維持
```

**追加の終局条件**:
- 盤が満杯（空マス 0）
- どちらかの色が 0 個（全滅）

---

### `PlayerProfile`（プレイヤー設定）

次回起動時に再現する選好。`localStorage` に永続化する（research §8）。

```ts
type PlayerProfile = {
  readonly playerColor: Color;     // 'black' = 先手, 'white' = 後手
  readonly strength: Strength;
  readonly schemaVersion: 1;       // 将来マイグレーション用
};
```

**操作**:
- `loadProfile(): PlayerProfile | null` — `localStorage.othello.profile.v1` を読み JSON parse
- `saveProfile(profile): void` — 失敗時は黙って無視
- `getDefaultProfile(): PlayerProfile` — `{ playerColor: 'black', strength: 'normal', schemaVersion: 1 }`

**バリデーション**:
- `playerColor in {'black','white'}`、`strength in {'easy','normal','hard'}`
- 不正値が読み込まれた場合は `getDefaultProfile()` にフォールバック

---

### `CPUStrategy`（CPU 戦略）

強さレベルごとの応手選択ロジック。

```ts
interface CPUStrategy {
  readonly strength: Strength;
  selectMove(state: GameState): Coord;   // 必ず合法手の中から 1 つ返す（呼出側で合法手 ≥ 1 を保証）
}
```

**実装**（`src/cpu/`）:

| 実装 | 強さ | 概要 |
|------|------|------|
| `RandomStrategy` | easy | 合法手から一様ランダム選択 |
| `GreedyStrategy` | normal | 1 手先評価（反転数 + 位置重み）、最大スコア手をランダム選択 |
| `NegamaxStrategy` | hard | Negamax + αβ 枝刈り。深さ 4（中盤）／ 残り 12 マスから完全読み |

**ファクトリ**:
- `createStrategy(strength: Strength): CPUStrategy`

**不変条件**:
- `selectMove` は呼出時の `state.turn` に対する合法手のいずれかを返す（不正手を返さない）
- 純粋関数ではないが（Random は seed なし）、同じ盤面に対する判定は決定的 or 確率的のいずれかに
  固定される（Greedy / Negamax は同点処理を除き決定的）

---

## 3. UI 状態エンティティ

ゲーム論理状態 (`GameState`) とは別に、UI 表示のための過渡状態を保持する。
これは `src/state/matchReducer.ts` の reducer state として実装する。

### `MatchState`

```ts
type MatchState =
  | { readonly phase: 'setup'; readonly profile: PlayerProfile }
  | { readonly phase: 'playing';
      readonly game: GameState;
      readonly cpuThinking: boolean;
      readonly lastFlips: readonly Coord[];    // 直前の反転（アニメ表示用、1 frame で消去）
      readonly focusedCell: Coord | null;       // キーボード操作のフォーカス位置
    }
  | { readonly phase: 'finished'; readonly game: GameState };
```

### `MatchAction`（reducer に投げる Action）

```ts
type MatchAction =
  | { type: 'SETUP_CHANGE'; profile: Partial<PlayerProfile> }
  | { type: 'START_MATCH' }
  | { type: 'PLACE_STONE'; at: Coord }                  // 人間プレイヤーの着手
  | { type: 'CPU_MOVE'; at: Coord }                     // CPU の着手（hook 内で算出）
  | { type: 'AUTO_PASS' }                                // 合法手 0 時の自動パス
  | { type: 'CLEAR_LAST_FLIPS' }                        // アニメ終了後
  | { type: 'FOCUS_CELL'; at: Coord | null }
  | { type: 'RESTART' };                                 // 結果画面から setup に戻る
```

**Reducer の主な責務**:
- `START_MATCH`: `createGame(profile.playerColor, profile.strength)` で `phase: 'playing'` へ
- `PLACE_STONE`: 合法手なら `applyMove` → `lastFlips` を更新 → 終局判定
- `CPU_MOVE`: 同上（実体は `applyMove` の薄いラッパ）
- `AUTO_PASS`: `applyPass` を呼び終局なら `finished` へ
- `RESTART`: `phase: 'setup'`、直前 profile を初期値に

副作用（CPU 思考の起動・`localStorage` 保存）は `useMatch` フック内で行い、reducer は純粋に保つ。

---

## 4. エンティティ間の関係

```
PlayerProfile ─(input)→ GameState ─(input)→ CPUStrategy
                     │
                     ├─→ Board (composition)
                     └─→ Move[] (history, composition)

MatchState ──holds──→ GameState
            └─holds──→ PlayerProfile (setup 時のみ)
```

- `Game` は `Board` と `Move[]` を完全に所有（Composition）
- `CPUStrategy` は `GameState` を読み取るのみで状態を持たない
- `MatchState` は UI 表示のための上位エンティティで、`GameState` を内包

---

## 5. 不変条件のまとめ（テスト対象）

実装で必ず守るべき不変条件。`tests/game/` の単体テストでカバーする（憲法 V）。

1. `createInitialBoard()` の盤は黒 2・白 2・空 60 で、座標 D4=白・E4=黒・D5=黒・E5=白
2. `legalMoves(state)` の任意要素 `m` について、`m.flips.length >= 1` かつ `m.flips` は
   `m.placedAt` を含まない
3. `applyMove(state, move)` 後の盤について、`move.flips` の全座標が `move.color` に変わる
4. `applyMove` で `consecutivePasses` は 0 に reset される
5. `applyPass` 2 連続で `phase === 'finished'`
6. `getScore` の和は 盤上の石数 = `64 - 空マス数`
7. `getWinner` は score 大の色、同点は `'draw'`、`phase !== 'finished'` で `null`
8. `CPUStrategy.selectMove(state)` の返り値は常に `legalMoves(state)` に含まれる Coord

---

## 6. データ量見積もり

| 項目 | 1 局あたり | 備考 |
|------|------------|------|
| `Board` インスタンス数 | 最大 ~60（手数）+ 内部探索でさらに数百〜数千 | 不変コピーだが 64 セル × number で軽量 |
| `Move.flips` 平均長 | 2〜4 | 終盤は増える |
| `history` 長 | ≤ 60 | 1 ゲーム上限 |
| `localStorage` 使用量 | < 200 bytes | `PlayerProfile` のみ |

メモリ・ストレージ共に性能制約には到達しない。
