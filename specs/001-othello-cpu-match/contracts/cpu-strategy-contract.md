# Contract: CPU Strategy (`src/cpu/`)

**Owner module**: `src/cpu/`
**Consumers**: `src/state/useMatch.ts`, `tests/cpu/`
**Stability**: 公開 interface は v1 で凍結。新しい強さ追加は interface 実装を増やす形で拡張する。

CPU 応手モジュールが公開する interface と、各実装の振る舞い契約を定義する。

---

## 公開 API

### Interface `CPUStrategy`

```ts
interface CPUStrategy {
  readonly strength: Strength;
  selectMove(state: GameState): Coord;
}
```

#### `selectMove`

- **Preconditions**:
  - `state.phase === 'playing'`
  - `legalMoves(state).length >= 1`（合法手が無い場合は呼出側が `applyPass` を選ぶ）
- **Postconditions**:
  - 返り値の `Coord` は `legalMoves(state).map(m => m.placedAt)` に含まれる
  - 同一 `state` に対する複数回呼び出しは、Greedy / Negamax では決定的（同点の tie-break を seed で固定可能）、
    Random では確率的
- **Errors**: 上記事前条件違反時は `Error` を投げる

### Factory

```ts
function createStrategy(strength: Strength): CPUStrategy;
```

- **Postconditions**:
  - `createStrategy('easy')` は `RandomStrategy` を返す
  - `createStrategy('normal')` は `GreedyStrategy` を返す
  - `createStrategy('hard')` は `NegamaxStrategy` を返す

### Time budget

`selectMove` は内部的に `Date.now()` ベースで時間予算をチェックし、超過時は現時点の最良手を
返す（Negamax は iterative deepening、Greedy / Random は予算考慮不要）。予算は実装ごとに以下:

| 実装 | 標準時間予算 | 最大時間 |
|------|--------------|----------|
| Random | N/A | ~10ms（ほぼ即時） |
| Greedy | 100ms（実質ほぼ即時） | 300ms |
| Negamax | 1500ms | 3000ms（SC-003 95p 上限） |

---

## 実装別契約

### 1. `RandomStrategy`

```ts
class RandomStrategy implements CPUStrategy {
  readonly strength = 'easy';
  selectMove(state: GameState): Coord;
}
```

- **アルゴリズム**: `legalMoves(state)` から `Math.random()` で一様ランダム選択
- **決定論性**: 確率的。`tests/cpu/random.test.ts` では選ばれた手が必ず合法手集合に含まれることのみ検証
  （seed なしのため確率分布は近似的に検証）

### 2. `GreedyStrategy`

```ts
class GreedyStrategy implements CPUStrategy {
  readonly strength = 'normal';
  selectMove(state: GameState): Coord;
}
```

- **アルゴリズム**:
  1. `legalMoves(state)` の各 `Move` についてスコア = `flipCount * 1 + positionWeight(placedAt) * 2`
  2. 最大スコアの手集合からランダム選択（tie-break）
- **位置重み** (`src/cpu/evaluator.ts` で定義):

  ```text
   100  -20   10    5    5   10  -20  100
   -20  -50   -2   -2   -2   -2  -50  -20
    10   -2    1    1    1    1   -2   10
     5   -2    1    1    1    1   -2    5
     5   -2    1    1    1    1   -2    5
    10   -2    1    1    1    1   -2   10
   -20  -50   -2   -2   -2   -2  -50  -20
   100  -20   10    5    5   10  -20  100
  ```

- **検証**: tie のない盤面で必ず最大スコア手が選ばれる（テスト）

### 3. `NegamaxStrategy`

```ts
class NegamaxStrategy implements CPUStrategy {
  readonly strength = 'hard';
  selectMove(state: GameState): Coord;
}
```

- **アルゴリズム**: Negamax + αβ 枝刈り、iterative deepening (深さ 2 → 4)
- **評価関数** `evaluate(state, color)`:
  - 終局: 石差 × 大きな重み（例: 100,000）
  - 非終局: `Σ positionWeight * cellSign + mobilityDelta * 5 + cornerControl * 30`
    - `cellSign = +1 if self, -1 if opponent`
    - `mobilityDelta = legalMoves(self) - legalMoves(opponent)`
    - `cornerControl = 自確保角数 - 相手確保角数`
- **完全読み切替**: `emptyCells <= 12` で深さを残り空マス数まで広げ、勝敗確定値で評価
- **検証**:
  - 「自殺手（次手で角を取られる）」を避けることをテスト（複数の prepared 盤面で検証）
  - `RandomStrategy` 同士の 100 局自己対戦に対し勝率 70% 以上（SC-005、`tests/cpu/strength-bench.test.ts`）
  - `GreedyStrategy` 相手で勝率 55% 以上（SC-005）

---

## テスト戦略

- 合法手返却の不変条件は全実装で共通検証（パラメタライズドテスト）
- 強さ差別化（SC-005）は自己対戦ベンチを別ファイルで実行し、CI では `--testTimeout 60000` 程度に
  延ばす。Vitest の `it.skip` で本番 CI から除外し、ローカル `npm run test:bench` で実行する
  運用とする
