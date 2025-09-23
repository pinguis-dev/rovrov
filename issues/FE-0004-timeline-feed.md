---
id: FE-0004
title: タイムライン画面とPostカードUIの実装
type: feature
area: frontend
epic: EPIC-FE-MVP
---

## 概要
アプリ起動直後に表示されるタイムライン画面を実装し、`docs/proposal.md` に記載された画像レイアウト (1〜5枚)・Skeleton・Postアクション・自動リフレッシュ機構を備えたフィード体験を提供する。

## 背景・目的
- ユーザーが目的意識低く閲覧できる軽快なフィードが MVP の価値を支える。
- 画像グリッドやアクションのレイアウトを共通化することで、Post詳細やマップとの連携が成立する。

## 受け入れ基準 (Acceptance Criteria)
- ログイン済みユーザーでアプリ起動時に TL 画面が表示され、`FlatList` に投稿が 1 カラムで並ぶ。
- フィードの取得中は Skeleton (画像ブロック/テキストブロックに対応) に shimmer アニメーション (`motion-content`) が適用される。
- 画像枚数 1〜5 に応じて以下のレイアウトが再現される:
    - 1枚: 幅100%、高さ `0.8W`。
    - 2枚: 横2枚、各 `0.5W` × `0.4W`。
    - 3枚: 左 `2/3W` × `0.533W`、右 `1/3W` を上下2分割。
    - 4枚: 2x2 グリッド、各 `0.5W` × `0.4W`。
    - 5枚: 左 `0.5W`×`0.4W`、右側 2x2 (各 `0.25W`×`0.2W`)。
- PostHeader にユーザーID・日付・場所、右側に いいね/ブックマーク/共有/メニューが表示される。各アイコンは 24px、タップ時に `motion-micro` でスケールする。
- 本文は初期 2行まで表示し、「続きを見る」で全文展開する。展開時は `motion-content` で高さ変化をアニメーション。
- 最終スクロール位置で 3 件以上読み込まれた場合にページングリクエストが発生する (モック API)。
- 最後の更新から 30 分経過して復帰した場合、自動でフィードをリフレッシュし Skeleton→新着を表示する。

## 実装スコープ
- Frontend: TimelineScreen、PostCard、ImageGridユーティリティ、Skeleton、いいね/ブックマークのステート、React Query モック API。
- Backend: モック API (`fetchTimeline`) のみ。
- Infra: 対象外。

## 実装計画
- **スクリーン構成**: 背景は `rgba(248,250,255,0.96)`。`FlatList` ヘッダーに 48px のセクションタイトル (Hero → Body) を置き、iOS26 Photos の For You タブに近い淡い余白 (`space-16`) を確保。
- **Skeleton**: 画像部分はグレーボックス (透明度 0.35) に `LinearGradient` で斜めのシマー。テキストは 2 行分 (60%/40%)。Skeleton 全体の角丸は 16px。
- **PostCard**: 角丸 20px、背景 `rgba(255,255,255,0.78)`。影は `shadowSoft` を適用。カードの上下スペース `space-24`。Apple News iOS26 を参考に、カード同士は隙間を最小 (12px) に保つ。
- **ImageGrid**: `ImageGrid` モジュールで各パターンのスタイルを返す。境界線は `border-0.3`。個々のイメージは `resizeMode:'cover'`。グリッド内のギャップは 1px (rgba(255,255,255,0.3))。
- **PostHeader**: 左側のユーザー情報は `typo-title` + `typo-footnote`、右側アイコンは 24px (Remix Icon)。アイコンタップ時に背景 `rgba(0,0,0,0.06)` の円形 36px がふわっと表示される。Instagram iOS26 のアクションを参考にする。
- **PostBody**: 2 行表示時は `mask-image` (iOS) / gradient overlay (Android) で末尾をフェード。全文表示時は `height:auto` + `motion-content` で滑らかに開く。
- **Refresh**: `useFocusEffect` で前回表示時間を記録し、30分以上なら `queryClient.invalidateQueries(['timeline'])` を実行。リフレッシュ時に画面上部に細いライン (高さ 2px、アクセントカラー) を走らせる。

## 実装メモ / 注意点
- `ImageGrid` のレイアウト計算は単体テストを用意し、端末幅や Safe Area を考慮する。
- モック API は `fixtures/timeline.json` を使用し、公開範囲やタグも含めてデータ構造を将来対応可能にする。
- 無限スクロール時のローディングフッターは `motion-micro` でフェードを入れる。

## Definition of Done
- `ImageGrid` の各パターンと Skeleton のスナップショットテストが成功。
- 「続きを見る」展開とページングを含む React Testing Library の挙動テストが通る。
- iOS26 / Android のスクリーンキャプチャを PR に添付。
- `yarn lint`・`yarn tsc --noEmit` が成功。
- デザインレビュー・コードレビューを各1件取得。
