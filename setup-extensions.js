require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// PostgreSQL拡張機能のセットアップ
console.log('🚀 PostgreSQL拡張機能のセットアップを開始...\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupPostgreSQLExtensions() {
    const extensions = [
        { name: 'pgcrypto', description: 'UUID生成とハッシュ機能用' },
        { name: 'postgis', description: '位置情報処理用' },
        { name: 'pg_trgm', description: '全文検索用' }
    ];

    console.log('📋 PostgreSQL拡張機能を有効化中...\n');

    for (const ext of extensions) {
        console.log(`🔧 ${ext.name}を有効化中... (${ext.description})`);
        
        try {
            // 拡張機能を有効化
            const { data, error } = await supabase.rpc('sql', {
                query: `CREATE EXTENSION IF NOT EXISTS "${ext.name}";`
            });
            
            if (error) {
                console.log(`❌ ${ext.name}の有効化に失敗:`, error.message);
                
                // 別の方法で試行
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
                    method: 'POST',
                    headers: {
                        'apikey': supabaseServiceKey,
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `CREATE EXTENSION IF NOT EXISTS "${ext.name}";`
                    })
                });
                
                if (response.ok) {
                    console.log(`✅ ${ext.name}を有効化しました`);
                } else {
                    console.log(`❌ ${ext.name}の有効化に失敗: HTTP ${response.status}`);
                }
            } else {
                console.log(`✅ ${ext.name}を有効化しました`);
            }
            
        } catch (error) {
            console.log(`❌ ${ext.name}の有効化エラー:`, error.message);
        }
    }

    // 有効化の確認
    console.log('\n🔍 拡張機能の確認中...\n');
    
    for (const ext of extensions) {
        try {
            let confirmed = false;
            
            // 拡張機能固有のテスト関数を実行
            switch (ext.name) {
                case 'pgcrypto':
                    const { data: uuid, error: uuidError } = await supabase.rpc('gen_random_uuid');
                    if (!uuidError) {
                        console.log(`✅ ${ext.name}: UUID生成テスト成功 (${uuid})`);
                        confirmed = true;
                    }
                    break;
                    
                case 'postgis':
                    const { data: version, error: versionError } = await supabase.rpc('postgis_version');
                    if (!versionError) {
                        console.log(`✅ ${ext.name}: バージョン確認成功 (${version})`);
                        confirmed = true;
                    }
                    break;
                    
                case 'pg_trgm':
                    const { data: similarity, error: simError } = await supabase.rpc('similarity', {
                        text1: 'test',
                        text2: 'testing'
                    });
                    if (!simError) {
                        console.log(`✅ ${ext.name}: 類似度テスト成功 (${similarity})`);
                        confirmed = true;
                    }
                    break;
            }
            
            if (!confirmed) {
                console.log(`⚠️  ${ext.name}: 確認テストに失敗 - 手動でSQL Editorから確認してください`);
            }
            
        } catch (error) {
            console.log(`⚠️  ${ext.name}: 確認エラー - ${error.message}`);
        }
    }
}

// スクリプト実行
setupPostgreSQLExtensions()
    .then(() => {
        console.log('\n🎉 PostgreSQL拡張機能のセットアップが完了しました！');
        console.log('\nSupabase SQL Editorで手動確認が必要な場合は以下を実行してください:');
        console.log('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
        console.log('CREATE EXTENSION IF NOT EXISTS "postgis";');
        console.log('CREATE EXTENSION IF NOT EXISTS "pg_trgm";');
    })
    .catch((error) => {
        console.error('\n💥 エラーが発生しました:', error.message);
    });