# チケット運用ルール

## 目的
- 実装着手前にチケット粒度をそろえ、担当者が迷わず作業できる状態をつくる。
- 作成したチケットのみで企画者のイメージと実装者のイメージが揃う状態をつくる。
- チケット・PR・マイルストーンを一元管理し、履歴を残しながら開発を進める。
- 企画書（`proposal.md`）・デザイン指針（`design_animation_rules.md`）と整合した仕様をチケット時点で明文化する。

---

## リポジトリ構成
```md
/issues/                     # 実チケットを個別ファイルで格納
    FE-0001-post-ui.md
    BE-0002-post-api.md
    INF-0003-storage-setup.md
/roadmap.md                  # マイルストーン別の一覧（人が読む用）
.github/ISSUE_TEMPLATE.md    # GitHub Issue テンプレート
.github/PULL_REQUEST_TEMPLATE.md
```

### 運用ポイント
- `issues/` 配下に存在する Markdown ファイルがチケットのシングルソース。
- `roadmap.md` にマイルストーン単位でチケットを整理し、スプリント計画やレビューで参照。
- GitHub Issue/PR テンプレートはチケット内容を転記できるよう最小構成に保つ。

---

## ファイル命名規則
- 形式: `<TYPE>-<NNNN>-<short-slug>.md`
    - 例: `FE-0001-post-ui.md` / `BE-0102-add-auth.md` / `CH-0001-cleanup-docs.md`
- `TYPE` はチームで定義したカテゴリ（例: `FE`=Frontend, `BE`=Backend, `INF`=Infra, `BUG`, `DOC`, `CH`）。
- 連番部分（例: `FE-0001`）がチケット ID。YAML の `id` と完全一致させる。
- `short-slug` は小文字・ハイフン区切りで簡潔に。日本語は避ける。

---

## チケットファイル構成
チケットは **YAML Front Matter** と **本文** の 2 パートで構成する。

### 必須 YAML フィールド
| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `id` | string | 必須 | 例: `FE-0001`。ファイル名の ID と一致させる。|
| `title` | string | 必須 | チケットの短いタイトル。|
| `type` | string | 必須 | `feature` / `bug` / `chore` / `doc` など。|
| `area` | string | 必須 | 担当領域: `frontend` / `backend` / `infra` / `design` など。|
| `epic` | string&#124;null | 任意 | 紐づく EPIC ID。なければ `null` または省略。|

### 本文の必須セクション
それぞれ `##` 見出しで記述し、必要に応じて小見出しや箇条書きを追加する。

1. `## 概要` — チケットのゴールを短くまとめる。
2. `## 背景・目的` — ユーザーストーリーや課題感を記載。
3. `## 受け入れ基準 (Acceptance Criteria)` — テスト可能な条件を箇条書きで明示。
4. `## 実装スコープ` — FE/BE/Infra/Design などに分けて担当範囲を整理。
5. `## 実装計画` — コンポーネント構成と組み合わせのイメージを、px 指定や参照 UI を交えて言語化し、`design_animation_rules.md` に準拠する根拠を明記。
6. `## 実装メモ / 注意点` — 依存関係、互換性、参考リンク、リスクなど。
7. `## Definition of Done` — チケット完了に必要なチェック項目（テスト、レビュー、デプロイ等）。

### サンプル（詳細版）
```md
---
id: FE-0001
title: 投稿画面のUI実装（画像選択・位置選択）
type: feature
area: frontend
epic: EPIC-POST-FLOW
---

## 概要
投稿フローの 1 画面目として、画像の選択・公開設定・位置タグ・タグ入力・キャプションを扱うフォームを実装し、送信時にモック API へデータを送る。

## 背景・目的
- MVP の主要体験「小さな冒険を素早く記録する」を支える画面。操作回数を最小にしつつ、proposal.md で定義された項目を網羅する必要がある。
- Post Flow 全体（EPIC-POST-FLOW）で最初に着手すべき基礎画面のため、UI/UX を固めることで後続の詳細設定・投稿完了画面の仕様が安定する。

## 受け入れ基準 (Acceptance Criteria)
- FAB から遷移すると投稿フォーム画面が開き、以下の UI 要素が表示される。
    - 最大 8 枚までの正方形サムネイルグリッド（空セルは「＋」ボタン）。
    - 「どこにいったの？」テキストフィールド（未選択時 placeholder）。
    - キャプション入力（最大 140 文字、残り文字数カウンター付き）。
    - タグ入力（半角スペース or Enter で確定し、タグチップ + 削除ボタン表示）。
    - 公開範囲切替アイコン（`public` / `friends` / `secret`）。
    - 送信ボタン（写真未選択時は disabled）。
- 写真タイルの挙動
    - 画像追加ボタンで `ImagePicker`（Expo ImagePicker）を起動できる。
    - 各サムネイル右上の × アイコンで削除、左下の公開設定アイコンタップで inline メニューが出る。
    - 画像追加後は最大 8 枚でスクロールせずに表示される。
- 位置選択
    - テキストタップまたは Pin アイコンタップで Bottom Sheet を起動。
    - Bottom Sheet には現在地ベースの候補 5 件（モック）と検索バーがあり、検索するとフィルタリングされる。
    - Pin 決定後はタイトル横に選択ラベル（例: "渋谷スクランブル"）を表示、アイコンをアクティブカラーに切り替え。
- 送信ボタン押下時の処理
    - `POST /posts`（モック）へ以下のペイロードを送信し、成功時は `PostSuccess` 画面へ遷移。
      ```ts
      {
        media: Array<{ uri: string; visibility: 'public'|'friends'|'secret' }>,
        locationId: string | null,
        caption: string,
        tags: string[],
        visitedAt: string, // ISO8601
        companions: string[] // user ids
      }
      ```
    - API コール中は全入力を disabled にし、ローディングインジケータを表示。
    - API エラー時は design_animation_rules.md のトーストモーションでエラーメッセージを表示し、状態を解除。
- アクセシビリティ
    - 主要ボタン/アイコンに `accessibilityLabel` を付与。
    - カラーコントラストは WCAG AA を満たす（text-body vs 背景）。

## 実装スコープ
- Frontend
    - `PostScreen.tsx`（フォームコンテナ）
    - `PostImageGrid` / `PostImageTile` コンポーネント
    - `PostVisibilityMenu`（公開設定メニュー）
    - `LocationBottomSheet` + 検索フィルターロジック
    - `useCreatePostMutation`（React Query のモック API フック）
    - `postValidation.ts`（入力検証ユーティリティ）
- Backend: なし（モック API を `msw` またはダミー関数で実装）。
- Design: Figma を用いず、`design_animation_rules.md` のトークンを根拠にレビューする。

## 実装計画
- **コンポーネントの骨格**: 画面全体は `PostScreen` をハイレベルコンテナとし、上部に 48px 高のトップバー（透明背景 + `typo-title` 字体）を置き、その直下に縦 320px の `PostImageGrid` を配置。グリッドのタイルは 8px グリッドで `4px` ギャップ、境界は `border-0.3` を使用。
- **サムネイルブロックのイメージ**: iOS 26 の写真アプリ「最近の項目」ライクに、横幅いっぱいを使ったフルブリードグリッド。選択状態は Apple Music の Now Playing ボタンのような半透明オーバーレイ + `color-text-title` でアイコンを描画する。
- **入力セクションの組み合わせ**: サムネイルの下に高さ 88px のカードスタックを並べ、順に場所入力・キャプション・タグフォームを縦積み。各カードは 12px のラウンド、背景は `rgba(255,255,255,0.72)`。design_animation_rules.md の「ミニマル & クリア」を踏襲し、Photos のメタデータカードを参考に質感を合わせる。
- **Bottom Sheet イメージ**: `LocationBottomSheet` は高さ 60% の透明感あるモーダル。ヘッダー 56px、リストアイテム 64px（アイコン 24px + テキスト 16px）。iOS 26 Maps の検索結果シートを参考に、背景は `blur(20px)` + 白 70%。モーションは `motion-content` トークン（200–300ms, deceleration）。
- **公開設定メニュー**: `PostVisibilityMenu` は Instagram の共有範囲トグルを参考にしつつ、背景透明度やアイコンは design_animation_rules.md のカラートークンに合わせる。各項目は円形 40px、選択時は `color-text-title` に白抜き、背景 `rgba(58,58,58,0.16)`。
- **トークン準拠のモーション**: サムネイルの追加/削除には `motion-micro`（120–180ms）でフェード + スケールイン。Bottom Sheet 開閉は `motion-content`。トーストは `motion-hero` を 280ms spring に調整。
- **参照 UI**: 全体の雰囲気は X（旧Twitter）iOS 投稿モーダル + iOS 26 Photos の編集カードを掛け合わせたイメージ。透明感と最小限のアウトラインで未来的な質感を出す。

## 実装メモ / 注意点
- `design_animation_rules.md` のトークン以外を使用する場合は理由を明記。
- 画像はファイルサイズ肥大化を避けるため、Expo ImageManipulator で長辺 1440px へ縮小。
- タグ入力は IME 変換確定を検知するため `onSubmitEditing` + スペース検知で実装。
- State 管理は `useState` + `useReducer` で十分。後続の詳細設定画面と値を共有するため、`PostDraftStore`（Zustand）を導入予定（このチケットではフォーム内ローカル状態で OK）。
- 位置候補のモックデータは `fixtures/locations.json` として追加し、将来的な API 差し替えが容易な構造に。

## Definition of Done
- `PostImageGrid` の枚数別（1〜8枚）スナップショットテストを追加。
- `postValidation.test.ts` で 140 文字制限・タグ重複禁止のテストを追加。
- `PostScreen.stories.tsx` を作成し、以下 3 状態（初期、写真3枚、エラー発生）を Storybook で確認。
- 実機 or シミュレータで 3 回以上の投稿フローを手動確認し、録画を PR に添付。
- Firebase Analytics へ `post_flow_submit` イベントを送信するロギングを仮実装（ダミー関数で OK）。
- Lint / TypeScript / Jest が全て通過。
- デザインレビュー & コードレビューをそれぞれ 1 件以上取得。
```

---

## チケット記載チェックリスト
- [ ] 企画資料 (`proposal.md`, `design_animation_rules.md`, その他仕様書) への参照リンクを明記したか。
- [ ] ユーザーストーリー / 成果物が第三者に伝わるか（背景の文脈が抜けていないか）。
- [ ] UI 状態（初期・成功・失敗・空・ロード中）を受け入れ基準で列挙したか。
- [ ] 非機能要件（パフォーマンス、アクセシビリティ、レスポンシブ、安全性）を網羅したか。
- [ ] データ契約（リクエスト/レスポンス、保存形式）のサンプルを提示したか。
- [ ] モーション / トランジションの指定をデザイントークンベースで記載したか。
- [ ] 計測・ログ（Firebase, Supabase, Sentry 等）を必要に応じて明記したか。
- [ ] ノンハッピーケース（エラー、権限未許可、タイムアウト等）の扱いを定義したか。
- [ ] 実装計画にコンポーネント構成・組み合わせイメージ・既存 UI 参照・px 指定を記載したか。
- [ ] テスト戦略（ユニット / E2E / Storybook / 手動検証）と条件を DoD に落とし込んだか。
- [ ] 他チケットとの依存関係やブロッカーを `実装メモ` に明記したか。

---

## よくある不足例と補完の指針
| 不足例 | 補完すべき情報 |
| --- | --- |
| 「API を呼ぶ」で終わっている | エンドポイント、パラメータ、レスポンス例、エラー時の挙動、モック方法 |
| 「デザインに合わせる」としか書いていない | `design_animation_rules.md` を根拠にした明確なトークン指定、参照 UI、px 情報 |
| ユーザー入力系で境界条件が書かれていない | 入力上限長、バリデーションルール、未入力時の文言、キーボードタイプ |
| 新規ナビゲーション追加で遷移図がない | 既存スタックへの追加位置、back 挙動、deeplink/notification からの導線 |
| モーション指定が曖昧 | 使用トークン名、duration/easing、Shared Element の tag 名称 |
| 計測要件が抜けがち | どのイベントをどのタイミングで送るか、プロパティ定義、ダミー実装するか |

---

## 運用ルール

### 粒度
- 1 チケットは目安として **1〜2 日で完了できる作業量** に分割する。
- 大きな機能は EPIC → チケット → タスク（必要なら Sub-task）と段階的に分解。

### ワークフロー
1. チケット作成時に `issues/` 下へファイル追加し、PR でレビューを受ける。
2. 着手時はブランチを `feat/FE-0001-short-slug` の形式で作成。
3. PR テンプレートの `Related` セクションへ対象チケットパスを記載（例: `issues/FE-0001-post-ui.md`）。
4. 実装中に仕様が変わった場合はチケットを更新し、レビューを再実施。
5. PR マージ時にチケットのステータスを Done に移し、必要なら Diff を残す。

### Definition of Done の扱い
- DoD の全項目を満たした時点で初めて Done とする。
- テスト・レビュー・ステージング確認が未完の場合は `In Review` や `Blocked` 状態で止める。
- チケット完了後も `issues/` ディレクトリに履歴が残るため、振り返りや監査に活用できる。
