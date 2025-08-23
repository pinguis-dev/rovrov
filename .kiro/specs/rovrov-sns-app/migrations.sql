-- RovRov SNS Database Migrations
-- MVPバージョン: 状態遷移・データ保持・権限設計に基づく実装
-- 実行順序: 上から順番に実行すること

-- ================================================
-- 1. ENUM型の作成
-- ================================================

-- Post状態のENUM（is_temporaryを置き換え）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_status') THEN
    CREATE TYPE post_status AS ENUM ('draft','temporary','published','archived','deleted');
  END IF;
END$$;

-- Friend状態のENUM
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friend_status') THEN
    CREATE TYPE friend_status AS ENUM ('pending','accepted','blocked');
  END IF;
END$$;

-- Media状態のENUM
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_status') THEN
    CREATE TYPE media_status AS ENUM ('uploading','processing','ready','failed','deleted');
  END IF;
END$$;

-- ================================================
-- 2. 既存テーブルの修正
-- ================================================

-- Posts テーブルの修正
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS status post_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 既存データのマイグレーション（is_temporary → status）
UPDATE posts
SET status = CASE
  WHEN is_temporary IS TRUE AND expires_at > NOW() THEN 'temporary'
  WHEN is_temporary IS TRUE AND expires_at <= NOW() THEN 'archived'
  WHEN is_temporary IS FALSE THEN 'published'
  ELSE 'draft'
END
WHERE status = 'draft';

-- is_temporary列の削除（確認後に実行）
-- ALTER TABLE posts DROP COLUMN IF EXISTS is_temporary;

-- Media Files テーブルの修正
ALTER TABLE media_files
  ADD COLUMN IF NOT EXISTS status media_status DEFAULT 'ready',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS checksum TEXT,
  ADD COLUMN IF NOT EXISTS stream_uid TEXT,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Pins テーブルの修正（可視性管理）
ALTER TABLE pins
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- ================================================
-- 3. 新規テーブルの作成
-- ================================================

-- Blocks テーブル（ブロック関係管理）
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- Pin属性キャッシュテーブル（TTL管理）
CREATE TABLE IF NOT EXISTS pin_attributes (
  pin_id UUID REFERENCES pins(id) ON DELETE CASCADE,
  attribute_type TEXT NOT NULL, -- 'google:card', 'google:details' など
  attribute_value JSONB NOT NULL,
  source TEXT NOT NULL, -- 'google', 'foursquare', 'user' など
  cached_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (pin_id, attribute_type)
);

-- 位置情報生データテーブル（30日保持）
CREATE TABLE IF NOT EXISTS post_geo_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  horizontal_accuracy DOUBLE PRECISION,
  source TEXT, -- 'gps', 'exif', 'manual'
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 4. インデックスの作成
-- ================================================

-- 状態遷移最適化
CREATE INDEX IF NOT EXISTS idx_posts_status_published_at 
  ON posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status_expires_at 
  ON posts(status, expires_at) 
  WHERE status = 'temporary';

-- 論理削除最適化
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at 
  ON posts(deleted_at) 
  WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_deleted_at 
  ON media_files(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- キャッシュ管理最適化
CREATE INDEX IF NOT EXISTS idx_pin_attr_expiry 
  ON pin_attributes(cached_until);
CREATE INDEX IF NOT EXISTS idx_post_geo_expire 
  ON post_geo_events(captured_at);

-- ブロック関係最適化
CREATE INDEX IF NOT EXISTS idx_blocks_blocker 
  ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked 
  ON blocks(blocked_id);

-- ================================================
-- 5. Row Level Security（RLS）設定
-- ================================================

-- Blocksテーブル
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY blocks_owner_insert ON blocks
  FOR INSERT WITH CHECK (blocker_id = auth.uid());

CREATE POLICY blocks_owner_delete ON blocks
  FOR DELETE USING (blocker_id = auth.uid());

CREATE POLICY blocks_owner_select ON blocks
  FOR SELECT USING (blocker_id = auth.uid());

-- Tags/PostTagsテーブル（MVPで必要）
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY tags_read ON tags 
  FOR SELECT USING (true);

CREATE POLICY tags_write ON tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY post_tags_read ON post_tags 
  FOR SELECT USING (true);

CREATE POLICY post_tags_write ON post_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_id 
        AND posts.user_id = auth.uid()
    )
  );

-- Posts可視性ポリシー（MVPバージョン：followersなし）
DROP POLICY IF EXISTS posts_visibility_policy ON posts;

CREATE POLICY posts_visibility_policy ON posts
FOR SELECT USING (
  -- ブロック関係がある場合は即座に拒否
  NOT EXISTS (
    SELECT 1 FROM blocks b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id = posts.user_id)
       OR (b.blocker_id = posts.user_id AND b.blocked_id = auth.uid())
  )
  AND (
    -- 削除済みでない
    posts.deleted_at IS NULL
    AND posts.status != 'deleted'
    -- 可視性判定
    AND (
      visibility = 'public'
      OR user_id = auth.uid()
      OR (
        visibility = 'friends' AND EXISTS (
          SELECT 1 FROM friends
          WHERE user_id = auth.uid()
            AND friend_id = posts.user_id
            AND status = 'accepted'
        )
      )
    )
  )
);

-- Media Files可視性ポリシー（親投稿の可視性を継承）
DROP POLICY IF EXISTS media_files_select ON media_files;

CREATE POLICY media_files_select ON media_files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM posts p
    WHERE p.id = media_files.post_id
      AND p.deleted_at IS NULL
      AND p.status != 'deleted'
      -- ブロック判定
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p.user_id)
           OR (b.blocker_id = p.user_id AND b.blocked_id = auth.uid())
      )
      -- 可視性判定
      AND (
        p.visibility = 'public'
        OR p.user_id = auth.uid()
        OR (
          p.visibility = 'friends' AND EXISTS (
            SELECT 1 FROM friends
            WHERE user_id = auth.uid()
              AND friend_id = p.user_id
              AND status = 'accepted'
          )
        )
      )
  )
);

-- ================================================
-- 6. ビューの作成
-- ================================================

-- 公開プロフィールビュー（PII保護）
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id, 
  username, 
  display_name, 
  avatar_image_url,
  created_at
FROM profiles
WHERE deleted_at IS NULL;

-- ビューへの権限付与
GRANT SELECT ON public_profiles TO anon, authenticated;

-- ================================================
-- 7. トリガー関数
-- ================================================

-- 相互フォロー強制（友達申請時）
CREATE OR REPLACE FUNCTION ensure_mutual_follow_before_friend()
RETURNS TRIGGER AS $$
BEGIN
  -- 相互フォローチェック
  IF NOT EXISTS (
    SELECT 1 FROM follows f1
    JOIN follows f2 ON f2.follower_id = NEW.friend_id AND f2.following_id = NEW.user_id
    WHERE f1.follower_id = NEW.user_id AND f1.following_id = NEW.friend_id
  ) THEN
    RAISE EXCEPTION 'Mutual follow is required before sending friend request';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_friends_mutual_follow ON friends;
CREATE TRIGGER trg_friends_mutual_follow
BEFORE INSERT ON friends
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION ensure_mutual_follow_before_friend();

-- updated_at自動更新（汎用）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_atトリガーの適用
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pins_updated_at BEFORE UPDATE ON pins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pin_attributes_updated_at BEFORE UPDATE ON pin_attributes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 8. 権限付与（Anonymous対応）
-- ================================================

-- anonymousユーザーへの読み取り権限
GRANT SELECT ON posts TO anon;
GRANT SELECT ON media_files TO anon;
GRANT SELECT ON pins TO anon;
GRANT SELECT ON tags TO anon;
GRANT SELECT ON post_tags TO anon;

-- authenticatedユーザーへの権限
GRANT ALL ON posts TO authenticated;
GRANT ALL ON media_files TO authenticated;
GRANT ALL ON pins TO authenticated;
GRANT ALL ON tags TO authenticated;
GRANT ALL ON post_tags TO authenticated;
GRANT ALL ON blocks TO authenticated;
GRANT ALL ON pin_attributes TO authenticated;
GRANT ALL ON post_geo_events TO authenticated;

-- ================================================
-- 9. バッチ処理用関数（Edge Functionsから呼び出し）
-- ================================================

-- 期限切れ一時投稿のアーカイブ化
CREATE OR REPLACE FUNCTION archive_expired_temporary_posts()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE posts 
  SET status = 'archived',
      visibility = 'private'
  WHERE status = 'temporary'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- 論理削除データの物理削除
CREATE OR REPLACE FUNCTION purge_deleted_posts()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  DELETE FROM posts 
  WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION purge_deleted_media()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  DELETE FROM media_files
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- 期限切れキャッシュの削除
CREATE OR REPLACE FUNCTION purge_expired_caches()
RETURNS INTEGER AS $$
DECLARE
  pin_attr_rows INTEGER;
  geo_rows INTEGER;
BEGIN
  DELETE FROM pin_attributes WHERE cached_until < NOW();
  GET DIAGNOSTICS pin_attr_rows = ROW_COUNT;
  
  DELETE FROM post_geo_events WHERE captured_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS geo_rows = ROW_COUNT;
  
  RETURN pin_attr_rows + geo_rows;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 10. 初期データ・デバッグ用
-- ================================================

-- 状態遷移の検証用ビュー
CREATE OR REPLACE VIEW post_status_summary AS
SELECT 
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_count,
  COUNT(CASE WHEN status = 'temporary' AND expires_at < NOW() THEN 1 END) as expired_count
FROM posts
GROUP BY status;

-- ブロック関係の可視化ビュー（開発用）
CREATE OR REPLACE VIEW block_relationships AS
SELECT 
  b.blocker_id,
  p1.username as blocker_username,
  b.blocked_id,
  p2.username as blocked_username,
  b.created_at
FROM blocks b
JOIN profiles p1 ON b.blocker_id = p1.id
JOIN profiles p2 ON b.blocked_id = p2.id;

-- ================================================
-- 実行確認用コメント
-- ================================================
-- 実行順序:
-- 1. ENUM型作成
-- 2. 既存テーブル修正
-- 3. 新規テーブル作成
-- 4. インデックス作成
-- 5. RLS設定
-- 6. ビュー作成
-- 7. トリガー関数
-- 8. 権限付与
-- 9. バッチ処理関数
-- 10. デバッグ用ビュー

-- 実行後の確認:
-- SELECT * FROM post_status_summary;
-- SELECT COUNT(*) FROM blocks;
-- SELECT COUNT(*) FROM pin_attributes;