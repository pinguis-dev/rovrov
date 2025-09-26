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

- App Shell: `App.tsx` で `SafeAreaProvider` と `ThemeProvider` を全体に巻き、`expo-font` で `Inter` / `Noto Sans JP` を事前ロード。Expo Router の `appRoot` を `src/app` へ切り替え、背景色はトークン化済みの `color-surface-base` を適用しました。
- Tokens Module: `src/design/tokens.ts` にタイポ (`typo-hero`〜`typo-footnote`)、カラー (`color-text-*` / `color-surface-*`)、スペーシング (`space-*`)、ボーダー (`border-0.3`)、モーション (`motion-tap`〜`motion-hero`) を型付きで定義し、`useDesignTokens()` から参照できるようにしています。
- Theme Hook: `src/design/design-system.tsx` の `ThemeProvider` / `useDesignTokens` でガラス調サーフェスやソフトシャドウを含むトークンを配布。Expo Router 由来のツリー全体が半透明トーンを共有します。
- Preview Route: `src/app/design/tokens-preview.tsx` にグラデーション背景のプレビュー画面を実装。`motion-content` によるカードのフェードインと `motion-micro` のパルス表示でモーションを検証できます。
- Icon Baseline: `src/design/icons.tsx` で Remix Icon のライン/フィル対応を定義し、`src/app/(tabs)/_layout.tsx` からトークン色と組み合わせてスプリットボトムタブを構成しました。
- Split Bottom Navigation: `src/components/split-tab-bar.tsx` で TL/Map/Notice/Account を左セクションに集約し、右側の Post アクションは常時表示のグラスボタンとして実装しました。Expo Router の TabBar を差し替え、Remix Icon とトークン色が切り替わるようにしています。
- Tab Surface: `src/app/(tabs)/index.tsx` / `map.tsx` / `notifications.tsx` / `account.tsx` をデザイントークンベースのスクリーンに差し替え、タイポ・カラー・スペーシングとガラス調カードを確認できるプレースホルダーを配置しました。
- Lint Config Refresh: スプリットタブ導入に合わせて `eslint.config.js` のルール調整（React in scope / inline-style 警告の無効化、`.expo/**` ignore など）と `eslint-import-resolver-alias` 追加を行い、`npm run lint`・`npm run typecheck` が無警告で通ることを確認しました。

## Definition of Done

- `yarn lint`・`yarn tsc --noEmit` が成功する。
- `TokensPreviewScreen` のスクリーンショット（iOS Sim + Android Emu）が添付され、透明感とタイポが確認できる。
- トークン値を参照した `renderTokenValue` のユニットテストが通る。
- PR にてデザインレビュー（企画側）・コードレビューを各1件取得。

## Installed Packages

- eslint-import-resolver-alias
  - Version: 1.1.2
  - Published: 2017-11-02
  - Purpose: Resolve `@` path aliases in ESLint import-order checking for Expo Router codebase.
