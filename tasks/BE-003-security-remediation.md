# BE-003: セキュリティ監査結果改修タスク

## タスク概要

BE-004実装完了後のSupabaseセキュリティ監査で発見された警告・エラーの修正を行う。

## 修正対象

### 🔴 ERROR レベル (優先度: 高)

#### 1. Auth Users Exposed
- **問題**: `auth.users`テーブルへの直接アクセスが可能
- **影響範囲**: 認証システム全体のセキュリティリスク
- **修正内容**: 
  - `auth.users`テーブルのRLSポリシー適用
  - 必要な場合はビューを作成して制限されたカラムのみ公開

#### 2. Security Definer Views with RLS Disabled
- **問題**: SECURITY DEFINERビューでRLSが無効
- **影響範囲**: データアクセス制御の迂回可能性
- **修正内容**:
  - 該当ビューの特定と修正
  - RLS有効化または適切なアクセス制御の実装

#### 3. RLS Disabled on Tables with Data
- **問題**: データが存在するテーブルでRLSが無効
- **影響範囲**: 不正なデータアクセスリスク
- **修正内容**:
  - 対象テーブルの特定
  - 適切なRLSポリシーの作成と適用

### 🟡 WARNING レベル (優先度: 中)

#### 4. Function Search Path Mutable (17件)

**トリガー関数群 (BE-004で新規作成)**:
- `calculate_display_point()`
- `set_published_at()`
- `update_favorite_count()`
- `update_repost_count()`
- `update_posts_count()`
- `validate_media_visibility()`
- `create_mutual_friends()`

**その他既存関数群 (BE-002/BE-003で作成)**:
- `handle_new_user()`
- `update_friendship_status()`
- `update_user_updated_at()`
- `update_user_preference_updated_at()`
- `update_user_profile_updated_at()`
- `update_user_stats_updated_at()`
- `update_pin_updated_at()`
- `update_post_updated_at()`
- `update_favorite_updated_at()`
- `update_repost_updated_at()`

**修正内容**:
- 各関数の`search_path`を明示的に設定
- SQLインジェクション攻撃対策の強化
- 関数定義に`SET search_path = ''`または適切なスキーマパスを追加

## 修正例

### 関数のsearch_path修正例
```sql
-- 修正前
CREATE OR REPLACE FUNCTION calculate_display_point()
RETURNS TRIGGER AS $$
-- 関数本体
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 修正後  
CREATE OR REPLACE FUNCTION calculate_display_point()
RETURNS TRIGGER AS $$
-- 関数本体
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';
```

### RLSポリシー追加例
```sql
-- auth.usersテーブルのRLS有効化
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- 適切なポリシーの作成
CREATE POLICY "Users can view own data" ON auth.users
  FOR SELECT USING (auth.uid() = id);
```

## 影響範囲

- **認証システム**: `auth.users`テーブルの露出修正
- **データアクセス制御**: RLS無効テーブルの修正
- **関数セキュリティ**: 全20関数の`search_path`修正
- **既存機能**: BE-002/BE-003で実装済みの機能に影響する可能性

## 注意事項

- 本修正作業は既存のアプリケーション動作に影響する可能性があるため、十分なテストが必要
- `auth.users`テーブルの修正は特に慎重に行う必要がある
- RLSポリシーの適用前に既存のデータアクセスパターンを十分に調査する
- 関数の`search_path`修正により、既存のクエリが動作しなくなる可能性がある

## 関連タスク

- BE-002: データベーススキーマ実装
- BE-003: RLSポリシー実装  
- BE-004: データベーストリガー実装