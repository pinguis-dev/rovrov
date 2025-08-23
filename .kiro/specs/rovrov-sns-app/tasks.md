# 実装計画

## プロジェクト基盤セットアップ

- [ ] 1. React Native + Expo プロジェクトの初期構成
  - Expo SDK 50によるReact Nativeプロジェクト作成
  - TypeScript設定とtsconfig.jsonの構成
  - ESLint/Prettierコード品質管理設定
  - 基本的なフォルダ構造の確立
  - _Requirements: 全ての要件に共通の基盤構築_

- [ ] 2. Supabase バックエンド接続設定
  - Supabase Clientライブラリのインストールと設定
  - 環境変数管理（.env, .env.example）の設定
  - Supabase認証・データベース・ストレージクライアントの初期化
  - 接続テストとデバッグ環境の構築
  - _Requirements: 要件1, 要件8_

- [ ] 3. 必須ライブラリとナビゲーション設定
  - React Navigation（Bottom Tabs + Stack）のインストール
  - Zustand状態管理ライブラリの設定
  - React QueryによるAPIキャッシュ管理設定  
  - react-native-mapsとGoogle Maps SDKの設定
  - _Requirements: 要件3, 要件4, 要件8_

## データベースとモデル構築

- [ ] 4. Supabase データベースのスキーマ設計と実装
  - PostgreSQL拡張機能（pgcrypto, PostGIS）の有効化
  - profiles, posts, media_files テーブルの作成
  - pins, follows, friends テーブルの作成
  - favorites, reposts, pinnings, tags テーブルの作成
  - _Requirements: 要件1, 要件2, 要件6, 要件7_

- [ ] 5. Row Level Security (RLS) ポリシーの実装
  - profilesテーブルのRLSポリシー設定（SELECT/INSERT/UPDATE/DELETE）
  - postsテーブルの可視性ポリシー実装（visibility, status制御）
  - media_filesのカスケード削除と公開範囲制御
  - 管理者権限とモデレーション機能のRLS設定
  - _Requirements: 要件2, 要件9_

- [ ] 6. データベーストリガーとストアドファンクションの実装
  - display_point自動計算トリガー（map_visibility対応）
  - posts_countカウンタキャッシュ更新トリガー
  - temporary投稿の24時間後自動アーカイブ処理
  - 論理削除から30日後の物理削除バッチ処理
  - _Requirements: 要件2, 要件9_

## 認証とユーザー管理

- [ ] 7. マジックリンク認証システムの実装
  - Supabase Auth設定とマジックリンク送信機能
  - メールアドレス/ユーザーID入力フォームの実装
  - Universal Links/App Links設定（ディープリンク）
  - JWT トークン管理とリフレッシュ処理
  - _Requirements: 要件1_

- [ ] 8. プロファイル管理機能の実装
  - プロファイル作成・更新フォームの実装
  - アバター画像とヘッダー画像のアップロード機能
  - ユーザー名の一意性検証と正規化処理
  - プロファイル表示画面とステータス管理
  - _Requirements: 要件1, 要件5_

- [ ] 9. アカウント状態管理とモデレーション
  - active/suspended/pending_deletion/deleted状態の管理
  - 退会申請と30日間の復帰猶予期間の実装
  - 一時停止ユーザーへのUI制限とバナー表示
  - 管理者用モデレーションAPIの実装
  - _Requirements: 要件9_

## 投稿機能の実装

- [ ] 10. メディアアップロード基盤の構築
  - expo-image-pickerによる画像選択・撮影機能
  - 画像圧縮と最適化処理（クライアント側）
  - Supabase Storageへの直接アップロード
  - Cloudflare Stream統合（動画用tus プロトコル）
  - _Requirements: 要件2_

- [ ] 11. 投稿作成UIとワークフローの実装
  - 投稿作成ウィザード画面の実装
  - キャプション、タグ、公開範囲設定UI
  - Pin選択と位置情報取得機能（EXIF/GPS）
  - draft → temporary → published/archived 状態管理
  - _Requirements: 要件2, 要件7_

- [ ] 12. 位置情報とプライバシー制御
  - map_visibility設定UI（none/approx_100m/exact）
  - display_point座標の計算と丸め処理
  - Pin候補の自動提案機能
  - 投稿後のPin追加・変更・削除機能
  - _Requirements: 要件2, 要件3_

- [ ] 13. メディア別公開範囲制御
  - メディア単位の visibility 設定UI
  - 親投稿より狭い範囲への制限ロジック
  - 非表示メディア枚数チップの表示
  - リポスト時のpublic限定チェック
  - _Requirements: 要件2_

## タイムライン機能

- [ ] 14. タイムラインフィード基本実装
  - featured/follow/friend タブの実装
  - ユーザー×日付での投稿グループ化
  - 横スクロールカルーセル表示
  - カーソルベースページネーション
  - _Requirements: 要件4_

- [ ] 15. ソーシャル機能の統合
  - いいね（favorite）機能の実装とカウント表示
  - リポスト機能とバリデーション
  - Pinningボタンとブックマーク管理
  - 相互フォロー時の友達申請導線
  - _Requirements: 要件4, 要件6_

- [ ] 16. React Queryによるキャッシュ最適化
  - フィード データのキャッシュ戦略設定
  - オプティミスティックアップデート実装
  - バックグラウンドデータ同期
  - stale-while-revalidate パターンの実装
  - _Requirements: 要件8_

## 地図機能（Rove）

- [ ] 17. Google Maps統合と基本地図表示
  - react-native-mapsの設定とスタイリング
  - 現在地取得と中心表示
  - カスタムマップスタイル適用（Cloud-based Maps Styling）
  - パフォーマンス最適化（マーカークラスタリング）
  - _Requirements: 要件3_

- [ ] 18. Pin表示と探索機能
  - PostGISによる周辺Pin検索クエリ
  - 地図上のPinマーカー表示（display_point利用）
  - Pin詳細カードのボトムシート表示
  - タグフィルター機能（デフォルト：カフェ）
  - _Requirements: 要件3_

- [ ] 19. Google Places API統合
  - POI検索エンドポイント実装（searchText/searchNearby）
  - Place Details取得とFieldMask最適化
  - Autocompleteセッション課金管理
  - 外部POI重複防止とキャッシュ戦略
  - _Requirements: 要件3, 要件7_

## アカウント詳細画面

- [ ] 20. プロファイル画面の実装
  - journal/rove/pinning/favorite タブUI
  - Private/Publicモード切り替え
  - 投稿履歴のタイムライン表示
  - フォロー/フォロワー/友達リスト（本人のみ）
  - _Requirements: 要件5_

- [ ] 21. 個人用地図とブックマーク管理
  - Roveタブでの訪問場所マップ表示
  - Pinningタブでのブックマーク一覧
  - Favoriteタブでのいいね投稿一覧
  - 地図表示設定の確認・変更機能
  - _Requirements: 要件5_

## フロントエンドコンポーネント

- [ ] 22. 共通UIコンポーネントの実装
  - AuthScreen（マジックリンク認証画面）
  - PostCreator（投稿作成ウィザード）
  - MapExplorer（地図探索コンポーネント）
  - PostCarousel（日別投稿カルーセル）
  - _Requirements: 要件1, 要件2, 要件3, 要件4_

- [ ] 23. モデレーション関連UIコンポーネント
  - ModerationBanner（停止状態表示）
  - AccountStatusGuard（権限チェックラッパー）
  - 退会申請と復帰フローUI
  - 管理者用モデレーション画面
  - _Requirements: 要件9_

## API層の実装

- [ ] 24. RESTful APIエンドポイントの実装
  - 認証エンドポイント（/api/v1/auth/*）
  - プロファイルCRUD（/api/v1/profiles/*）
  - 投稿CRUD（/api/v1/posts/*）
  - タイムラインAPI（/api/v1/timeline/*）
  - _Requirements: 要件1, 要件2, 要件4, 要件5_

- [ ] 25. メディア処理とCDN統合
  - Supabase Storage Image Transformations設定
  - Cloudflare Stream Webhook処理
  - 署名URL生成とアクセス制御
  - AVIF/WebP自動変換とEXIF除去
  - _Requirements: 要件2, 要件8_

- [ ] 26. エラーハンドリングとバリデーション
  - 標準エラーレスポンス形式の実装
  - 入力バリデーションミドルウェア
  - レート制限実装（認証系/読取系/書込系）
  - Idempotency-Key による冪等性保証
  - _Requirements: 全ての要件に必要なエラー処理_

## パフォーマンス最適化

- [ ] 27. 多層キャッシュ戦略の実装
  - L1: React Query（クライアントキャッシュ）
  - L2: Redis/Upstash設定（ホットパス用、段階的）
  - L3: Smart CDN（メディア配信）
  - L4: Cloudflare Stream（動画配信）
  - _Requirements: 要件8_

- [ ] 28. オフライン対応とデータ同期
  - ローカルストレージによる下書き保存
  - オフライン時の投稿キューイング
  - オンライン復帰時の自動同期
  - コンフリクト解決ロジック
  - _Requirements: 要件8_

## テストとデプロイ準備

- [ ] 29. テスト環境の構築
  - Jest + React Native Testing Library設定
  - 単体テストの作成（認証、投稿、API）
  - 統合テストの実装（主要フロー）
  - Detox E2Eテスト環境設定（MVP後）
  - _Requirements: 全ての要件に対する品質保証_

- [ ] 30. ビルドとデプロイ設定
  - EAS Build設定（iOS/Android）
  - 環境別設定ファイル管理
  - Vercel設定（Web版、将来対応）
  - Sentryエラー監視設定
  - _Requirements: 要件8, 非機能要件_