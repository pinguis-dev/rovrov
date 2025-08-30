**MCPセッション実行手順 — Supabase 連携とRLS設定**

この手順は「フロントエンド直結＋RLS（Row Level Security）」でユーザー名の可用性チェックとプロフィール更新を安全・高速に動かすためのバックエンド設定と検証内容をまとめたものです。実行はMCP接続のセッションで行います。

**目的**

- profilesテーブルでRLSを有効化し、最小権限で運用する。
- 大文字小文字を同一視したユニーク制約（username_normalized）を導入する。
- フロントからのユーザー名可用性チェックを安全に実行できるようにする。
- 失敗時は安全に止まり、成功時のみ「次へ」できるUXを担保する。

**事前準備（依頼者さま側）**

- Supabaseのプロジェクト情報
  - Project Ref（例: abcd1234）とリージョン
- 接続資格情報（以下のいずれか）
  - Postgres接続文字列（owner権限推奨）
  - もしくは Supabase Access Token + Project Ref（CLI適用用）
- 対象スキーマ: `public`
- アプリの環境変数（フロント側）
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**実行内容（MCPで行うこと）**

1. アクセス確認
   - 接続情報でDBへ到達できるか確認
   - スキーマ`public`の使用を確認
2. SQL適用（docs/supabase-setup.sql）
   - RLS有効化: `alter table public.profiles enable row level security;`
   - 正規化列と一意制約: `username_normalized`列（lower(username)）＋ユニークインデックス作成
   - ポリシー追加
     - `profiles_select_own`（authenticatedは自分の行のみselect）
     - `profiles_update_own`（authenticatedは自分の行のみupdate）
     - `profiles_select_for_username_check`（authenticatedは可用性チェック目的のselectを許可）
   - 権限の最小化
     - `revoke all`→`grant select (id, username)` をauthenticatedに、更新は必要カラムのみ
   - `updated_at`を自動更新するトリガ作成（任意）
   - 既存環境でも冪等に動くようIF NOT EXISTSを多用
3. サニティチェック
   - RLSが有効か
   - インデックス`profiles_username_unique`の存在
   - authenticatedロールでの件数取得（head:true + count:'exact' でrow本体を返さずにカウントできる）

**アプリ側の動作確認**

- ユーザー名可用性チェック
  - 3文字以上で500ms後に通信開始
  - 通信中: メッセージ行に`Checking…`
  - 成功: `✓ 使用可能です`を表示、次へ活性
  - 既存と重複: `✗ 既に使用されています`を表示、次へ非活性
  - エラー/オフライン: `接続できません。時間をおいて再試行してください`を表示、次へ非活性
- 保存時（送信）
  - 競合はDBのユニーク制約で確実に弾かれる（フロントはエラー内容を反映）

**セキュリティ/パフォーマンスの考え方**

- フロント直結＋RLSはSupabase推奨の標準構成（anon keyは公開前提）。
- 可用性チェックは件数のみ取得（`head:true`）で最小トラフィック。
- 正規化＋ユニーク制約で最終整合性をDBに委ね、レースコンディションに強い。
- 今後さらに厳格化する場合はRPC化（テーブルselectを匿名/認証から外し、関数のみ公開）を推奨。

**（任意）クエリの切替メモ**

- DB側で`username_normalized`を導入済みなら、フロントの可用性チェックは `eq('username_normalized', normalized)` に切替えると確実かつ高速。
  - 現状は `ilike('username', normalized)` を使用（導入後に置換可能）。

**ロールバック/再適用メモ**

- 既存のポリシーを削除する場合は、`drop policy if exists <name> on public.profiles;` を先に実行。
- インデックスや生成列は`if not exists`で作成しているため、再実行でエラーになりません。

**チェックリスト**

- [ ] `public.profiles` にRLSが有効
- [ ] `username_normalized`列とユニークインデックスが存在
- [ ] `profiles_select_own / profiles_update_own / profiles_select_for_username_check` が適用
- [ ] authenticatedロールに最小限のカラム権限のみ付与
- [ ] フロントのENV（URL/Anon Key）が設定済み
- [ ] オンライン時に可用性チェックが反応、オフライン時は進めない

実行に必要な接続情報をご用意いただければ、MCPセッションで上記の「適用・検証」まで実施します。
