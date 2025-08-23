require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Storage RLS（Row Level Security）ポリシーのセットアップ
console.log('🔒 Storage RLSポリシーのセットアップを開始...\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStoragePolicies() {
    console.log('📋 Storage RLSポリシーを設定中...\n');

    // まずRLSを有効化する必要がある
    console.log('🔧 StorageテーブルでRLSを有効化中...');
    
    // 実際のSupabaseではStorage RLSポリシーは別の方法で設定される
    // ここでは基本的なアクセス制御のみテスト
    
    const policies = [
        {
            name: 'Avatar images are publicly readable',
            bucket: 'avatars',
            operation: 'SELECT',
            description: 'avatarsバケットのファイルはすべて読み取り可能'
        },
        {
            name: 'Header images are publicly readable', 
            bucket: 'headers',
            operation: 'SELECT',
            description: 'headersバケットのファイルはすべて読み取り可能'
        },
        {
            name: 'Post media requires authentication',
            bucket: 'posts', 
            operation: 'SELECT',
            description: 'postsバケットは認証ユーザーのみアクセス可能'
        },
        {
            name: 'Temporary files for authenticated users',
            bucket: 'temporary',
            operation: 'ALL',
            description: 'temporaryバケットは認証ユーザーのみアクセス可能'
        }
    ];
    
    // ポリシーの設定をログ出力
    for (const policy of policies) {
        console.log(`📝 ポリシー "${policy.name}"`);
        console.log(`   バケット: ${policy.bucket}`);
        console.log(`   操作: ${policy.operation}`);
        console.log(`   説明: ${policy.description}`);
    }
    
    console.log('\n⚠️  注意: Supabase Storage RLSポリシーは手動設定が必要です');
    console.log('以下の手順でSupabaseダッシュボードから設定してください:\n');
    
    console.log('1. Supabaseダッシュボード > Storage > Policies に移動');
    console.log('2. 各バケット用のポリシーを以下のSQLで作成:\n');
    
    // avatarsバケット用ポリシー
    console.log('-- avatarsバケット: public読み取り');
    console.log('CREATE POLICY "Public Access" ON storage.objects');
    console.log('  FOR SELECT USING (bucket_id = \'avatars\');\n');
    
    // headersバケット用ポリシー
    console.log('-- headersバケット: public読み取り');
    console.log('CREATE POLICY "Public Access" ON storage.objects');
    console.log('  FOR SELECT USING (bucket_id = \'headers\');\n');
    
    // postsバケット用ポリシー
    console.log('-- postsバケット: 認証ユーザーのみ');
    console.log('CREATE POLICY "Authenticated Access" ON storage.objects');
    console.log('  FOR SELECT USING (bucket_id = \'posts\' AND auth.role() = \'authenticated\');\n');
    
    // temporaryバケット用ポリシー
    console.log('-- temporaryバケット: 認証ユーザーのみ');
    console.log('CREATE POLICY "Authenticated Full Access" ON storage.objects');
    console.log('  FOR ALL USING (bucket_id = \'temporary\' AND auth.role() = \'authenticated\');\n');
    
    console.log('3. RLS (Row Level Security) を有効化:');
    console.log('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;\n');
    
    // 現在の設定状況を確認
    console.log('🔍 現在のバケット設定確認中...');
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
            console.log('❌ バケット一覧取得エラー:', error.message);
            return;
        }
        
        console.log('📦 バケット設定状況:');
        buckets.forEach(bucket => {
            console.log(`   - ${bucket.name}: ${bucket.public ? 'public' : 'private'}`);
        });
        
    } catch (error) {
        console.log('❌ バケット設定確認エラー:', error.message);
    }
}

// スクリプト実行
setupStoragePolicies()
    .then(() => {
        console.log('\n🎉 Storage RLSポリシー設定ガイドの表示が完了しました！');
        console.log('\n📝 次のステップ:');
        console.log('1. 上記のSQLをSupabase SQL Editorで実行');
        console.log('2. Storage > Policies でポリシー設定を確認');
        console.log('3. テストを再実行してアクセス制御を検証');
    })
    .catch((error) => {
        console.error('\n💥 エラーが発生しました:', error.message);
    });