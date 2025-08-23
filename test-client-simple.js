require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// TC-BE-001-02: より簡単なSupabaseクライアント接続テスト
console.log('=== TC-BE-001-02: Supabaseクライアント接続テスト (簡易版) ===\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

async function testBasicConnections() {
    let anonSuccess = false;
    let serviceSuccess = false;
    
    try {
        console.log('1. クライアントの初期化:');
        
        // anonクライアントの作成
        const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
        console.log('  ✓ ANONクライアント初期化成功');
        
        // service roleクライアントの作成
        const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
        console.log('  ✓ SERVICEクライアント初期化成功');
        
        console.log('\n2. 基本的なAPI接続テスト:');
        
        // RESTエンドポイントへの直接アクセス
        try {
            const anonResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
                method: 'GET',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('  ANON API Status:', anonResponse.status);
            if (anonResponse.status === 200 || anonResponse.status === 404) {
                console.log('  ✓ ANONクライアントAPI接続成功');
                anonSuccess = true;
            } else {
                console.log('  ❌ ANONクライアントAPI接続失敗');
            }
        } catch (error) {
            console.log('  ❌ ANONクライアントAPI接続エラー:', error.message);
        }
        
        try {
            const serviceResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
                method: 'GET',
                headers: {
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('  SERVICE API Status:', serviceResponse.status);
            if (serviceResponse.status === 200 || serviceResponse.status === 404) {
                console.log('  ✓ SERVICEクライアントAPI接続成功');
                serviceSuccess = true;
            } else {
                console.log('  ❌ SERVICEクライアントAPI接続失敗');
            }
        } catch (error) {
            console.log('  ❌ SERVICEクライアントAPI接続エラー:', error.message);
        }
        
        console.log('\n3. Auth エンドポイントテスト:');
        try {
            // Auth APIの確認
            const authResponse = await fetch(`${supabaseUrl}/auth/v1/health`, {
                headers: {
                    'apikey': supabaseAnonKey
                }
            });
            console.log('  Auth API Status:', authResponse.status);
            console.log('  ✓ Auth API接続確認');
        } catch (error) {
            console.log('  ⚠️  Auth API接続エラー:', error.message);
        }
        
        console.log('\n4. Storage エンドポイントテスト:');
        try {
            // Storage APIの確認
            const storageResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
                headers: {
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`
                }
            });
            console.log('  Storage API Status:', storageResponse.status);
            if (storageResponse.ok) {
                const buckets = await storageResponse.json();
                console.log('  ✓ Storage API接続成功');
                console.log('  既存バケット数:', buckets.length);
            }
        } catch (error) {
            console.log('  ⚠️  Storage API接続エラー:', error.message);
        }
        
        return anonSuccess && serviceSuccess;
        
    } catch (error) {
        console.log('❌ 基本テストエラー:', error.message);
        return false;
    }
}

// テスト実行
testBasicConnections().then(success => {
    console.log('\n=== テスト結果 ===');
    if (success) {
        console.log('✅ TC-BE-001-02: PASSED - Supabaseクライアント基本接続が正常に動作しています');
    } else {
        console.log('❌ TC-BE-001-02: FAILED - Supabaseクライアント基本接続に問題があります');
    }
}).catch(error => {
    console.log('\n=== テスト結果 ===');
    console.log('❌ TC-BE-001-02: FAILED - テスト実行中にエラーが発生しました:', error.message);
});