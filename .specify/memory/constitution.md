<!--
SYNC IMPACT REPORT
==================
Version change: (template / unversioned) → 1.0.0
Bump rationale: Initial ratification of the project constitution. All placeholder
tokens replaced with concrete content for the Othello (Reversi) match-play app.

Modified principles:
  - [PRINCIPLE_1_NAME] → I. ユーザー体験ファースト (UX First)
  - [PRINCIPLE_2_NAME] → II. ミニマル＆洗練されたデザイン (Minimal & Refined Design)
  - [PRINCIPLE_3_NAME] → III. 直感的な操作性 (Intuitive Interaction)
  - [PRINCIPLE_4_NAME] → IV. 拡張可能なアーキテクチャ (Extensible Architecture)
  - [PRINCIPLE_5_NAME] → V. 品質ゲート (Quality Gates)

Added sections:
  - Technology & Design Standards (replaces [SECTION_2_NAME])
  - Development Workflow & Quality Gates (replaces [SECTION_3_NAME])
  - Governance (filled with concrete amendment procedure & versioning policy)

Removed sections: none.

Templates requiring updates:
  - ✅ .specify/templates/plan-template.md — "Constitution Check" section is generic
    and references this file by name; no token changes required.
  - ✅ .specify/templates/spec-template.md — aligned with UX-first / measurable
    success criteria; no structural changes required.
  - ✅ .specify/templates/tasks-template.md — task categories already cover setup,
    foundational, user-story, and polish phases; consistent with Principle IV & V.
  - ✅ .specify/templates/checklist-template.md — generic; no changes required.
  - ✅ AGENTS.md / CLAUDE.md — directs agents to read the current plan; consistent
    with this constitution. No edits required at this time.

Follow-up TODOs: none.
-->

# Othello 対戦アプリ Constitution

## Core Principles

### I. ユーザー体験ファースト (UX First)

すべての設計・実装判断は、対局者の体験を最優先するものでなければならない (MUST)。
機能の追加や変更は、(a) 既存ユーザーの操作を阻害しないか、(b) 学習コストを増やさないか、
(c) 対局のテンポを損ねないか、の三点を満たすことを書面で確認した上で採用される。
技術的な簡潔さや実装の都合がユーザー体験と衝突した場合、原則としてユーザー体験を優先する。

**Rationale**: 本プロジェクトの存在意義は「楽しく、迷わず遊べるオセロ」を提供することであり、
プロダクトの差別化要因は技術ではなく体験品質にある。

### II. ミニマル＆洗練されたデザイン (Minimal & Refined Design)

UI は装飾を加算するのではなく削減して整える (MUST)。色数・フォントの種類・装飾要素は
意図して最小に保ち、盤面と石の視認性を最優先する。アニメーションは目的（状態遷移の明示、
入力フィードバック、勝敗演出）が明確な場合に限り採用し、長さは原則 300ms 以下とする (SHOULD)。
アイコン・トースト・モーダル等の UI コンポーネントは新規追加よりも既存パターンの再利用を優先する。

**Rationale**: ミニマルなデザインは長期的な保守性と視覚的整合性を両立させ、
将来の機能拡張で UI が破綻するリスクを下げる。

### III. 直感的な操作性 (Intuitive Interaction)

主要操作（合法手のハイライト、石を置く、手番表示、リセット、対局開始）は説明なしで
発見可能でなければならない (MUST)。すべての入力は、対局者がアクションの結果を実行前に
予測できるよう視覚フィードバックを伴う (MUST)。誤操作からの復帰経路（例: 直前手の取り消し、
新規対局の開始）は最大 2 操作で到達可能とする (SHOULD)。

主要画面はキーボード操作とスクリーンリーダー読み上げの両方で完結できることを目標とする
（WCAG 2.1 AA 相当）(SHOULD)。

**Rationale**: 「分かりやすい操作性」は仕様ではなく検証可能な体験基準として定義する必要が
あり、ヒューリスティック評価と実機検証によって測定される。

### IV. 拡張可能なアーキテクチャ (Extensible Architecture)

ゲームロジック（盤面状態・合法手判定・勝敗判定）は UI レイヤーから分離し、
純粋関数または独立モジュールとして実装する (MUST)。プレゼンテーションとロジックの境界は
型シグネチャで明示され、UI 変更がロジックのテストを破壊しない構造を維持する。

将来予定される機能（CPU 対戦、難易度設定、リプレイ、オンライン対戦、棋譜保存、テーマ切替
など）は、現時点で実装しない場合でも、それを差し込む拡張点（インターフェース、ストア、
ルーティング）を阻害しないよう設計する (MUST)。ただし「将来必要になりそうだから」という
理由だけで未使用のコードや抽象を導入してはならない (MUST NOT) — YAGNI を優先する。

**Rationale**: 拡張性は「今書く抽象」ではなく「将来書き換えやすい境界」によって担保される。
過剰な事前抽象化は変更コストをむしろ増やす。

### V. 品質ゲート (Quality Gates)

以下を満たさないコードはマージしない (MUST):

- TypeScript の型エラーゼロ (`tsc --noEmit` 相当が通る)
- ESLint エラーゼロ (`npm run lint` が通る)
- ゲームロジック（合法手判定・石の反転・勝敗判定）に対する単体テストが存在し、すべて通過する
- ユーザー操作を変更する PR では、ブラウザでの動作確認を行いその結果を PR 本文に記載する

依存関係の追加は、それが解決する具体的な問題と「自前実装で代替不可能な理由」を PR で
説明することを要求する (MUST)。

**Rationale**: 自動化された品質ゲートは UX 品質の前提であり、リグレッションが対局体験を
直接損なうため非交渉条件とする。

## Technology & Design Standards

**Technology Stack** (本リポジトリで採択済み・変更には Constitution 改定が必要):

- フレームワーク: Next.js (App Router、最新メジャー)
- 言語: TypeScript (strict)
- UI: React + Tailwind CSS
- Lint: ESLint (`eslint-config-next`)
- パッケージマネージャ: npm（`package-lock.json` をリポジトリで管理）

**Design Tokens**:

- カラーパレット・フォント・余白スケールは Tailwind の設定として一元管理する (MUST)
- 盤面・石・合法手ハイライトの配色はコントラスト比 4.5:1 以上を確保する (SHOULD)

**Next.js について**: 本プロジェクトの Next.js は破壊的変更を含む新しいバージョンを採用しており、
コード生成・参照は `node_modules/next/dist/docs/` 配下のドキュメントを正とする (MUST)。
学習データ由来の古い API・規約・ファイル構造を前提にしてはならない。

## Development Workflow & Quality Gates

**Spec-Driven Flow**: 新機能は原則として `/speckit-specify` → `/speckit-plan` →
`/speckit-tasks` → `/speckit-implement` の順で進める。小規模な修正（バグ修正、文言調整、
スタイル微調整）はこの限りではない。

**Branching**: 機能開発は機能ブランチで行い、`main` への直接コミットは行わない (MUST)。

**Pull Request Requirements**:

- ゲームロジックの変更を含む PR は、対応する単体テストの追加または更新を含む (MUST)
- UI 変更を含む PR は、変更箇所のスクリーンショットまたは動作の説明を本文に含む (MUST)
- 拡張ポイントに影響する変更は、既存の拡張予定（CPU 対戦、リプレイ、テーマ切替など）を
  阻害しないことを PR 本文で明示する (SHOULD)

**Review**: すべての PR はレビューを経てマージする。Constitution に違反する変更は、
違反理由と代替案検討の記録（plan.md の Complexity Tracking 等）なしにマージしてはならない。

**Definition of Done**:

1. 該当ブランチで型チェックと Lint が通過
2. ゲームロジックの単体テストが通過
3. UI 変更はブラウザで golden path を 1 度は動作確認
4. CLAUDE.md / AGENTS.md / 本 Constitution に反する記述・実装が含まれない

## Governance

**Authority**: 本 Constitution は本リポジトリにおける開発・設計の最上位ルールであり、
コードコメント、README、AGENTS.md、その他ドキュメントよりも優先する。矛盾が生じた場合は
本 Constitution を正とし、他のドキュメントを更新する。

**Amendment Procedure**:

1. 改定提案は PR として提出し、変更点とその根拠（解決したい問題、影響範囲）を記載する
2. 改定は本ファイル (`.specify/memory/constitution.md`) の編集に加え、
   `.specify/templates/` 配下の関連テンプレートとの整合性確認を含む
3. 改定 PR では Sync Impact Report（本ファイル先頭の HTML コメント）を更新する

**Versioning Policy** (Semantic Versioning):

- **MAJOR**: 既存原則の削除、または互換性のない再定義（例: 「品質ゲート」の必須項目削除）
- **MINOR**: 新しい原則・セクションの追加、または既存原則の実質的な拡張
- **PATCH**: 文言修正、誤字訂正、根拠の補強など、規範的意味を変えない変更

**Compliance Review**: 機能計画 (`plan.md`) 作成時に、本 Constitution と整合しているかを
確認する Constitution Check ゲートを必ず通過する (MUST)。違反が必要な場合は plan.md の
Complexity Tracking で明示し、代替案検討の記録を残す。

**Runtime Guidance**: 実装中の判断材料として、開発者およびエージェントは AGENTS.md /
CLAUDE.md および本 Constitution を参照する。

**Version**: 1.0.0 | **Ratified**: 2026-05-30 | **Last Amended**: 2026-05-30
