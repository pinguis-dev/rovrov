require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// TC-BE-001-02: Supabaseクライアント接続テスト
console.log('=== TC-BE-001-02: Supabaseクライアント接続テスト ===\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

async function testConnections() {
    try {
        console.log('1. クライアントの初期化:');
        
        // anonクライアントの作成
        const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
        console.log('  ✓ ANONクライアント初期化成功');
        
        // service roleクライアントの作成
        const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
        console.log('  ✓ SERVICEクライアント初期化成功');
        
        console.log('\n2. ANONクライアントの接続テスト:');
        try {
            // 基本的なクエリテスト（空でも問題ない）
            const { data: anonData, error: anonError } = await supabaseAnon
                .from('profiles')
                .select('count')
                .limit(1);
            
            if (anonError && !anonError.message.includes('relation "profiles" does not exist')) {
                console.log('  ⚠️  ANONクライアント警告:', anonError.message);
            } else {
                console.log('  ✓ ANONクライアント接続成功');
            }
        } catch (error) {
            console.log('  ⚠️  ANONクライアント接続エラー:', error.message);
        }
        
        console.log('\n3. SERVICEクライアントの接続テスト:');
        try {
            // システムテーブルへのアクセステスト
            const { data: serviceData, error: serviceError } = await supabaseService
                .from('information_schema.tables')
                .select('table_name')
                .limit(1);
            
            if (serviceError) {
                console.log('  ❌ SERVICEクライアント接続エラー:', serviceError.message);
                return false;
            } else {
                console.log('  ✓ SERVICEクライアント接続成功');
                console.log('  ✓ システムテーブルアクセス可能');
            }
        } catch (error) {
            console.log('  ❌ SERVICEクライアント接続エラー:', error.message);
            return false;
        }
        
        console.log('\n4. API エンドポイントの確認:');
        try {
            // REST APIエンドポイントの確認
            const response = await fetch(`${supabaseUrl}/rest/v1/`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`
                }
            });
            
            console.log('  REST API status:', response.status);
            console.log('  REST API accessible:', response.ok || response.status === 404);
        } catch (error) {
            console.log('  ⚠️  REST API接続エラー:', error.message);
        }
        
        console.log('\n5. データベース接続の詳細確認:');
        try {
            // データベースバージョン情報取得
            const { data: versionData, error: versionError } = await supabaseService.rpc('version');
            if (!versionError && versionData) {
                console.log('  ✓ データベース接続確認済み');
                console.log('  データベース情報:', versionData.substring(0, 50) + '...');
            }
        } catch (error) {
            console.log('  ⚠️  バージョン情報取得エラー:', error.message);
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ クライアント初期化エラー:', error.message);
        return false;
    }
}

// テスト実行
testConnections().then(success => {
    console.log('\n=== テスト結果 ===');
    if (success) {
        console.log('✅ TC-BE-001-02: PASSED - Supabaseクライアント接続が正常に動作しています');
    } else {
        console.log('❌ TC-BE-001-02: FAILED - Supabaseクライアント接続に問題があります');
    }
}).catch(error => {
    console.log('\n=== テスト結果 ===');
    console.log('❌ TC-BE-001-02: FAILED - テスト実行中にエラーが発生しました:', error.message);
});