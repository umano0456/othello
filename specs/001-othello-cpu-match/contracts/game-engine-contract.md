# Contract: Game Engine (`src/game/`)

**Owner module**: `src/game/`
**Consumers**: `src/cpu/`, `src/state/matchReducer.ts`, `tests/game/`
**Stability**: 公開 API は v1 で凍結。破壊的変更は本フィーチャの後続フェーズで明示的に行う。

ゲームロジック層が外部に公開する関数群と、それらが守るべき入出力契約・不変条件を定義する。
本 contract は単体テスト（`tests/game/*.test.ts`）の網羅対象でもある。

---

## 公開 API（`src/game/index.ts` から re-export）

### 1. `createInitialBoard(): Board`

公式初期配置の盤面を返す。

- **Returns**: `Board`
- **Postconditions**:
  - `getCell(board, {row:3, col:3}) === 'white'`
  - `getCell(board, {row:3, col:4}) === 'black'`
  - `getCell(board, {row:4, col:3}) === 'black'`
  - `getCell(board, {row:4, col:4}) === 'white'`
  - 上記 4 マス以外はすべて `'empty'`
  - 同関数の連続呼び出しで参照同一性は保証しないが、構造的等価は保証する

### 2. `getCell(board: Board, coord: Coord): Cell`

座標のマス状態を返す。

- **Preconditions**: `0 <= coord.row, coord.col <= 7`
- **Throws**: 範囲外座標は `RangeError` を投げる

### 3. `legalMoves(state: GameState): readonly Move[]`

`state.turn` の合法手集合を返す。

- **Returns**: 合法手の配列（0 件もあり得る）
- **Postconditions**:
  - 返り値の各 `Move m` について `m.color === state.turn`
  - `m.flips.length >= 1`
  - `m.flips` は `m.placedAt` を含まない
  - `m.placedAt` の元のマスは `'empty'`
  - 同一 `placedAt` の `Move` は最大 1 件
- **副作用**: なし（純粋関数）

### 4. `applyMove(state: GameState, move: Move): GameState`

着手を適用した新しい状態を返す。

- **Preconditions**: `move` は `legalMoves(state)` のいずれかと構造的に等価
- **Postconditions**:
  - `result.board` で `move.placedAt` が `move.color` に変わっている
  - `result.board` で `move.flips` の全座標が `move.color` に変わっている
  - その他のマスは元の `state.board` と一致
  - `result.turn === opposite(state.turn)`
  - `result.history.length === state.history.length + 1`
  - `result.history[last] === move`
  - `result.consecutivePasses === 0`
  - 盤満杯または一方の石数 0 なら `result.phase === 'finished'`、それ以外は `'playing'`
- **副作用**: なし

### 5. `applyPass(state: GameState): GameState`

現在の手番をパスして手番を交代する。

- **Preconditions**: `legalMoves(state).length === 0` であること
- **Postconditions**:
  - `result.board === state.board`（参照同一）
  - `result.turn === opposite(state.turn)`
  - `result.consecutivePasses === state.consecutivePasses + 1`
  - `consecutivePasses === 2` なら `result.phase === 'finished'`
  - `result.history === state.history`（パスは履歴に追加しない）
- **副作用**: なし

### 6. `isGameOver(state: GameState): boolean`

`state.phase === 'finished'` と等価。明示性のためのヘルパ。

### 7. `getScore(state: GameState): { black: number; white: number }`

盤上の石数を集計。

- **Postconditions**:
  - `result.black >= 0`、`result.white >= 0`
  - `result.black + result.white <= 64`

### 8. `getWinner(state: GameState): Color | 'draw' | null`

- **Postconditions**:
  - `state.phase !== 'finished'` のとき `null`
  - finished 時:
    - 黒 > 白 → `'black'`
    - 白 > 黒 → `'white'`
    - 同点 → `'draw'`

### 9. `createGame(playerColor: Color, strength: Strength): GameState`

新規対局を生成する。

- **Postconditions**:
  - `result.phase === 'playing'`
  - `result.turn === 'black'`
  - `result.playerColor === playerColor`
  - `result.strength === strength`
  - `result.history.length === 0`
  - `result.consecutivePasses === 0`
  - `result.board` は `createInitialBoard()` と構造的等価

### 10. `findMove(board: Board, color: Color, target: Coord): Move | null`

`target` が `color` にとって合法手なら `Move` を、そうでなければ `null` を返す（`legalMoves` の
1 マス特化版、UI の click handler で利用）。

- **Postconditions**:
  - 返り値が `non-null` なら `legalMoves(stateWithBoard(board, color))` に含まれる
  - 返り値が `null` なら `target` は非合法

---

## 不変条件（実装契約）

| ID | 条件 | テスト |
|----|------|--------|
| INV-1 | すべての公開関数は純粋関数（引数を mutate しない、外部状態に依存しない、副作用なし） | 各関数の入力 deep equal 比較で検証 |
| INV-2 | `Board` / `GameState` / `Move` のフィールドは `readonly` で、参照型は `ReadonlyArray` 系 | 型レベルで TS strict が保証 |
| INV-3 | `applyMove(applyMove(s, m1), m2)` で `m1` の効果が破壊されない | reducer 連続適用テスト |
| INV-4 | `legalMoves` の決定論性: 同一 state に対し常に同一順序で返す（テスト容易化） | seed 固定テスト |

---

## エラーモデル

- 範囲外座標 / 不正な手番 / 終局後の操作 → `Error` を投げる（型: `RangeError` or `Error`）
- 通常の「合法手なし」「非合法着手」はエラーではなく、それぞれ `applyPass` 推奨 / `null` 返却で表現

---

## バージョニング

- 本契約のバージョンは仕様 v1 と一体。`getCell` のシグネチャ変更等は MINOR / MAJOR のフィーチャ
  仕様（次フィーチャ）で扱う。
