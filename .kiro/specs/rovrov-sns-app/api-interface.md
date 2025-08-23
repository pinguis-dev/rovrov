# インターフェース定義書（API契約）＋ エラー設計

## 概要

RovRov SNSアプリケーションのRESTful API仕様書です。本文書は、フロントエンドとバックエンド間の契約として、エンドポイント、ペイロード、バリデーション、エラー設計を定義します。

## API基本仕様

### バージョニング
- **バージョン形式**: `/api/v1/{resource}`
- **バージョン戦略**: URLパス方式（Major Version in URL）
- **後方互換性**: マイナーバージョンアップでは破壊的変更なし

### 認証・認可
```
Authorization: Bearer {access_token}
```
- **認証方式**: Supabase Auth JWT
- **トークン形式**: Bearer Token
- **有効期限**: 1時間（リフレッシュトークンで自動更新）
- **認可**: Row Level Security (RLS) + アプリケーション層チェック
- **匿名アクセス**: 一部の読み取り系エンドポイント（public投稿、publicプロファイル、地図表示）は認証なしでアクセス可能
  - トークン未付与時は `anon` ロールとして扱い、publicコンテンツのみ閲覧可能

### 共通ヘッダー

#### リクエストヘッダー
| ヘッダー名 | 必須 | 説明 |
|-----------|------|------|
| Authorization | △ | Bearer {access_token}（匿名許可エンドポイント以外は必須） |
| Content-Type | ○ | application/json |
| X-Client-Version | - | クライアントアプリバージョン |
| X-Request-ID | - | リクエスト追跡用UUID |
| Idempotency-Key | △ | 作成系APIで必須（同一キーで完全に同一の応答を返す冪等性保証） |

#### レスポンスヘッダー
| ヘッダー名 | 説明 |
|-----------|------|
| X-Request-ID | リクエスト追跡用UUID |
| X-RateLimit-Limit | レート制限上限 |
| X-RateLimit-Remaining | 残りリクエスト数 |
| X-RateLimit-Reset | リセット時刻（Unix timestamp） |

### ページネーション

#### カーソルベース（推奨）
```json
{
  "cursor": "eyJpZCI6IjEyMzQ1Njc4OTAifQ==",
  "limit": 20
}
```
- **カーソル形式**: Opaque Base64エンコード文字列
- **ソートキー**: エンドポイントごとに固定（タイムライン: published_at DESC、その他: created_at DESC）

#### レスポンス形式
```json
{
  "data": [...],
  "pagination": {
    "has_more": true,
    "next_cursor": "eyJpZCI6IjIzNDU2Nzg5MDEifQ==",
    "total_count": 150
  }
}
```

### フィルタリング・ソート

#### フィルタリング
```
GET /api/v1/posts?visibility=public&status=published
```

#### ソート
```
GET /api/v1/posts?sort=-created_at,caption
```
- `-` プレフィックス: 降順
- デフォルト: 昇順

### レート制限
| エンドポイント種別 | Per-User制限 | Per-IP制限 | 期間 | 単位 |
|------------------|-------------|-----------|------|------|
| 認証系 | 5回 | 10回 | 1分 | 分 |
| 読み取り系 | 100回 | 200回 | 1分 | 分 |
| 書き込み系 | 30回 | 50回 | 1分 | 分 |
| メディアアップロード | 10回 | 20回 | 1分 | 分 |
| 管理系API | 10回 | - | 1分 | 分 |

- Per-UserとPer-IPの両方が適用され、いずれかに達した時点で制限
- X-RateLimit-* ヘッダーの単位は「分」

## エンドポイント仕様

### 1. 認証 (Authentication)

#### 1.1 マジックリンク送信
```http
POST /api/v1/auth/magic-link
```

**リクエスト**
```json
{
  "email": "user@example.com"
}
```

**バリデーション**
| フィールド | 型 | 必須 | 制約 |
|-----------|-----|------|------|
| email | string | ○ | RFC5322準拠、最大255文字 |

**レスポンス** (200 OK)
```json
{
  "message": "Magic link sent to your email"
}
```

#### 1.2 マジックリンク確認
```http
POST /api/v1/auth/verify
```

**リクエスト**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "magiclink"
}
```

**レスポンス** (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

### 2. プロファイル (Profiles)

#### 2.1 プロファイル取得
```http
GET /api/v1/profiles/{user_id}
```

**認証**: 任意（匿名アクセス時はpublic情報のみ）

**レスポンス** (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "username": "johndoe",
  "display_name": "John Doe",
  "bio": "Hello world",
  "avatar_url": "https://storage.rovrov.app/avatars/...",
  "header_url": "https://storage.rovrov.app/headers/...",
  "status": "active",  // 本人のみ表示、pending_deletionは第三者に404
  "followers_count": 150,  // サーバ側で集計して返す（非永続列）
  "following_count": 100,  // サーバ側で集計して返す（非永続列）
  "posts_count": 42,       // サーバ側で集計して返す（非永続列）
  "is_following": false,
  "is_friend": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### 2.2 プロファイル更新
```http
PATCH /api/v1/profiles/{user_id}
```

**リクエスト**
```json
{
  "display_name": "John Doe",
  "bio": "Updated bio",
  "avatar_url": "https://storage.rovrov.app/avatars/new.jpg"
}
```

**バリデーション**
| フィールド | 型 | 必須 | 制約 |
|-----------|-----|------|------|
| display_name | string | - | 最大100文字 |
| bio | string | - | 最大500文字 |
| avatar_url | string | - | 有効なURL、最大2083文字 |
| header_url | string | - | 有効なURL、最大2083文字 |

### 3. 投稿 (Posts)

#### 3.1 投稿作成
```http
POST /api/v1/posts
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```
**Idempotency-Key必須**: 同一キーでは完全同一応答

**リクエスト**
```json
{
  "caption": "Beautiful sunset at the beach",
  "status": "published",
  "visibility": "public",
  "map_visibility": "approx_100m",
  "pin_id": "789e0123-e89b-12d3-a456-426614174000",
  "media_ids": ["789e0123-e89b-12d3-a456-426614174000"],  // アップロード済みメディアID
  "tags": ["sunset", "beach"]
}
```

**バリデーション**
| フィールド | 型 | 必須 | 制約 |
|-----------|-----|------|------|
| caption | string | - | 最大2000文字 |
| status | enum | ○ | draft\|temporary\|published |
| visibility | enum | ○ | public\|friends\|private |
| map_visibility | enum | ○ | none\|approx_100m\|exact |
| pin_id | uuid | - | 有効なPin ID |
| media_ids | array | △ | 最大10個、アップロード済みメディアのUUID配列 |
| tags | array | - | 最大30個、各タグ最大64文字 |

**レスポンス** (201 Created)
```json
{
  "id": "456e7890-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "caption": "Beautiful sunset at the beach",
  "status": "published",
  "visibility": "public",
  "map_visibility": "approx_100m",
  "display_point": {
    "type": "Point",
    "coordinates": [139.7, 35.6]
  },
  "pin": {
    "id": "789e0123-e89b-12d3-a456-426614174000",
    "name": "Shonan Beach"
  },
  "media": [...],
  "tags": ["sunset", "beach"],
  "favorite_count": 0,
  "repost_count": 0,
  "created_at": "2024-01-01T12:00:00Z",
  "published_at": "2024-01-01T12:00:00Z"
}
```

#### 3.2 投稿取得
```http
GET /api/v1/posts/{post_id}
```

**認証**: 任意（RLSに従う、匿名時はpublic投稿のみ）

#### 3.3 投稿更新
```http
PATCH /api/v1/posts/{post_id}
```

**リクエスト**
```json
{
  "caption": "Updated caption",
  "pin_id": null,
  "map_visibility": "none"
}
```

#### 3.4 投稿削除
```http
DELETE /api/v1/posts/{post_id}
```

**レスポンス** (204 No Content)

#### 3.5 タイムライン取得
```http
GET /api/v1/timeline/{type}?cursor={cursor}&limit=20
```

**パスパラメータ**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| type | string | ○ | featured\|follow\|friend |

**クエリパラメータ**
| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|------------|------|
| cursor | string | - | - | ページネーションカーソル |
| limit | integer | - | 20 | 取得件数（1-100） |

**認証**: 任意（匿名時はfeaturedのpublicのみ）

#### 3.6 近傍投稿取得
```http
GET /api/v1/posts/nearby?lat={lat}&lng={lng}&radius={radius}
```

**クエリパラメータ**
| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|------------|------|
| lat | float | ○ | - | 緯度（-90～90） |
| lng | float | ○ | - | 経度（-180～180） |
| radius | integer | - | 1000 | 検索半径（メートル、最大5000） |
| limit | integer | - | 20 | 取得件数（1-100） |

**認証**: 任意（匿名時はpublic投稿のみ、RLSで制御）

**ソート順**: `ST_Distance(display_point, origin) ASC, id DESC`（距離順、同距離はID降順）

**内部実装**: KNN（display_point::geometry <-> origin）で候補抽出→ST_Distance再計算→安定ソート（同距離はid二次キー）

### 4. メディア (Media)

#### 4.1 画像アップロードURL取得
```http
POST /api/v1/media/upload-url
```

**リクエスト**
```json
{
  "file_name": "image.jpg",
  "file_type": "image/jpeg",
  "file_size": 2048000
}
```

**バリデーション**
| フィールド | 型 | 必須 | 制約 |
|-----------|-----|------|------|
| file_name | string | ○ | 最大255文字 |
| file_type | string | ○ | 許可: image/jpeg, image/png, image/gif（大容量GIFは動画推奨） |
| file_size | integer | ○ | 最大10MB |

**レスポンス** (200 OK)
```json
{
  "upload_url": "https://storage.rovrov.app/upload?token=...",
  "media_id": "789e0123-e89b-12d3-a456-426614174000",
  "expires_at": "2024-01-01T13:00:00Z",
  "provider": "storage"
}
```

#### 4.2 動画アップロードURL取得（Cloudflare Stream）
```http
POST /api/v1/media/stream/direct-upload
```

**リクエスト**
```json
{
  "file_name": "video.mp4",
  "file_type": "video/mp4",
  "file_size": 52428800
}
```

**バリデーション**
| フィールド | 型 | 必須 | 制約 |
|-----------|-----|------|------|
| file_name | string | ○ | 最大255文字 |
| file_type | string | ○ | 許可: video/mp4, video/quicktime |
| file_size | integer | ○ | 最大100MB |

**レスポンス** (200 OK)
```json
{
  "upload_url": "https://upload.cloudflarestream.com/...",
  "media_id": "789e0123-e89b-12d3-a456-426614174000",
  "expires_at": "2024-01-01T13:00:00Z",
  "provider": "stream"
}
```

### 5. ソーシャル機能 (Social)

#### 5.1 フォロー
```http
POST /api/v1/users/{user_id}/follow
```
**Idempotency-Key必須**: 同一キーでは完全同一応答

**レスポンス** (204 No Content)

#### 5.2 フォロー解除
```http
DELETE /api/v1/users/{user_id}/follow
```

#### 5.3 友達申請
```http
POST /api/v1/friends/request
```
**Idempotency-Key必須**: 同一キーでは完全同一応答

**リクエスト**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### 5.4 友達申請一覧取得
```http
GET /api/v1/friends/requests?direction={direction}&cursor={cursor}&limit={limit}
```

**クエリパラメータ**
| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|------------|------|
| direction | string | - | in | in（受信）\|out（送信） |
| cursor | string | - | - | ページネーションカーソル |
| limit | integer | - | 20 | 取得件数（1-100） |

#### 5.5 友達申請承認
```http
POST /api/v1/friends/accept
```

**リクエスト**
```json
{
  "request_id": "456e7890-e89b-12d3-a456-426614174000"
}
```

#### 5.6 友達申請拒否/キャンセル
```http
DELETE /api/v1/friends/requests/{request_id}
```

**説明**: 受信側は拒否、送信側はキャンセルとして機能

#### 5.7 友達解除
```http
DELETE /api/v1/friends/{friend_id}
```

#### 5.8 いいね
```http
POST /api/v1/posts/{post_id}/favorite
```
**Idempotency-Key必須**: 同一キーでは完全同一応答

#### 5.9 いいね取り消し
```http
DELETE /api/v1/posts/{post_id}/favorite
```

#### 5.10 リポスト
```http
POST /api/v1/posts/{post_id}/repost
```
**Idempotency-Key必須**: 同一キーでは完全同一応答

**レスポンス** (204 No Content)

#### 5.11 リポスト取り消し
```http
DELETE /api/v1/posts/{post_id}/repost
```

#### 5.12 ブロック
```http
POST /api/v1/blocks
```

**リクエスト**
```json
{
  "blocked_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**レスポンス** (204 No Content)

#### 5.13 ブロック解除
```http
DELETE /api/v1/blocks/{blocked_id}
```

#### 5.14 投稿ブックマーク
```http
POST /api/v1/posts/{post_id}/bookmark
```
**Idempotency-Key必須**: 同一キーでは完全同一応答

**レスポンス** (204 No Content)

#### 5.15 投稿ブックマーク解除
```http
DELETE /api/v1/posts/{post_id}/bookmark
```

#### 5.16 Pinブックマーク
```http
POST /api/v1/pins/{pin_id}/bookmark
```
**Idempotency-Key必須**: 同一キーでは完全同一応答

**レスポンス** (204 No Content)

#### 5.17 Pinブックマーク解除
```http
DELETE /api/v1/pins/{pin_id}/bookmark
```

#### 5.18 ブックマーク一覧取得
```http
GET /api/v1/me/bookmarks?type={type}&cursor={cursor}&limit={limit}
```

**クエリパラメータ**
| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|------------|------|
| type | string | - | post | post\|pin |
| cursor | string | - | - | ページネーションカーソル |
| limit | integer | - | 20 | 取得件数（1-100） |

### 6. Pin（場所タグ）

#### 6.1 Pin作成
```http
POST /api/v1/pins
```
**Idempotency-Key必須**: 同一キーでは完全同一応答

**リクエスト**
```json
{
  "name": "My Favorite Cafe",
  "location": {
    "type": "Point",
    "coordinates": [139.7024, 35.6598]
  },
  "source": "user",
  "address": "東京都渋谷区..."
}
```

**バリデーション**
| フィールド | 型 | 必須 | 制約 |
|-----------|-----|------|------|
| name | string | ○ | 最大255文字 |
| location | object | ○ | GeoJSON Point形式 |
| location.coordinates | array | ○ | [経度, 緯度]、-180～180、-90～90 |
| source | string | - | user\|google\|foursquare |
| address | string | - | 最大500文字 |

#### 6.2 近隣Pin検索
```http
GET /api/v1/pins/nearby?lat=35.6598&lng=139.7024&radius=500
```

**クエリパラメータ**
| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|------------|------|
| lat | float | ○ | - | 緯度（-90～90） |
| lng | float | ○ | - | 経度（-180～180） |
| radius | integer | - | 1000 | 検索半径（メートル、最大5000） |
| limit | integer | - | 20 | 取得件数（1-100） |

### 7. 地図表示 (Map)

#### 7.1 地図投稿取得
```http
GET /api/v1/map/posts?bounds={sw_lat},{sw_lng},{ne_lat},{ne_lng}
```

**クエリパラメータ**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| bounds | string | ○ | 南西端緯度,南西端経度,北東端緯度,北東端経度 |
| zoom | integer | - | ズームレベル（0-20） |

**レスポンス** (200 OK)
```json
{
  "posts": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174000",
      "display_point": {
        "type": "Point",
        "coordinates": [139.7, 35.6]
      },
      "thumbnail_url": "https://cdn.rovrov.app/thumbs/...",
      "caption": "Beautiful sunset",
      "user": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "username": "johndoe",
        "avatar_url": "https://cdn.rovrov.app/avatars/..."
      }
    }
  ],
  "clusters": [
    {
      "cluster_id": "zoom:14_grid:23_45",  // 生成規則: "zoom:{z}_grid:{x}_{y}"
      "center": {
        "type": "Point",
        "coordinates": [139.7, 35.6]
      },
      "bbox": {
        "sw": {"lat": 35.5, "lng": 139.6},
        "ne": {"lat": 35.7, "lng": 139.8}
      },
      "count": 15,
      "representative_thumbnail": "https://cdn.rovrov.app/thumbs/..."
    }
  ],
  "total_count": 120,
  "has_more": true
}
```

**認証**: 任意（匿名時はpublic投稿のみ）
**設計根拠**: design.md「地図UI/クラスタ仕様」を参照

### 8. アカウント管理 (Account)

#### 8.1 退会申請
```http
POST /api/v1/account/request-deletion
```

**レスポンス** (200 OK)
```json
{
  "message": "Account deletion requested. You have 30 days to cancel.",
  "deletion_date": "2024-02-01T00:00:00Z"
}
```

#### 8.2 退会申請キャンセル
```http
POST /api/v1/account/cancel-deletion
```

**レスポンス** (200 OK)
```json
{
  "message": "Account deletion cancelled successfully"
}
```

### 9. 管理者機能 (Admin)

#### 9.1 アカウント停止
```http
POST /api/v1/admin/users/{user_id}/suspend
```

**リクエスト**
```json
{
  "reason": "Violation of terms",
  "until": "2024-02-01T00:00:00Z"
}
```

**認証**: 管理者権限必須

#### 9.2 アカウント停止解除
```http
POST /api/v1/admin/users/{user_id}/reinstate
```

**認証**: 管理者権限必須

#### 9.3 期限切れアカウント削除
```http
POST /api/v1/admin/purge-expired-deletions
```

**レスポンス** (200 OK)
```json
{
  "deleted_count": 5
}
```

**認証**: 管理者権限必須

### 10. POI/Places検索 (Places)

#### 10.1 Places Autocomplete
```http
POST /api/v1/places/autocomplete
```

**リクエスト**
```json
{
  "input": "渋谷カフェ",
  "location": {
    "lat": 35.6598,
    "lng": 139.7024
  },
  "radius": 5000,
  "session_token": "550e8400-e29b-41d4"
}
```

**バリデーション**
| フィールド | 型 | 必須 | 制約 |
|-----------|-----|------|------|
| input | string | ○ | 最大100文字 |
| location | object | - | 中心座標 |
| radius | integer | - | 検索半径（メートル） |
| session_token | string | ○ | セッショントークン（課金管理用） |

#### 10.2 POI検索
```http
GET /api/v1/poi/search?query={query}&lat={lat}&lng={lng}
```

**クエリパラメータ**
| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|------------|------|
| query | string | - | - | 検索クエリ（未指定時は周辺検索） |
| lat | float | ○ | - | 緯度 |
| lng | float | ○ | - | 経度 |
| radius | integer | - | 1000 | 検索半径 |
| types | string | - | - | 場所タイプ（カンマ区切り） |

**備考**: query未指定の場合、Nearby検索として動作（FieldMask=card相当）

#### 10.3 POI詳細取得
```http
GET /api/v1/poi/details/{place_id}?fields={fields}&session_token={token}
```

**パスパラメータ**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| place_id | string | ○ | Google Place ID |

**クエリパラメータ**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| fields | string | - | FieldMask（取得フィールド指定、課金最適化） |
| session_token | string | - | Autocompleteからのセッショントークン（課金セッション継続） |

**備考**: MVPはGoogle固定。複数プロバイダ対応は将来拡張。

## エラー設計

### HTTPステータスコード

| コード | 説明 | 使用場面 |
|--------|------|----------|
| 200 | OK | 成功（取得・更新） |
| 201 | Created | リソース作成成功 |
| 204 | No Content | 成功（レスポンスボディなし） |
| 400 | Bad Request | バリデーションエラー、不正なリクエスト |
| 401 | Unauthorized | 認証エラー（トークン無効・期限切れ） |
| 403 | Forbidden | 認可エラー（権限不足、RLS違反） |
| 404 | Not Found | リソースが存在しない |
| 409 | Conflict | 競合（重複、状態遷移違反） |
| 422 | Unprocessable Entity | ビジネスロジックエラー |
| 429 | Too Many Requests | レート制限超過 |
| 500 | Internal Server Error | サーバー内部エラー |
| 502 | Bad Gateway | 外部サービスエラー |
| 503 | Service Unavailable | メンテナンス中 |

### エラーレスポンス形式

```json
{
  "error": {
    "code": "POST_NOT_FOUND",
    "message": "The requested post does not exist",
    "details": {
      "post_id": "456e7890-e89b-12d3-a456-426614174000"
    },
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### ドメインエラーコード

#### 認証・認可系
| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| AUTH_TOKEN_INVALID | 401 | 無効なトークン |
| AUTH_TOKEN_EXPIRED | 401 | トークン期限切れ |
| AUTH_MAGIC_LINK_EXPIRED | 401 | マジックリンク期限切れ |
| AUTH_USER_SUSPENDED | 403 | アカウント停止中 |
| AUTH_USER_DELETED | 403 | アカウント削除済み |
| AUTH_USER_PENDING_DELETION | 403 | アカウント退会申請中（読み取り可、書き込み不可） |

#### バリデーション系
| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| VALIDATION_FAILED | 400 | バリデーションエラー |
| INVALID_EMAIL_FORMAT | 400 | メールアドレス形式不正 |
| INVALID_UUID_FORMAT | 400 | UUID形式不正 |
| FIELD_REQUIRED | 400 | 必須フィールド未入力 |
| FIELD_TOO_LONG | 400 | フィールド長超過 |
| INVALID_ENUM_VALUE | 400 | 無効なENUM値 |
| INVALID_COORDINATES | 400 | 無効な座標値 |

#### リソース系
| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| USER_NOT_FOUND | 404 | ユーザーが存在しない |
| POST_NOT_FOUND | 404 | 投稿が存在しない |
| PIN_NOT_FOUND | 404 | Pinが存在しない |
| MEDIA_NOT_FOUND | 404 | メディアが存在しない |

#### 権限系
| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| VISIBILITY_FORBIDDEN | 403 | 公開範囲により閲覧不可 |
| NOT_POST_OWNER | 403 | 投稿の所有者でない |
| BLOCKED_USER | 403 | ブロックされている |
| NOT_FRIEND | 403 | 友達でない |
| ACCOUNT_NOT_ACTIVE_FOR_WRITE | 403 | アカウントが書き込み不可状態（suspended/pending_deletion） |

#### 状態遷移系
| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| STATE_TRANSITION_DENIED | 409 | 無効な状態遷移 |
| POST_ALREADY_PUBLISHED | 409 | 既に公開済み |
| POST_ALREADY_DELETED | 409 | 既に削除済み |
| ALREADY_FOLLOWING | 409 | 既にフォロー中 |
| FRIEND_REQUEST_EXISTS | 409 | 友達申請が既に存在 |
| ALREADY_FRIENDS | 409 | 既に友達関係 |
| BLOCK_RELATION_EXISTS | 409 | ブロック関係が既に存在 |
| ALREADY_BOOKMARKED | 409 | 既にブックマーク済み |
| ALREADY_FAVORITED | 409 | 既にいいね済み |
| ALREADY_REPOSTED | 409 | 既にリポスト済み |
| IDEMPOTENCY_KEY_REPLAY | 409 | 冪等性キー処理中または完了済み |
| MUTUAL_FOLLOW_REQUIRED | 422 | 相互フォローが必要 |

#### メディア系
| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| FILE_TOO_LARGE | 400 | ファイルサイズ超過 |
| UNSUPPORTED_FILE_TYPE | 400 | 非対応ファイル形式 |
| UPLOAD_URL_EXPIRED | 400 | アップロードURL期限切れ |
| MEDIA_PROCESSING_FAILED | 422 | メディア処理失敗 |
| MEDIA_VISIBILITY_BROADER_THAN_POST | 422 | メディアの可視性が投稿より広い |

#### レート制限系
| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| RATE_LIMIT_EXCEEDED | 429 | レート制限超過 |
| DAILY_POST_LIMIT | 429 | 1日の投稿上限超過 |

#### システム系
| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| INTERNAL_ERROR | 500 | 内部エラー |
| DATABASE_ERROR | 500 | データベースエラー |
| STORAGE_ERROR | 502 | ストレージサービスエラー |
| EXTERNAL_SERVICE_ERROR | 502 | 外部サービスエラー |
| SERVICE_MAINTENANCE | 503 | メンテナンス中 |

## セキュリティ考慮事項

### CORS設定
```json
{
  "allowed_origins": [
    "https://rovrov.app",
    "https://app.rovrov.app",
    "capacitor://localhost",
    "http://localhost:3000"
  ],
  "allowed_methods": ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  "allowed_headers": ["Content-Type", "Authorization", "X-Request-ID", "Idempotency-Key"],
  "max_age": 86400
}
```

### セキュリティヘッダー
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block  # 注: 現代ブラウザでは非推奨だが害なし
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

### 入力サニタイゼーション
- SQLインジェクション: パラメータバインディング使用
- XSS: HTMLエスケープ処理
- パストラバーサル: ファイルパス検証
- EXIF除去: 位置情報等のメタデータ自動削除

## 実装チェックリスト

### API基盤
- [ ] バージョニング実装
- [ ] 認証ミドルウェア
- [ ] レート制限実装
- [ ] 冪等性キー処理
- [ ] ページネーション共通処理
- [ ] エラーハンドリング統一

### エンドポイント実装
- [ ] 認証系API
- [ ] プロファイル系API
- [ ] 投稿系API
- [ ] メディア系API
- [ ] ソーシャル系API
- [ ] Pin系API
- [ ] 地図系API

### エラー処理
- [ ] ドメインエラーコード定義
- [ ] エラーレスポンス統一
- [ ] バリデーションエラー詳細化
- [ ] ログ記録実装

### セキュリティ
- [ ] CORS設定
- [ ] セキュリティヘッダー
- [ ] 入力検証・サニタイゼーション
- [ ] RLS連携確認

## 付録

### 日付時刻形式
- ISO 8601形式: `2024-01-01T12:00:00Z`
- タイムゾーン: UTC

### UUID形式
- RFC 4122準拠: `123e4567-e89b-12d3-a456-426614174000`

### 座標形式
- GeoJSON Point: `{"type": "Point", "coordinates": [経度, 緯度]}`
- 座標系: WGS84 (EPSG:4326)

### 文字エンコーディング
- UTF-8

### 最大リクエストサイズ
- 通常API: 1MB
- メディアアップロード: 100MB

### ケース名規約対応表

APIレスポンス（snake_case）とTypeScript型（camelCase）の対応:

| API (snake_case) | TypeScript (camelCase) | 説明 |
|-----------------|------------------------|------|
| user_id | userId | ユーザーID |
| post_id | postId | 投稿ID |
| media_id | mediaId | メディアID |
| pin_id | pinId | Pin ID |
| display_name | displayName | 表示名 |
| avatar_url | avatarUrl | アバター画像URL |
| created_at | createdAt | 作成日時 |
| updated_at | updatedAt | 更新日時 |
| deleted_at | deletedAt | 削除日時 |
| published_at | publishedAt | 公開日時 |
| expires_at | expiresAt | 有効期限 |
| map_visibility | mapVisibility | 地図表示設定 |
| display_point | displayPoint | 地図表示座標 |
| location_source | locationSource | 位置情報ソース |
| file_name | fileName | ファイル名 |
| file_type | fileType | ファイルタイプ |
| file_size | fileSize | ファイルサイズ |
| upload_url | uploadUrl | アップロードURL |
| thumbnail_url | thumbnailUrl | サムネイルURL |
| stream_uid | streamUid | Cloudflare Stream ID |
| duration_seconds | durationSeconds | 動画長（秒） |
| favorite_count | favoriteCount | いいね数 |
| repost_count | repostCount | リポスト数 |
| followers_count | followersCount | フォロワー数 |
| following_count | followingCount | フォロー数 |
| posts_count | postsCount | 投稿数 |
| is_following | isFollowing | フォロー中フラグ |
| is_friend | isFriend | 友達フラグ |
| has_more | hasMore | 次ページ有無 |
| next_cursor | nextCursor | 次ページカーソル |
| total_count | totalCount | 総件数 |
| session_token | sessionToken | セッショントークン |
| place_id | placeId | Google Place ID |
| source_place_id | sourcePlaceId | 外部プロバイダID |
| request_id | requestId | リクエストID |
| blocked_id | blockedId | ブロック対象ID |
| media_ids | mediaIds | メディアID配列 |

### クロスフィールド検証

| 条件 | 必須/制約 | エラー |
|------|-----------|--------|
| status ∈ {temporary, published} | media_ids.length ≥ 1 | STATE_TRANSITION_DENIED (409) |
| map_visibility = 'none' | display_point はDBトリガでNULLに強制 | - |
| media_files.visibility が posts.visibility より広い | 禁止 | MEDIA_VISIBILITY_BROADER_THAN_POST (422) |
| profiles.status ∈ {suspended, pending_deletion} で書き込み | 禁止 | ACCOUNT_NOT_ACTIVE_FOR_WRITE (403) |
| draft → published/temporary 遷移時 | published_at = NOW() を必ずセット | - |
| 友達申請時に相互フォローなし | 禁止 | MUTUAL_FOLLOW_REQUIRED (422) |

### メディア表示順
- POST /posts 作成時の media_ids 配列順を display_order に反映
- 並び替えが必要な場合は、PATCH /api/v1/posts/{id}/media-order で更新可能

### タグ作成ポリシー
- POST /posts の tags 配列で新規タグ名を指定した場合、存在しなければ自動作成
- 既存タグは名前で自動マッチング（大文字小文字を区別）
- タグ名の正規化はクライアント側で実施

### 管理者API制約
- 管理者権限での更新は専用APIエンドポイント（/api/v1/admin/*）経由のみ
- 通常のREST APIでは管理者も読み取り専用
- 監査ログは全管理者操作で自動記録
- MVPでは即時削除APIは削除、退会ワークフロー（30日猶予）に統一

## 最終チェック観点

### 契約テスト確認項目
- 未ログインで `GET /api/v1/timeline/featured`、`GET /api/v1/posts/nearby`、`GET /api/v1/map/posts` が200かつpublicのみ取得
- pending_deletion本人: READ可 / WRITE禁止で `ACCOUNT_NOT_ACTIVE_FOR_WRITE`（403）
- Cloudflare Stream直アップロード → Webhookで `media_files.status`: `processing` → `ready` 遷移
- `media_files.visibility='public'` + 親 `posts.visibility='friends'` → 422 `MEDIA_VISIBILITY_BROADER_THAN_POST`
- Block関係があると403 `BLOCKED_USER`（すべてのREAD/WRITEで確認）
- 友達申請: 相互フォロー未満 → 422 `MUTUAL_FOLLOW_REQUIRED`
- 友達申請 → 相互承認で双方向レコード生成（DBトリガ）
- Pins RLS: 匿名は公開投稿に紐づくPinのみ取得可能
- POI検索: query なしで周辺検索にフォールバック（Nearby分のFieldMask=card）