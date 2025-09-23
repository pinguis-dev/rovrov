---
id: FE-0002
title: アプリシェルとSplit Bottom Navigationの実装
type: feature
area: frontend
epic: EPIC-FE-MVP
---

## 概要
TL/Map/Notification/Account/Post の導線を備えたアプリシェルを構築し、`docs/design_animation_rules.md` に準拠した split bottom navigation を実装する。

## 背景・目的
- `docs/proposal.md` では、左セクションがフェードアウトするSplitタブ、右セクションが固定のPost FABという特徴的な導線が求められている。
- 画面ごとの実装に先立ち、ルーティングとナビゲーションの土台を整えることで、一貫したスクロール挙動と透明感のあるボトムバーを再利用できる。

## 受け入れ基準 (Acceptance Criteria)
- React Navigation (または Expo Router) を用いて、TL/Map/Notification/Account をタブ、Post をモーダル起動とする構成が機能する。
- ボトムバー左セクション (TL/Map/Notification/Account) は 48px 高で、下方向スクロール時に `motion-content` トークンによるフェードで非表示になる。
- 右セクションの Post FAB は中央に1アイコン分の空白を挟んで常時表示され、タップで投稿フロー (FE-0003) のプレースホルダー画面を起動する。
- Remix Icon の `*-Line` が未選択、`*-Fill` が選択状態として描画され、アイコンサイズは 28px、余白は `space-12` とする。
- Safe Area 対応済みで、iPhone 15 Pro (iOS26) シミュレータと Pixel 8 で重なりが発生しない。
- 背景は `surfaceGlass` 相当 (白 70% + blur) で描画され、半透明ボーダー (`border-0.3`) を上辺に敷く。

## 実装スコープ
- Frontend: Navigation Container、SplitBottomBar コンポーネント、スクロール検知フック、Remix Icon ラッパー、Post モーダルスタブ。
- Backend: 対象外。
- Infra: 対象外。

## 実装計画
- **Navigation Layout**: `AppNavigator` にスタック+タブ構成を定義。タブバーはカスタム `SplitBottomBar` で `height:48`、左右14pxの Safe Area パディング。iOS26 の App Store アプリ底部タブを参考に角を丸めないフラットなバーにする。
- **Left Cluster**: TL/Map/Notification/Account の4アイコンを水平配置し、各アイコン下に 2px 幅の `color-text-title` インジケータを描画。スクロール量 120px で `opacity:0` までフェードするガラスプレートを重ね、iOS の Home Indicator 周辺の消え方に合わせる。
- **Right Cluster**: Post FAB は 56px 角の丸型ボタン、中心に `ri/RiAddLine` を配置。背景は `rgba(37,102,255,0.92)`、影は `shadowSoft` で上方向に 6px ずらす。X (旧Twitter) の投稿ボタンを透明感強めにしたイメージ。
- **Scroll Bridge**: TL や Map からスクロール値を `useSharedValue` (Reanimated) で受け取り、SplitBottomBar に `motion-micro` で伝播。スクロール 0 → 120px で `translateY` 4px + `opacity` フェード。
- **Modal Trigger**: Post FAB タップで `PostStack` を `presentation:'modal'` で起動し、背景を iOS 標準のブラー (blur radius 30px) に設定。モーダル背景色は `rgba(255,255,255,0.85)`。

## 実装メモ / 注意点
- スクロール検知は各画面の `FlatList`/`ScrollView` に `onScroll` + `useSharedValue` を仕込み、`context` 経由で渡す。
- Notification/Account 画面は仮の `ComingSoon` コンポーネントで OK。`motion-content` でフェードインさせ、透明背景を確認できるようにする。
- Android での半透明ボーダーは `StyleSheet.hairlineWidth` との相性に注意。`borderTopColor: 'rgba(255,255,255,0.35)'` を直接指定。

## Definition of Done
- iOS26 (iPhone 15 Pro) と Android (Pixel 8) のスクリーンキャプチャを PR に添付し、Split タブのフェードと Post FAB の固定が確認できる。
- ナビゲーション単体のスナップショットテスト、フェードアニメーションの Jest + Reanimated テストが通過。
- `yarn lint`・`yarn tsc --noEmit` が成功。
- デザインレビュー (企画)・コードレビューを各1件取得。
