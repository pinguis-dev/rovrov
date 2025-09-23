---
id: FE-0005
title: 投稿詳細画面（Shared Element Transition含む）の実装
type: feature
area: frontend
epic: EPIC-FE-MVP
---

## 概要
タイムラインの投稿をタップした際に、Shared Element Transition で滑らかに遷移する詳細画面を実装し、画像リスト・本文全文・タグ・場所マップを `docs/proposal.md` の仕様で提供する。

## 背景・目的
- 投稿詳細は体験の深掘りを担う。タイムラインと同じコンテンツをシームレスに拡張表示する必要がある。
- Shared Element を実現しなければ、提案された「写真をタップして拡大する」体験の品質が落ちる。

## 受け入れ基準 (Acceptance Criteria)
- TL の画像タップで詳細画面へ遷移し、タップした画像が Shared Element (`sharedTransitionTag`) で拡大表示される。
- 詳細画面は以下を含む:
    - 画像リスト: フルブリードで縦スクロール表示。画像間境界線 0.3px。
    - PostMainInfo: ユーザーID、日付、場所 (Pin がある場合) を縦積み。
    - PostFullBody: 本文全文とタグ一覧 (タグは pill 形状)。
    - Map セクション: Pin が存在する場合のみ 5:4 アスペクトで表示。
- 画像読み込み中はぼかしプレースホルダーを表示し、読み込み完了でフェード遷移。
- シェアボタン押下で共有シート (模擬) を表示し、`docs/design_animation_rules.md` の `motion-content` で開閉。
- Back ジェスチャ (スワイプ) で遷移元の位置に戻り、Shared Element が逆再生される。

## 実装スコープ
- Frontend: PostDetailScreen、Shared Element 設定、画像リストコンポーネント、タグリスト、マップセクション、共有シートモーダル、モック API。
- Backend: モック API のみ。
- Infra: 対象外。

## 実装計画
- **画面レイアウト**: 背景は `rgba(16,18,24,0.95)` のダークトーンで、写真が映えるように調整。スクロールに合わせてステータスバーをライト/ダークで切り替える。Apple Photos iOS26 の全画面表示を参考に、左右余白なしのフルブリード画像。
- **画像リスト**: `Animated.ScrollView` に Shared Element 内のヘッダー画像を連結。各画像の高さは実画像アスペクト比に従う。読み込み中は `rgba(255,255,255,0.12)` のプレースホルダーを敷く。
- **情報カード**: 画像リスト下に 24px の `surfaceGlass` カードを設置。角丸 24px。`typo-title` でユーザーID、`typo-footnote` で日付、場所は小さなマップピンアイコン (20px) + テキスト。
- **タグリスト**: `Chip` コンポーネント (高さ 32px、左右パディング 16px、背景 `rgba(255,255,255,0.12)`、文字色 `#FFFFFF` 70%)。iOS の App Store ハッシュタグを参考に。
- **マップセクション**: `react-native-maps` を用い、縦 `width * 0.8`。枠線は `border-0.3`、角丸 20px。Pin は `color-text-title` を活かした濃紺で描画。
- **共有シート**: 画面下部から 320px の高さで表示。背景 `blur(30px)` + 白 78%。オプションボタンは 56px 角の丸ボタンに Remix Icon を 28px サイズで配置。iOS26 の共有シートをコンパクトにしたイメージ。

## 実装メモ / 注意点
- Shared Element は Reanimated + `react-navigation-shared-element` を利用。TL 側の画像と Detail 側の最上部画像で `id=post-${id}-image-0` などを合わせる。
- Android では Shared Element のフォールバックとしてフェードイン/アウトを用意。
- Map 表示には API Key が必要なため `.env` を導入し、README に手順記載。

## Definition of Done
- Shared Element が iOS26/Android で意図通り動く動画を PR に添付。
- タグ表示やマップが正しく切り替わるユニットテスト/スナップショットが成功。
- `yarn lint`・`yarn tsc --noEmit` が成功。
- デザインレビュー・コードレビューを各1件取得。
