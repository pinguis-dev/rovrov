---
id: FE-0001
title: Expo基盤とデザイントークン初期セットアップ
type: feature
area: frontend
epic: EPIC-FE-MVP
---

## 概要
Expo (TypeScript) プロジェクトを初期化し、`docs/design_animation_rules.md` で定義したタイポ・カラー・モーションをトークン化して共有できるフロントエンド基盤を構築する。

## 背景・目的
- `docs/proposal.md` で定義された各画面を実装する前段として、デザイン/アニメーション指針に従ったスタイル適用手段を整える必要がある。
- トークン未定義のまま各画面を実装すると、透明感やタイポスケールなどの基準がずれ、UI の一貫性が損なわれる。

## 受け入れ基準 (Acceptance Criteria)
- Expo SDK 50 以降で TypeScript プロジェクトが作成され、`src/` 配下にアプリ構成が整備されている。
- `Inter`（英字）と `Noto Sans JP`（日本語）が `expo-font` でロードされ、`typo-*` トークン経由で画面から参照できる。
- カラー (`color-text-*`, `color-surface-*`)、スペーシング (`space-*`)、ボーダー (`border-0.3`)、モーション (`motion-*`) をまとめた `src/design/tokens.ts`（型定義付き）が存在する。
- トークンを利用したプレビュー画面（`/design/tokens-preview` など）があり、Hero/Title/Body/Footnote タイポと主要カラーが iOS26 ライクな透明感で表示される。
- ESLint（React Native 推奨設定）と Prettier、TypeScript strict 設定が追加され、`yarn lint`・`yarn tsc --noEmit` が成功する。
- Storybook もしくは Expo Router 上のデザイン検証ルートで `motion-micro`・`motion-content` を用いた簡易アニメーションが確認できる。

## 実装スコープ
- Frontend: Expo 初期化、ディレクトリ構成定義、フォントロード、`tokens.ts` と型、プレビュー画面、Lint/TS 設定、Storybook or Preview route。
- Backend: 対象外。
- Infra: 対象外。

## 実装計画
- **App Shell**: `App.tsx` で `SafeAreaProvider` と `ThemeProvider` をラップし、背景カラーを `rgba(248,250,255,0.96)`（`design_animation_rules.md` のミニマル基調に合わせたサーフェス）で統一するイメージ。iOS26 の設定アプリと同程度の淡い陰影に留める。
- **Tokens Module**: `src/design/tokens.ts` に `typoHero: { fontSize:48, lineHeight:56, fontFamily:'Inter_200ExtraLight' }` などを記載し、`space` 系は `{ 4, 8, 16, 24, ... }`。カラーは `color-text-title:#3A3A3A`、サーフェスは `rgba(255,255,255,0.72)` を採用し透明感を再現。
- **Theme Hook**: `useDesignTokens()` を作り、Typography/Spacing/Shadow をオブジェクトで返す。Apple Music iOS26 の Now Playing カードのように半透明 + ぼかしを使いたい箇所向けに `surfaceGlass` や `shadowSoft` を含める。
- **Preview Screen**: `TokensPreviewScreen` を用意し、`Hero → Display → Title → Body → Footnote` の順にテキスト見出しを表示。背景に `LinearGradient` で淡いブルーからホワイトへ 320px グラデーションを敷き、透明感を強調。モーションサンプルとして `motion-content` でカードをふんわり登場させる。
- **Icon Baseline**: Remix Icon を導入し、iOS26 のボトムバーと同じ 28px サイズでプライマリアイコンを描画する設定を `design/icons.ts` にまとめるイメージ。

## 実装メモ / 注意点
- `docs/design_animation_rules.md` で規定された値を基準とし、それ以外の数値を使う場合はコメントで根拠を残す。
- Expo Router を採用する場合、`app/_layout.tsx` にテーマラッパーをまとめる。
- Lint ルールは `@react-native-community/eslint-config` をベースに、`import/order` と `unused-imports` を追加。
- Storybook 導入が重い場合は `expo-router` の `/design` ルートで代替してもよい。

## Definition of Done
- `yarn lint`・`yarn tsc --noEmit` が成功する。
- `TokensPreviewScreen` のスクリーンショット（iOS Sim + Android Emu）が添付され、透明感とタイポが確認できる。
- トークン値を参照した `renderTokenValue` のユニットテストが通る。
- PR にてデザインレビュー（企画側）・コードレビューを各1件取得。
