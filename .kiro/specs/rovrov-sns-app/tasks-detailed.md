# 実装タスク詳細（バックエンド・フロントエンド分離版）

## 概要
本書はRovRov SNSアプリケーション実装に必要な全タスクを、バックエンド（BE）とフロントエンド（FE）に分けて詳細化したものです。各タスクには参照すべき設計書の箇所を明記し、実装者が迷いなく作業できるよう配慮しています。

## フェーズ1：基盤構築

### BE-001: Supabaseプロジェクト初期設定
**優先度**: Critical
**見積もり**: 2h
**前提条件**: Supabaseアカウント作成済み

**実装内容**:
- [ ] Supabaseプロジェクト作成
- [ ] 環境変数設定（SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY）
- [ ] PostgreSQL拡張機能有効化（pgcrypto, PostGIS, pg_trgm）
- [ ] Storage バケット作成（avatars, headers, posts, temporary）
- [ ] バケットポリシー設定（publicRead for avatars/headers, authenticated for posts）

**参照ドキュメント**:
- `data-model.md`: データベース拡張機能（冒頭部分）
- `design.md`: 3.2 Supabase設定
- `api-interface.md`: API基本仕様 - 認証・認可

---

### FE-001: React Nativeプロジェクト基盤設定
**優先度**: Critical  
**見積もり**: 3h
**前提条件**: Node.js 18+, Xcode/Android Studio

**実装内容**:
- [ ] TypeScript設定（tsconfig.json）- strict mode有効化
- [ ] ESLint設定（.eslintrc.js）- airbnb-typescript適用
- [ ] Prettier設定（.prettierrc）
- [ ] フォルダ構造作成:
  ```
  src/
  ├── components/
  ├── screens/
  ├── navigation/
  ├── services/
  ├── store/
  ├── hooks/
  ├── utils/
  ├── types/
  └── assets/
  ```
- [ ] 絶対パス設定（babel-plugin-module-resolver）

**参照ドキュメント**:
- `design.md`: 4.1 フォルダ構造
- `requirements.md`: 技術要件

---

## フェーズ2：データベース構築

### BE-002: テーブル作成マイグレーション
**優先度**: Critical
**見積もり**: 5h
**前提条件**: BE-001完了

**実装内容**:
- [ ] profiles テーブル作成（auth.usersへのFK、username UNIQUE制約）
- [ ] posts テーブル作成:
  - status ENUM、visibility ENUM、map_visibility ENUM
  - **favorite_count INTEGER NOT NULL DEFAULT 0** 追加
  - **repost_count INTEGER NOT NULL DEFAULT 0** 追加
- [ ] media_files テーブル作成（ON DELETE CASCADE、status ENUM）
- [ ] pins テーブル作成（location GEOGRAPHY型、is_google_place判定、posts_count列）
- [ ] follows テーブル作成（複合主キー: follower_id + following_id）
- [ ] friends テーブル作成（双方向レコード、status ENUM）
- [ ] favorites/reposts/pinnings テーブル作成
- [ ] tags/post_tags テーブル作成（多対多リレーション）
- [ ] **blocks テーブル作成（blocker_id, blocked_id, ON DELETE CASCADE）**
- [ ] **pin_attributes テーブル作成（TTLキャッシュ用、cached_until列）**
- [ ] **post_geo_events テーブル作成（位置情報生データ保持、captured_at列）**
- [ ] インデックス作成:
  - posts: (user_id, status, published_at DESC)
  - posts: display_point GIST INDEX
  - **posts: idx_posts_status_visibility (status, visibility) WHERE deleted_at IS NULL**
  - media_files: (post_id, display_order)
  - follows: (follower_id), (following_id)
  - **blocks: idx_blocks_blocker (blocker_id), idx_blocks_blocked (blocked_id)**
  - **pin_attributes: idx_pin_attr_expiry (cached_until)**
  - **post_geo_events: idx_post_geo_expire (captured_at)**

**参照ドキュメント**:
- `data-model.md`: 主要エンティティ（全テーブル定義）
- `state-and-policies.md`: 4. 実装チェックリスト - データ保持実装
- `migrations.sql`: CREATE TABLE文の具体例

---

### BE-003: RLSポリシー・権限設定実装
**優先度**: Critical
**見積もり**: 7h
**前提条件**: BE-002完了

**実装内容**:
- [ ] **public_profiles ビュー作成（pending_deletionを除外、anonymousアクセス用）**
- [ ] profiles RLSポリシー:
  - SELECT: status別可視性制御（suspended→オーナーのみ、pending_deletion→404）
  - UPDATE: 本人のみ（auth.uid() = id）
  - DELETE: 禁止（アプリケーション層で制御）
- [ ] posts RLSポリシー:
  - SELECT: visibility + status + owner.status 複合判定
  - INSERT: auth.uid() = user_id AND owner.status = 'active'
  - UPDATE: 本人のみ + owner.status チェック
  - DELETE: 本人のみ（論理削除）
- [ ] media_files RLSポリシー:
  - 親投稿のRLSを継承 + visibility制御
  - visibility優先度: private > friends > public > inherit
- [ ] follows/friends RLSポリシー:
  - 相互関係の整合性チェック
  - pending_deletion/suspendedユーザーへの制限
- [ ] **favorites/reposts/pinnings/post_tags RLSポリシー:
  - INSERT/DELETE: 本人のみ
  - SELECT: 親投稿の可視性に従う**
- [ ] **blocks RLSポリシー:
  - INSERT/DELETE: blocker_id = auth.uid()
  - SELECT: blocker_id = auth.uid()**
- [ ] **GRANT設定:
  - anon: SELECT ON posts, media_files, pins, public_profiles
  - authenticated: SELECT/INSERT/UPDATE/DELETE ON 適切なテーブル
  - サービスロール: 管理APIのみで使用**

**参照ドキュメント**:
- `state-and-policies.md`: 3.5 実装パターン（RLSポリシー例）、2. 権限設計
- `data-model.md`: RLSポリシー実装、可視範囲と権限制御
- `design.md`: 管理者権限とRLS

---

### BE-004: データベーストリガー実装
**優先度**: High
**見積もり**: 5h
**前提条件**: BE-002完了

**実装内容**:
- [ ] display_point自動計算トリガー:
  ```sql
  -- map_visibility変更時にdisplay_point更新
  -- none → NULL
  -- approx_100m → ST_SnapToGrid(base_point, 0.001)
  -- exact → base_point
  ```
- [ ] **posts_published_at_setter トリガー:
  - draft → published 遷移時に published_at 設定
  - draft → temporary 遷移時に published_at 設定
  - archived では published_at を更新しない（タイムライン並び順を保持）**
- [ ] **favorite_count_update トリガー:
  - favorites INSERT/DELETE時に posts.favorite_count を±1**
- [ ] **repost_count_update トリガー:
  - reposts INSERT/DELETE時に posts.repost_count を±1**
- [ ] posts_countキャッシュ更新トリガー（pins.posts_count）
- [ ] temporary投稿24時間後アーカイブ（pg_cron設定）
- [ ] 論理削除30日後物理削除バッチ（pg_cron設定）
- [ ] **pin_attributes TTL削除バッチ（cached_until < NOW()）**
- [ ] **post_geo_events 30日後削除バッチ**
- [ ] media_files.visibility制約トリガー（親より広い設定を拒否）
- [ ] friends双方向レコード作成トリガー
- [ ] **is_temporary → status マイグレーション（既存データがある場合）**

**参照ドキュメント**:
- `data-model.md`: トリガー実装必須項目（全9項目）
- `state-and-policies.md`: 2.4 バッチ処理仕様、削除フロー
- `migrations.sql`: トリガー定義の具体例

**トリガー実装テンプレート（単位ごと）**:
1. **display_point_updater**:
   - 対象: posts表 / イベント: INSERT, UPDATE(map_visibility, pin_id)
   - 更新: display_point = CASE map_visibility ... END
   - 擬似SQL: `IF NEW.map_visibility = 'approx_100m' THEN ST_SnapToGrid(...)`

2. **posts_published_at_setter**:
   - 対象: posts表 / イベント: UPDATE(status)
   - 更新: published_at = NOW() IF OLD.status = 'draft' AND NEW.status IN ('published','temporary')
   - 擬似SQL: `IF OLD.status = 'draft' AND NEW.status IN ('published','temporary') THEN NEW.published_at = NOW()`

3. **favorite_count_update**:
   - 対象: favorites表 / イベント: INSERT, DELETE
   - 更新: posts.favorite_count ±= 1
   - 擬似SQL: `UPDATE posts SET favorite_count = favorite_count + 1 WHERE id = NEW.post_id`

4. **friend_request_requires_mutual_follow**:
   - 対象: friends表 / イベント: INSERT
   - 検証: 相互フォロー存在チェック
   - 擬似SQL: `IF NOT EXISTS (mutual_follow_check) THEN RAISE EXCEPTION`

5. **media_visibility_constraint**:
   - 対象: media_files表 / イベント: INSERT, UPDATE(visibility)
   - 検証: parent_post.visibility >= media.visibility
   - 擬似SQL: `IF media.visibility > post.visibility THEN RAISE EXCEPTION`

---

## フェーズ3：認証システム

### BE-005: Supabase Auth設定
**優先度**: Critical
**見積もり**: 3h
**前提条件**: BE-001完了

**実装内容**:
- [ ] マジックリンク認証有効化
- [ ] メールテンプレートカスタマイズ（日本語対応）
- [ ] リダイレクトURL設定（rovrov://auth/callback）
- [ ] JWT有効期限設定（access: 1h, refresh: 30d）
- [ ] auth.users作成時のprofilesレコード自動作成トリガー
- [ ] セッション管理設定

**参照ドキュメント**:
- `api-interface.md`: 1. 認証 (Authentication)
- `design.md`: 5.1 認証フロー

---

### FE-002: 認証画面実装
**優先度**: Critical
**見積もり**: 4h
**前提条件**: FE-001完了

**実装内容**:
- [ ] AuthScreen.tsx作成:
  - メールアドレス入力フォーム
  - バリデーション（RFC5322準拠）
  - マジックリンク送信処理（POST /api/v1/auth/magic-link）
  - 送信後の確認画面
- [ ] ディープリンク設定:
  - iOS: Universal Links設定
  - Android: App Links設定
  - リンクハンドラー実装（POST /api/v1/auth/verify）
- [ ] セッション管理:
  - SecureStore使用したトークン保存
  - 自動リフレッシュ処理
  - ログアウト処理

**参照ドキュメント**:
- `requirements.md`: 要件1（マジックリンク認証）
- `api-interface.md`: 1.1 マジックリンク送信、1.2 マジックリンク確認

---

### FE-003: Zustand認証ストア実装
**優先度**: Critical
**見積もり**: 3h
**前提条件**: FE-002完了

**実装内容**:
- [ ] authStore作成:
  ```typescript
  interface AuthState {
    user: User | null
    session: Session | null
    isLoading: boolean
    signIn: (email: string) => Promise<void>
    signOut: () => Promise<void>
    refreshSession: () => Promise<void>
  }
  ```
- [ ] Supabase Auth Listenerセットアップ
- [ ] 認証状態の永続化（zustand/middleware）
- [ ] 認証ガードHook（useRequireAuth）

**参照ドキュメント**:
- `design.md`: 4.3 状態管理
- `state-and-policies.md`: 1.0 Profiles（アカウント）の状態遷移

---

## フェーズ4：プロファイル管理

### BE-006: プロファイルAPI実装
**優先度**: High
**見積もり**: 4h
**前提条件**: BE-003完了

**実装内容**:
- [ ] GET /api/v1/profiles/{user_id}:
  - 匿名アクセス対応（public_profiles ビュー使用）
  - suspended/pending_deletionの可視性制御
  - カウント集計（followers_count, following_count, posts_count）
- [ ] PATCH /api/v1/profiles/{user_id}:
  - 本人チェック（auth.uid() = user_id）
  - username重複チェック
  - 画像URL検証
- [ ] プロファイル画像処理:
  - Storage Image Transformations設定
  - サムネイル自動生成（150x150, 300x300）

**参照ドキュメント**:
- `api-interface.md`: 2. プロファイル (Profiles)
- `data-model.md`: 1. profiles（プロファイル）
- `design.md`: public_profiles の使い分け

---

### FE-004: プロファイル編集画面実装
**優先度**: High
**見積もり**: 5h
**前提条件**: FE-003完了

**実装内容**:
- [ ] ProfileEditScreen.tsx:
  - フォーム実装（react-hook-form使用）
  - 画像選択（expo-image-picker）
  - リアルタイムバリデーション
  - username一意性チェック（デバウンス付き）
- [ ] 画像アップロード処理:
  - 圧縮処理（expo-image-manipulator）
  - プログレス表示
  - エラーハンドリング
- [ ] 最適化:
  - フォーム入力のデバウンス
  - 画像のlazy loading

**参照ドキュメント**:
- `requirements.md`: 要件1（プロファイル管理）
- `api-interface.md`: 2.2 プロファイル更新

---

## フェーズ5：投稿機能

### BE-007: メディアアップロードAPI実装
**優先度**: Critical
**見積もり**: 5h
**前提条件**: BE-001完了

**実装内容**:
- [ ] POST /api/v1/media/upload-url（画像用）:
  - ファイルサイズ検証（max 10MB）
  - **MIMEスニッフィングと拡張子偽装対策**
  - MIME type検証（image/jpeg, image/png, image/gif）
  - 署名付きURL生成（1時間有効）
  - media_filesレコード作成（status: 'uploading'）
- [ ] POST /api/v1/media/stream/direct-upload（動画用）:
  - Cloudflare Stream API統合
  - tus resumable upload対応
  - **Webhook署名検証（cf-signatureヘッダー）**
  - **イベントID去重（冪等ハンドラ）**
  - **リトライ戦略（指数バックオフ、最大5回）**
  - **失敗時DLQ（Dead Letter Queue）と可視化ダッシュボード**
- [ ] メディア処理パイプライン:
  - EXIF除去処理（サーバー側強制）
  - 画像最適化（AVIF/WebP変換）
  - サムネイル生成

**参照ドキュメント**:
- `api-interface.md`: 4. メディア (Media)
- `design.md`: 6.2 メディア処理

---

### BE-008: 投稿CRUD API実装
**優先度**: Critical
**見積もり**: 6h
**前提条件**: BE-007完了

**実装内容**:
- [ ] POST /api/v1/posts（作成）:
  - **Idempotency-Key処理（ヘッダー必須、同一キーで完全同一レスポンス）**
  - メディア関連付け
  - display_point計算（map_visibility準拠）
  - タグ処理（正規化、重複排除）
  - status遷移検証
- [ ] PATCH /api/v1/posts/{post_id}（更新）:
  - pin_id変更時のdisplay_point再計算
  - map_visibility変更処理
  - 状態遷移ガード
- [ ] DELETE /api/v1/posts/{post_id}（論理削除）:
  - deleted_at設定
  - カスケード処理（media_files）
- [ ] GET /api/v1/posts/{post_id}（取得）:
  - visibility/status複合チェック
  - メディア展開（visibility考慮）
  - favorite_count/repost_count含む

**参照ドキュメント**:
- `api-interface.md`: 3. 投稿 (Posts)
- `state-and-policies.md`: 1.1 Post（投稿）の状態遷移

---

### FE-005: 投稿作成フロー実装
**優先度**: Critical
**見積もり**: 8h
**前提条件**: FE-004完了

**実装内容**:
- [ ] PostCreatorWizard.tsx（ステップ型UI）:
  - Step1: メディア選択・撮影
  - Step2: キャプション・タグ入力
  - Step3: 位置情報設定（Pin選択/GPS取得）
  - Step4: 公開設定（visibility, map_visibility）
- [ ] メディア処理:
  - 画像圧縮（品質80%、最大1920px）
  - EXIF位置情報抽出
  - サムネイル生成・表示
  - アップロード進捗表示
- [ ] 下書き保存:
  - AsyncStorageによるローカル保存
  - 自動保存（30秒ごと）
  - 復元処理

**参照ドキュメント**:
- `requirements.md`: 要件2（投稿作成）
- `design.md`: 5.2 投稿作成フロー

---

### FE-006: 位置情報管理コンポーネント実装
**優先度**: High
**見積もり**: 5h
**前提条件**: FE-005完了

**実装内容**:
- [ ] LocationPicker.tsx:
  - 現在地取得（expo-location）
  - Pin検索・選択UI
  - map_visibility設定UI（3段階スライダー）
  - プライバシー説明表示（100m丸めの意味、Pinは丸めない理由）
- [ ] PinSelector.tsx:
  - 近傍Pin表示（1km以内）
  - Pin新規作成フォーム（POST /api/v1/pins、**Idempotency-Key必須**）
  - Google Places検索統合
- [ ] 位置情報処理:
  - 座標丸め処理（100m精度）
  - display_point プレビュー表示

**参照ドキュメント**:
- `data-model.md`: 位置情報方針
- `requirements.md`: 要件3（地図機能）

---

## フェーズ6：タイムライン機能

### BE-009: タイムラインAPI実装
**優先度**: Critical
**見積もり**: 5h
**前提条件**: BE-008完了

**実装内容**:
- [ ] GET /api/v1/timeline/featured:
  - **アルゴリズム実装**:
    - スコア計算: `score = w1*log(favorite_count+1) + w2*repost_count - decay(published_at)`
    - 時間減衰: 7日以降はスコアを減衰
    - 上限: 100件/ユーザー
  - public投稿のみ（匿名対応）
  - 並び: スコア降順 + published_atセカンダリ
- [ ] GET /api/v1/timeline/follow:
  - フォロー中ユーザーの投稿取得
  - 認証必須
- [ ] GET /api/v1/timeline/friend:
  - 友達の全投稿取得（private含む）
  - 認証必須
- [ ] 共通処理:
  - カーソルページネーション（opaque Base64）
  - ユーザー×日付グルーピング
  - N+1問題対策（JOIN最適化）

**参照ドキュメント**:
- `api-interface.md`: 3.5 タイムライン取得
- `requirements.md`: 要件4（タイムライン）
- `design.md`: タイムラインエンジン

**Featuredアルゴリズム詳細**:
- スコア式の重み: w1=1.0（いいね）、w2=2.0（リポスト）
- 除外: private/friends投稿、suspended/pending_deletionユーザー
- スパム抑制: 同一ユーザーは最大3投稿まで

---

### FE-007: タイムライン画面実装
**優先度**: Critical
**見積もり**: 6h
**前提条件**: FE-006完了

**実装内容**:
- [ ] TimelineScreen.tsx:
  - タブ切り替え（Featured/Follow/Friend）
  - Pull to Refresh
  - 無限スクロール
- [ ] PostCard.tsx:
  - 日付グループヘッダー
  - 横スクロールカルーセル（複数メディア）
  - いいね/リポスト/ブックマークボタン
  - メディア遅延読み込み
- [ ] React Query設定:
  - キャッシュ戦略（staleTime: 5分）
  - オプティミスティック更新
  - バックグラウンド再取得

**参照ドキュメント**:
- `design.md`: 5.3 タイムラインフロー
- `requirements.md`: 要件4（詳細仕様）

---

## フェーズ7：地図機能

### BE-010: 地図検索API実装
**優先度**: High
**見積もり**: 5h
**前提条件**: BE-008完了

**実装内容**:
- [ ] GET /api/v1/posts/nearby:
  - PostGIS ST_DWithin使用
  - display_point基準の検索
  - タグフィルタリング
  - **KNN最適化**: display_point::geometry <-> origin で高速候補抽出
  - ST_Distanceで再計算後、安定ソート（距離優先、id二次キー）
- [ ] GET /api/v1/pins/nearby:
  - 周辺Pin検索
  - 投稿数集計（posts_count）
  - 人気度スコア計算
- [ ] Google Places API統合:
  - プロキシエンドポイント実装
  - APIキー管理
  - レート制限対策
  - 結果キャッシュ（Redis/pin_attributes）

**参照ドキュメント**:
- `api-interface.md`: 3.6 近傍投稿取得、6.2 近隣Pin検索
- `design.md`: 6.3 Google Places API統合、キャッシュ戦略
- `data-model.md`: インデックス設計（display_point GIST索引）

**実装詳細手順**:
- KNN候補抽出: display_point::geometry <-> ST_MakePoint(lng, lat)::geometry
- 距離再計算: ST_Distance(display_point, origin)
- 安定ソート: ORDER BY distance ASC, id DESC
- 上限制約: LIMIT 200（地図表示用）
- キャッシュキー規約: `nearby:{lat}:{lng}:{radius}:{tags}`

---

### BE-010b: 地図投稿取得API（bounds＋clusters）
**優先度**: High
**見積もり**: 4h
**前提条件**: BE-010完了

**実装内容**:
- [ ] GET /api/v1/map/posts実装:
  - bounds パラメータ解析（sw_lat,sw_lng,ne_lat,ne_lng）
  - **手順詳細**:
    1. ST_MakeEnvelope(sw_lng, sw_lat, ne_lng, ne_lat, 4326) で範囲作成
    2. ST_Intersects(display_point, envelope) で候補抽出
    3. KNN（display_point::geometry <-> center::geometry）で上限200件
    4. ST_Distanceで再計算後、正確な距離ソート
  - クラスタ形成（ズーム別グリッド or ST_ClusterWithin）
  - **クラスタID生成**: `zoom:{z}_grid:{x}_{y}` 形式
  - 代表サムネイル選定（最新 OR favorite_count最大）
  - **キャッシュキー**: `bounds:{sw_lat},{sw_lng},{ne_lat},{ne_lng}:zoom:{z}:tags:{tags}`
- [ ] レスポンス構造:
  ```json
  {
    "posts": [...],
    "clusters": [{
      "cluster_id": "zoom:14_grid:12_34",
      "center": {"type": "Point", "coordinates": [...]},
      "bbox": {
        "sw": {"lat": 35.6, "lng": 139.7},
        "ne": {"lat": 35.7, "lng": 139.8}
      },
      "count": 10,
      "representative_thumbnail": "..."
    }],
    "total_count": 200,
    "has_more": false
  }
  ```

**参照ドキュメント**:
- `api-interface.md`: 7.1 地図投稿取得（cluster_id, bbox, has_more）
- `design.md`: 地図UI/クラスタ仕様、キャッシュ戦略
- `data-model.md`: インデックス設計（display_point GIST索引）

**実装詳細手順**:
1. Envelope作成: ST_MakeEnvelope(sw_lng, sw_lat, ne_lng, ne_lat, 4326)
2. KNN抽出: display_point::geometry <-> center ORDER BY <-> LIMIT 200
3. 距離再計算: ST_Distance(display_point::geography, center::geography)
4. クラスタ整形: cluster_id生成、bbox計算、代表thumbnail選定
5. キャッシュキー: `map:bounds:{hash}:zoom:{z}:tags:{tags}`

**制約事項**:
- 上限: posts=200件、clusters=500グリッド
- クラスタID: `zoom:{z}_grid:{x}_{y}` 形式で一意生成
- 代表選定: 時系列（published_at DESC）または人気（favorite_count DESC）

---

### FE-008: 地図画面（Rove）実装
**優先度**: High
**見積もり**: 8h
**前提条件**: FE-007完了

**実装内容**:
- [ ] RoveScreen.tsx:
  - react-native-maps統合
  - 現在地中心表示
  - カスタムマップスタイル適用（Cloud-based Maps Styling）
- [ ] Pinマーカー表示:
  - サーバー側クラスタリング結果の表示
  - カスタムマーカーアイコン
  - 選択時の詳細表示（BottomSheet）
- [ ] フィルタリング:
  - タグ選択UI（チップ型、デフォルト：カフェ）
  - 距離範囲スライダー
  - リアルタイム更新
- [ ] パフォーマンス最適化:
  - ビューポート内のみ読み込み
  - マーカー上限設定（200件）
  - デバウンス処理

**参照ドキュメント**:
- `requirements.md`: 要件3（地図探索）
- `design.md`: 4.2.3 Rove（地図探索）

---

## フェーズ8：ソーシャル機能

### BE-011: ソーシャル機能API実装
**優先度**: High
**見積もり**: 5h
**前提条件**: BE-008完了

**実装内容**:
- [ ] フォロー機能:
  - POST /api/v1/users/{user_id}/follow（**Idempotency-Key必須、204 No Content**）
  - DELETE /api/v1/users/{user_id}/follow（204 No Content）
  - 相互フォローチェック
- [ ] 友達機能:
  - POST /api/v1/friends/request（**Idempotency-Key必須、204 No Content**）
  - POST /api/v1/friends/accept
  - DELETE /api/v1/friends/{friend_id}
  - 双方向レコード管理
- [ ] エンゲージメント（**正しいエンドポイント名、全て204 No Content**）:
  - POST /api/v1/posts/{post_id}/favorite（**Idempotency-Key必須**）
  - DELETE /api/v1/posts/{post_id}/favorite
  - POST /api/v1/posts/{post_id}/repost（**Idempotency-Key必須**）
  - DELETE /api/v1/posts/{post_id}/repost
  - **POST /api/v1/posts/{post_id}/bookmark**（**Idempotency-Key必須**）
  - **DELETE /api/v1/posts/{post_id}/bookmark**
  - **POST /api/v1/pins/{pin_id}/bookmark**（**Idempotency-Key必須**）
  - **DELETE /api/v1/pins/{pin_id}/bookmark**
  - カウンタキャッシュ更新（トリガー経由）
- [ ] ブロック機能:
  - POST /api/v1/blocks（**Idempotency-Key必須、204 No Content**）
  - DELETE /api/v1/blocks/{blocked_id}（204 No Content）

**参照ドキュメント**:
- `api-interface.md`: 5. ソーシャル機能（全エンドポイント仕様）
- `data-model.md`: 4. follows、5. friends、6. favorites、7. reposts、blocks
- `state-and-policies.md`: RLS方針、相互フォロー必須条件

**実装詳細（エンドポイントごと）**:
- **フォロー**: 前提（RLS active チェック）、Idempotency-Key必須、204応答
- **友達申請**: 前提（相互フォロー必須）、Idempotency-Key必須、204応答
- **いいね/リポスト**: カウンタキャッシュ更新トリガー連動、204応答
- **ブックマーク**: 投稿/Pin両対応、Idempotency-Key必須、204応答
- **ブロック**: 双方向制限（RLSポリシー即座適用）、204応答

**ソーシャル機能共通仕様**:
- 全作成系はIdempotency-Key必須（同一キーで完全同一レスポンス）
- 全操作は204 No Contentで統一（冪等性保証）
- RLS前提: profiles.status = 'active' チェック
- エラー時: 409 ALREADY_* 系エラーコード返却

---

### FE-009: ソーシャル機能UI実装
**優先度**: High
**見積もり**: 5h
**前提条件**: FE-008完了

**実装内容**:
- [ ] フォローボタンコンポーネント:
  - 状態管理（following/not following）
  - オプティミスティック更新
  - 相互フォロー時の友達申請促進
- [ ] エンゲージメントボタン:
  - いいねアニメーション
  - リポスト確認ダイアログ
  - ブックマーク管理
- [ ] ソーシャルフィード:
  - フォロワーアクティビティ表示
  - 通知バッジ

**参照ドキュメント**:
- `requirements.md`: 要件6（ソーシャル機能）
- `design.md`: 5.4 ソーシャル操作フロー

---

## フェーズ9：アカウント画面

### FE-010: アカウント詳細画面実装
**優先度**: High
**見積もり**: 6h
**前提条件**: FE-009完了

**実装内容**:
- [ ] AccountScreen.tsx:
  - プロファイルヘッダー
  - タブナビゲーション（Journal/Rove/Pinning/Favorite）
  - Private/Publicモード切り替え
- [ ] 各タブ実装:
  - Journal: 投稿履歴グリッド表示
  - Rove: 個人用地図（訪問場所）
  - Pinning: ブックマーク一覧（GET /api/v1/me/bookmarks?type=post）
  - Favorite: いいねした投稿
- [ ] 統計表示:
  - 投稿数/フォロワー/フォロー中
  - グラフ表示（月別投稿数）

**参照ドキュメント**:
- `requirements.md`: 要件5（アカウント画面）
- `design.md`: 4.2.4 Account（アカウント詳細）

---

## フェーズ10：モデレーション機能

### BE-012: モデレーション・アカウント管理API実装
**優先度**: Medium
**見積もり**: 5h
**前提条件**: BE-011完了

**実装内容**:
- [ ] アカウント状態管理（**正しいエンドポイント名**）:
  - **POST /api/v1/admin/users/{user_id}/suspend**
  - **POST /api/v1/admin/users/{user_id}/reinstate**
  - 自動解除スケジューラー（suspended_until）
  - **書き込み禁止トリガー（profiles.status != 'active'）**
- [ ] 退会処理（**正しいエンドポイント名**）:
  - **POST /api/v1/account/request-deletion（Idempotency-Key必須）**
  - **POST /api/v1/account/cancel-deletion**
  - 30日後の物理削除バッチ
  - deleted_at をタイマー起点として記録
- [ ] **POST /api/v1/admin/purge-expired-deletions実装**:
  - 期限切れアカウントの物理削除
  - Storage/Stream含む完全削除
- [ ] コンテンツモデレーション:
  - 投稿の非表示化
  - 不適切コンテンツ検出（Cloud Vision API）
- [ ] 監査ログ:
  - 管理操作の記録（操作主体・対象・旧新値・時刻）

**参照ドキュメント**:
- `state-and-policies.md`: 1.0 Profiles（アカウント）の状態遷移、2.3 退会・モデレーション処理フロー
- `api-interface.md`: 8. アカウント (Account)、9. 管理者機能 (Admin)
- `requirements.md`: 要件9（モデレーション）

**モデレーション詳細仕様**:
- 状態遷移→DB副作用: status変更 + suspended_until/deleted_at設定
- 外部削除: DB→Storage→Streamの順序で実行
- 監査ログ: 操作主体・対象・旧新値・時刻を記録

---

### FE-011: モデレーション関連UI実装
**優先度**: Medium
**見積もり**: 3h
**前提条件**: FE-010完了

**実装内容**:
- [ ] 停止状態表示:
  - ModerationBanner.tsx（警告バナー）
  - 機能制限の明示
  - 解除予定日表示（suspended_until）
- [ ] 退会フロー:
  - 確認ダイアログ（3段階確認）
  - 30日間の説明
  - **復帰導線（[復帰する]ボタン → /account/cancel-deletion）**
- [ ] 管理者画面（オプション）:
  - ユーザー一覧・検索
  - 停止/解除操作
  - モデレーションログ表示

**参照ドキュメント**:
- `requirements.md`: 要件9（詳細仕様）
- `state-and-policies.md`: 2. 権限設計（権限マトリクス）

---

## フェーズ11：パフォーマンス最適化

### BE-013: キャッシュ層実装
**優先度**: Medium
**見積もり**: 5h
**前提条件**: BE-012完了

**実装内容**:
- [ ] Redis/Upstash設定:
  - 接続プール設定
  - TTL戦略定義
- [ ] キャッシュ実装:
  - タイムラインキャッシュ（5分、キー: userId:feed:cursor）
  - ユーザープロファイルキャッシュ（10分）
  - Pinデータキャッシュ（1時間、pin_attributes利用）
  - Google Placesキャッシュ（24時間）
  - 地図データキャッシュ（キー: bounds:zoom:tags）
- [ ] キャッシュ無効化:
  - 更新時の自動無効化
  - タグベース無効化
- [ ] スマートCDN設定:
  - メディア配信最適化
  - Cache-Control設定

**参照ドキュメント**:
- `design.md`: 7.1 キャッシュ戦略、キャッシュの保持期間と再取得戦略
- `requirements.md`: 要件8（パフォーマンス）

---

### FE-012: クライアント最適化実装
**優先度**: Medium
**見積もり**: 4h
**前提条件**: FE-011完了

**実装内容**:
- [ ] React Query最適化:
  - Query Key設計（共通ユーティリティ化）
  - staleTime/cacheTime調整
  - プリフェッチ戦略
- [ ] 画像最適化:
  - Progressive loading
  - Blurhash プレースホルダー
  - 適応的品質調整
  - AVIF/WebP自動選択
- [ ] コード分割:
  - React.lazy使用
  - 画面単位の分割
  - 条件付きインポート

**参照ドキュメント**:
- `design.md`: 7.2 フロントエンド最適化
- `requirements.md`: 要件8（レスポンス目標）

---

### BE-017: レート制限・冪等性実装
**優先度**: High
**見積もり**: 3h
**前提条件**: BE-008完了

**実装内容**:
- [ ] レート制限ミドルウェア:
  - 認証系: 5回/分（Per-User）、10回/分（Per-IP）
  - 読み取り系: 100回/分（Per-User）、200回/分（Per-IP）
  - 書き込み系: 30回/分（Per-User）、50回/分（Per-IP）
  - メディアアップロード: 10回/分（Per-User）、20回/分（Per-IP）
  - 管理系API: 10回/分（Per-User）
  - X-RateLimit-* ヘッダー返却
- [ ] Idempotency-Key処理:
  - 全作成系API（posts、pins、bookmarks、follow、friend request等）で必須化
  - ストレージはアップロード完了後のPOST/commitに適用
  - キー保存期間: 24時間

**参照ドキュメント**:
- `api-interface.md`: レート制限（表）、共通ヘッダー（Idempotency-Key）

---

### BE-018: 冪等性キー拡張実装
**優先度**: Medium
**見積もり**: 2h
**前提条件**: BE-017完了

**実装内容**:
- [ ] 冪等性キー適用範囲拡張:
  - 全ての作成系エンドポイントへの適用確認
  - POST /api/v1/posts, /api/v1/pins, /api/v1/posts/{id}/bookmark
  - POST /api/v1/users/{id}/follow, /api/v1/users/{id}/friend-request
  - POST /api/v1/posts/{id}/favorite, /api/v1/posts/{id}/repost
- [ ] 冪等性キー管理:
  - Redis/Upstashによるキー管理実装
  - TTL: 24時間設定
  - 同一キーでのリクエスト時は前回のレスポンスを返却
- [ ] エラーハンドリング:
  - 409 Conflict: 処理中の場合
  - 200/201: 完了済みの場合（前回のレスポンス返却）

**参照ドキュメント**:
- `api-interface.md`: 共通ヘッダー仕様（Idempotency-Key）
- `design.md`: 冪等性保証

---

## フェーズ12：エラーハンドリング

### BE-014: エラー処理実装
**優先度**: High
**見積もり**: 3h
**前提条件**: 基本API実装完了

**実装内容**:
- [ ] 標準エラーレスポンス実装:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Validation failed",
      "details": {...}
    }
  }
  ```
- [ ] エラーコード体系:
  - 4xx系: クライアントエラー
  - 5xx系: サーバーエラー
  - カスタムコード定義（ACCOUNT_NOT_ACTIVE_FOR_WRITE等）
- [ ] エラー文言規約:
  - 各エラーコードにUX向け短文（日本語）を紐付け
- [ ] ロギング:
  - エラーログ記録
  - Sentry統合
  - X-Request-ID連携（Gateway→Edge Functions→DB）
  - アラート設定

**参照ドキュメント**:
- `api-interface.md`: 8. エラー設計
- `design.md`: 6.4 エラーハンドリング

---

### FE-013: エラーハンドリングUI実装
**優先度**: High
**見積もり**: 3h
**前提条件**: FE-012完了

**実装内容**:
- [ ] グローバルエラーハンドラー:
  - ErrorBoundary実装
  - ネットワークエラー検出
  - 自動リトライ機能
- [ ] エラー表示UI:
  - トースト通知
  - エラー画面
  - リトライボタン
  - エラー文言の日本語表示
- [ ] オフライン対応:
  - NetInfo統合
  - オフラインモード表示
  - 投稿キュー管理（失敗時の自動再試行）

**参照ドキュメント**:
- `requirements.md`: 要件8（オフライン対応）
- `design.md`: 4.4 エラーUI

---

## フェーズ13：テスト実装

### BE-015: バックエンドテスト作成
**優先度**: Medium
**見積もり**: 8h
**前提条件**: 全API実装完了

**実装内容**:
- [ ] 単体テスト:
  - RLSポリシーテスト（全状態×全操作の組み合わせ）
  - トリガーテスト
  - ビジネスロジックテスト
- [ ] 統合テスト:
  - API エンドポイントテスト
  - 認証フローテスト
  - 状態遷移テスト
- [ ] 負荷テスト:
  - k6スクリプト作成
  - ボトルネック特定
- [ ] セキュリティテスト:
  - 書き込み禁止ガード（suspended/pending_deletion）
  - 管理者権限検証

**参照ドキュメント**:
- `state-and-policies.md`: 全状態遷移テストケース
- `api-interface.md`: APIテストシナリオ

---

### FE-014: フロントエンドテスト作成
**優先度**: Medium
**見積もり**: 6h
**前提条件**: 全画面実装完了

**実装内容**:
- [ ] コンポーネントテスト:
  - React Native Testing Library
  - スナップショットテスト
  - インタラクションテスト
- [ ] 統合テスト:
  - 認証フロー
  - 投稿作成フロー
  - タイムライン表示
- [ ] E2Eテスト（Detox）:
  - Critical Path テスト
  - デバイス別テスト
- [ ] Seed/Fixture作成:
  - 開発用最小シードデータ

**参照ドキュメント**:
- `requirements.md`: 受け入れ基準（各要件）
- `design.md`: 8. テスト戦略

---

## フェーズ14：デプロイ準備

### BE-016: インフラ設定
**優先度**: Low
**見積もり**: 4h
**前提条件**: テスト完了

**実装内容**:
- [ ] 環境分離:
  - development/staging/production
  - 環境別設定ファイル
  - シークレット管理
  - キーローテーション手順（Places/Stream/SendGrid/Supabase）
- [ ] CI/CD:
  - GitHub Actions設定
  - 自動テスト実行
  - マイグレーション順序検証
  - デプロイパイプライン
- [ ] モニタリング:
  - ヘルスチェックエンドポイント
  - メトリクス収集（SLO/SLI定義）
  - アラート設定
  - DB/cron/Stream webhook死活監視
- [ ] バックアップ:
  - DBスナップショット
  - Storage バケット
  - Stream アセット
  - 復旧Runbook作成

**参照ドキュメント**:
- `design.md`: 9. デプロイ戦略
- `requirements.md`: 非機能要件

---

### FE-015: ビルド設定
**優先度**: Low
**見積もり**: 4h
**前提条件**: テスト完了

**実装内容**:
- [ ] EAS Build設定:
  - eas.json設定
  - 証明書管理
  - ビルドプロファイル
- [ ] アプリ設定:
  - app.json更新
  - アイコン・スプラッシュ画面
  - パーミッション設定
  - 最小タップ領域設定
- [ ] リリース準備:
  - App Store Connect設定
  - Google Play Console設定
  - メタデータ準備

**参照ドキュメント**:
- `requirements.md`: リリース要件
- `design.md`: 9.2 ビルド設定

---

## 実装順序と依存関係

### 優先度1（Critical - 必須基盤）
1. BE-001 → BE-002 → BE-003 → BE-004（データベース基盤）
2. FE-001（プロジェクト基盤）
3. BE-005 → FE-002 → FE-003（認証システム）

### 優先度2（Core Features - コア機能）
4. BE-007 → BE-008 → BE-017 → BE-018（投稿バックエンド＋レート制限＋冪等性）
5. BE-006 → FE-004（プロファイル）
6. FE-005 → FE-006（投稿フロントエンド）
7. BE-009 → FE-007（タイムライン）

### 優先度3（Extended Features - 拡張機能）
8. BE-010 → BE-010b → FE-008（地図機能）
9. BE-011 → FE-009（ソーシャル機能）
10. FE-010（アカウント画面）

### 優先度4（Polish - 品質向上）
11. BE-012 → FE-011（モデレーション）
12. BE-013 → FE-012（パフォーマンス）
13. BE-014 → FE-013（エラーハンドリング）

### 優先度5（Release - リリース準備）
14. BE-015 → FE-014（テスト）
15. BE-016 → FE-015（デプロイ）

---

## 全体チェックリスト（実装完了確認）

### セキュリティチェック
- [ ] **サービスロール分離**: 管理APIはService Roleで実行、通常APIはRLS経由（`design.md`: 管理者権限とRLS）
- [ ] **管理者クレーム検証**: auth.jwt()->>'role' = 'admin'のみで権限上げしない（DBロールとAPI Gatewayの二重チェック）
- [ ] **書き込み禁止ガード**: profiles.status IN ('suspended','pending_deletion')のWRITE拒否トリガー（`state-and-policies.md`: モデレーション方針）
- [ ] **アップロード検証**: MIMEスニッフィング、拡張子偽装防止、最大サイズ、画像解凍爆弾対策
- [ ] **EXIF除去強制**: サーバー側でメタ自動除去（`design.md`: 画像処理戦略）
- [ ] **Cloudflare Streamトークン署名**: 視聴トークンのTTLとスコープ最小化（再生ドメイン固定）
- [ ] **Idempotency-Keyの適用拡大**: 全作成系APIで必須化（`api-interface.md`: 共通ヘッダー）
- [ ] **レート制限実装**: X-RateLimit-*ヘッダー、エンドポイント種別ごとの閾値（`api-interface.md`: レート制限）
- [ ] **入力バリデーション**: caption/tags/usernameの長さ・文字種・絵文字対応・XSS対策
- [ ] **CORS方針**: PWA併用時の許可オリジンホワイトリスト化
- [ ] **監査ログ**: 管理操作と可視性変更の監査テーブル（操作主体・対象・旧新値・時刻）
- [ ] **削除ワークフローの原子性**: 30日満了時のDB削除→Storage/Stream削除のフォールトトレランス
- [ ] **匿名アクセスの最小権限**: GRANTの最小化と漏れ（UPDATE/DELETE）無しの確認
- [ ] 全APIにレート制限実装
- [ ] RLSポリシー網羅的テスト
- [ ] 入力値サニタイゼーション
- [ ] XSS/SQLインジェクション対策
- [ ] 認証トークンの安全な保存
- [ ] **Webhookシグネチャ検証**: Cloudflare Stream/Supabase Storageからのコールバック署名検証
- [ ] **PWAトークン保護**: Service Worker内でのトークン保管とRefresh Token Rotation
- [ ] **Magic Linkリダイレクト許可リスト**: リダイレクトURLのドメインホワイトリスト検証
- [ ] **PII除外ログ**: ログからメールアドレス・IPアドレス・位置情報を除外またはハッシュ化
- [ ] **Storageバケット権限**: publicとprivateバケットの分離、署名URL有効期限の最小化

### パフォーマンスチェック
- [ ] **近傍検索最適化**: display_pointにGIST索引＋ST_DWithin固定、ソートはKNN（<->）（`data-model.md`: インデックス）
- [ ] **地図クラスタ**: ズームレベル別結果上限（200点）、クラスタ中心は重心or代表点（`design.md`: クラスタリング）
- [ ] **索引充実**: idx_posts_status_visibility、friends/followsの両方向索引、favorites/repostsの複合索引
- [ ] **ページネーション統一**: カーソルのopaque Base64共通化、ソートキー固定（`api-interface.md`: ページネーション）
- [ ] **キャッシュ鍵設計**: Timeline/Map/Placesのキー規約固定（`design.md`: キャッシュ戦略）
- [ ] **メディア配信**: Image Transformationsの形式自動選択とCache-Control（`design.md`: メディア処理）
- [ ] **バッチ運用**: pg_cronジョブの実行時間上限/ログ出力/リトライ設計
- [ ] N+1問題の解消
- [ ] 適切なインデックス設定
- [ ] 画像最適化（WebP/AVIF）
- [ ] キャッシュ戦略実装
- [ ] バンドルサイズ最適化
- [ ] **KNNインデックス前提条件**: btree_gist拡張有効化、GIST索引作成順序の文書化
- [ ] **カーソル安定性**: 同一条件での結果順序一貫性（ORDER BY id追加）
- [ ] **CDNキャッシュパージ**: 投稿削除/visibility変更時のメディアキャッシュ無効化API

### ユーザビリティチェック
- [ ] **エラー文言規約**: エラーコードにUX向け短文（日本語）紐付け（`api-interface.md`: エラー設計）
- [ ] **ローディング/スケルトン**: タイムライン・地図・プロフィールのプレースホルダ統一
- [ ] **位置情報の透明性**: map_visibilityの説明ツールチップ（`data-model.md`: 位置情報方針）
- [ ] **オフラインUX**: 投稿作成の下書きローカル保存と再送キュー（`requirements.md`: 要件8）
- [ ] **復帰導線**: pending_deletionのユーザーバナーに[復帰する]ボタン（`api-interface.md`: cancel-deletion）
- [ ] **アクセシビリティ**: 最小タップ領域・色コントラスト・動画の字幕/ミュート初期値
- [ ] **報告機能（Report）**: MVP後付けで可（`design.md`: 将来拡張に記載）
- [ ] オフライン時の適切な表示
- [ ] ローディング状態の明示
- [ ] エラーメッセージの分かりやすさ
- [ ] アクセシビリティ対応
- [ ] 多言語対応準備
- [ ] **エラーコード辞書**: 開発者向けトラブルシューティングガイドの作成
- [ ] **オフライン送信キュー**: 投稿の失敗時自動リトライとコンフリクト解決UI
- [ ] **プライバシー設定の初回説明**: 位置情報公開範囲の選択時チュートリアル

### 運用チェック
- [ ] **SLO/SLI定義**: 主要API（Auth/投稿/タイムライン/地図）のp95レイテンシ/エラー率（`design.md`: SLO）
- [ ] **監視とアラート**: Sentry＋DB/cron/Stream webhookの死活監視（`design.md`: モニタリング）
- [ ] **バックアップ/リストア手順**: DBスナップショット、Storageバケット、Stream復旧Runbook
- [ ] **機密情報管理**: キーローテーション手順（Places/Stream/SendGrid/Supabase）
- [ ] **マイグレーション順序の固定**: CIで順序検査（`tasks-detailed.md`: CI/CD）
- [ ] **Seed/Fixture**: E2E/開発用最小シード（`tasks-detailed.md`: FE-014）
- [ ] **Request-ID連携**: X-Request-IDの受け渡し/ログ相関（`api-interface.md`: 共通ヘッダー）
- [ ] **データエクスポート**: 退会前エクスポート（CSV/JSON）を将来機能として（`design.md`: 将来拡張）
- [ ] ログ出力の適切性
- [ ] 監視項目の設定
- [ ] バックアップ戦略
- [ ] 災害復旧手順
- [ ] ドキュメント整備
- [ ] **構造化ログ**: JSON形式、trace_id/span_id付与、ログレベル適正化
- [ ] **キーローテーション運用**: 四半期ごとの定期ローテーション手順書作成
- [ ] **機能フラグ運用**: LaunchDarkly/Flipt等による段階的ロールアウト準備
- [ ] **インシデント対応Runbook**: 主要障害パターンの対応手順文書化
- [ ] **コスト監視**: Supabase/Cloudflare/Google Maps APIの利用量アラート設定

---

## 備考

- 各タスクの見積もりは標準的な開発者を想定
- 並行作業可能なタスクは依存関係を考慮して実施
- 設計書の更新があった場合は該当タスクも更新必要
- テストは各フェーズ完了後に随時実施を推奨

---

## 追加要件テンプレート

新規要件が追加された場合は、以下のテンプレートを使用してタスクを追加：

```markdown
### BE-0XX / FE-0XX: [タスク名]
**優先度**: Critical/High/Medium/Low
**見積もり**: Xh
**前提条件**: [依存するタスク]

**実装内容**:
- [ ] [実装項目1]:
  - 詳細仕様
  - 技術的考慮事項
- [ ] [実装項目2]:
  - 詳細仕様
  - 技術的考慮事項

**参照ドキュメント**:
- `[ドキュメント名]`: [参照セクション]

**チェックポイント**:
- [ ] セキュリティ: [確認項目]
- [ ] パフォーマンス: [確認項目]
- [ ] ユーザビリティ: [確認項目]
```

### タスク追加時の注意事項

1. **タスク番号**: 既存タスクの連番で採番
2. **依存関係**: 前提条件を明確に記載
3. **参照ドキュメント**: 設計書の該当箇所を必ず記載
4. **チェックポイント**: セキュリティ・パフォーマンス・ユーザビリティの観点で確認項目を追加
5. **見積もり**: 実装・テスト・レビューを含めた時間

### よくある追加タスクパターン

- **新規API追加**: BE-0XX（バックエンド）+ FE-0XX（フロントエンド）のセット
- **データベース変更**: BE-001〜004の該当タスクに追記 + マイグレーション順序の考慮
- **UI/UX改善**: FE-0XX単独、または既存FEタスクへの追記
- **セキュリティ強化**: BE-0XX（バックエンド）+ 全体チェックリストへの追加
- **パフォーマンス改善**: BE-013/FE-012への追記、または新規タスク
- **太字**部分は今回のレビューで追加・修正された項目