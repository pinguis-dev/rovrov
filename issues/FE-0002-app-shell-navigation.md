---
id: FE-0002
title: アプリシェルと Split Bottom Navigation の実装
type: feature
area: frontend
epic: EPIC-FE-MVP
---

## 概要
Expo Router を用いて TL / Map / Notification / Account タブと中央の Post アクションで構成されたカスタム SplitTabBar を実装した。タブバーはスクロールに応じてフェードアウトし、ガラス調の背景と白フェードで画面下に自然に溶け込む。

## 実装ガイド

### 1. タブ構成
- `src/app/(tabs)/_layout.tsx`
  - TL タブは `name="index"` / `title="TL"` のまま `tabBarIcon` に `TabIcon icon="tl"` を指定。
  - そのほか `map` / `notifications` / `account` も同様に `TabIcon` を呼び出すだけにする。
  - 中央の Post モーダルは `router.push('/modal')` で起動。

### 2. アイコン定義
- `src/design/icons.tsx`
  - Ionicons (`grid`, `map`, `notifications`, `person-circle-sharp`, `add-sharp`) を使用。
  - `TAB_ICON_SIZE = 24`。Account のみ +2px（26px）に補正。
  - 色は常に #000000。未選択／選択でカラー差異はつけず、ハイライトのみで状態表示。

### 3. SplitTabBar (`src/components/split-tab-bar.tsx`)
- **レイアウト**
  - `actionHeight = 60`。Safe Area やスクロール値から下パディングやフェード距離を算出。
  - 背景は `BlurView` + `overlayColor = rgba(255,255,255,0.40)`。
  - 白フェード `LinearGradient` は `shadowColors = ['rgba(255,255,255,0)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0.95)']`。`marginTop: tokens.spacing['space-16']` を指定し、グラデーション開始位置を 16px 下げる。
- **タブアイコン & ラベル**
  - 各タブの子要素に 11px ラベル（`tokens.colors['color-text-body']`）を追加。`marginTop: 2`。
  - 左右端のタブは `marginLeft` / `marginRight` で 4px の余白。
- **ハイライト**
  - 背景色 `rgba(0,0,0,0.12)`。上下左右 4px のインセットを持つ。
  - フェードアウト 200ms → ディレイ 200ms → フェードイン 320ms (`Animated.timing` の `delay` を `isFocused` 時に設定)。
  - アイコンは切り替えず、ハイライトのみで状態を示す。
- **スクロール連動**
  - `useTabBarVisibilityValue()` の値でタブクラスタの `opacity` と `translateY` を制御。
  - Post ボタンは `postOpacity` を `max(0.35)` にクランプし完全には消えない。
- **Post ボタン**
  - Ionicons `add-sharp` (24px)。ボタン自体は `BlurView` + `overlayColor` でカバー。
  - シャドウはタブクラスタと同じ設定（shadowOpacity 0.45 * 1.0, elevation 3 以上）。

### 4. ハイライト遅延のポイント
- フェードアウト用 `highlightHideDuration = 200`。
- フェードインは `highlightShowDelay = 200` / `highlightShowDuration = 320`。
- `highlightValuesRef` / `highlightStateRef` でタブごとの Animated 値を再利用し、無駄な再生成を避ける。

### 5. その他
- 影 (`shadow-opacity 0.22`, `shadow-radius 28`, `elevation 22`) を `innerWrapper` に設定し、浮いたような見た目にする。
- TL / Map / Notification / Account は `LEFT_ROUTE_ORDER` の順。中央ボタン `Post` は `router.push('/modal')`。

## 注意点
- `CornerGradientOverlay` は最終的に採用せず、標準のボーダー + 白フェードで調整。
- Safe Area を考慮して高さ 60px を死守。iPhone 15 Pro / Pixel 8 で確認済み。

## テスト / チェック
- `npm run typecheck`
- iOS / Android エミュレータでスクロール時のフェード、ハイライトのディレイ、白フェードの位置を目視確認。

## Definition of Done
- iOS / Android 双方でタブバーが正常に表示・フェードする。
- Post モーダル遷移が問題なく起動する。
- リンター / 型チェックが通過する。

## Installed Packages
- なし（すべて Expo プロジェクト標準依存に含まれる）
