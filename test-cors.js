require('dotenv').config();

// TC-BE-001-07: CORS設定の詳細検証テスト
console.log('=== TC-BE-001-07: CORS設定の詳細検証テスト ===\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

async function testCORSConfiguration() {
    console.log('1. 基本的なCORS設定の確認:');
    
    const testOrigins = [
        'http://localhost:3000',
        'http://localhost:8080', 
        'http://127.0.0.1:3000',
        'https://localhost:3000',
        'https://example.com',
        'null' // ファイルからのアクセスのシミュレーション
    ];
    
    const corsResults = [];
    
    for (const origin of testOrigins) {
        try {
            console.log(`  🌐 Origin: ${origin} をテスト中...`);
            
            const headers = {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json'
            };
            
            if (origin !== 'null') {
                headers['Origin'] = origin;
            }
            
            const response = await fetch(`${supabaseUrl}/rest/v1/`, {
                method: 'GET',
                headers: headers
            });
            
            const corsHeaders = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Expose-Headers': response.headers.get('Access-Control-Expose-Headers')
            };
            
            console.log(`     Status: ${response.status}`);
            console.log(`     CORS Headers:`, corsHeaders);
            
            corsResults.push({
                origin,
                status: response.status,
                success: response.status === 200 || response.status === 404,
                corsHeaders
            });
            
        } catch (error) {
            console.log(`     ❌ エラー: ${error.message}`);
            corsResults.push({
                origin,
                success: false,
                error: error.message
            });
        }
    }
    
    console.log('\n2. プリフライトリクエスト（OPTIONS）のテスト:');
    
    const preflightOrigins = ['http://localhost:3000', 'https://example.com'];
    
    for (const origin of preflightOrigins) {
        try {
            console.log(`  ✈️  Origin: ${origin} プリフライトリクエスト...`);
            
            const preflightResponse = await fetch(`${supabaseUrl}/rest/v1/test`, {
                method: 'OPTIONS',
                headers: {
                    'Origin': origin,
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'apikey, authorization, content-type'
                }
            });
            
            console.log(`     プリフライト Status: ${preflightResponse.status}`);
            console.log(`     Allow-Origin: ${preflightResponse.headers.get('Access-Control-Allow-Origin')}`);
            console.log(`     Allow-Methods: ${preflightResponse.headers.get('Access-Control-Allow-Methods')}`);
            console.log(`     Allow-Headers: ${preflightResponse.headers.get('Access-Control-Allow-Headers')}`);
            
        } catch (error) {
            console.log(`     ❌ プリフライトエラー: ${error.message}`);
        }
    }
    
    console.log('\n3. 異なるHTTPメソッドのCORSテスト:');
    
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const testOrigin = 'http://localhost:3000';
    
    for (const method of methods) {
        try {
            console.log(`  📬 Method: ${method} テスト中...`);
            
            let requestOptions = {
                method: method,
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                    'Content-Type': 'application/json',
                    'Origin': testOrigin
                }
            };
            
            // POSTやPUTの場合はボディを追加
            if (['POST', 'PUT', 'PATCH'].includes(method)) {
                requestOptions.body = JSON.stringify({ test: 'data' });
            }
            
            const response = await fetch(`${supabaseUrl}/rest/v1/test`, requestOptions);
            
            console.log(`     ${method} Status: ${response.status}`);
            console.log(`     Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);
            
        } catch (error) {
            console.log(`     ❌ ${method} エラー: ${error.message}`);
        }
    }
    
    console.log('\n4. Storage APIのCORSテスト:');
    
    try {
        console.log('  📦 Storage API CORS テスト中...');
        
        const storageResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
            method: 'GET',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Origin': 'http://localhost:3000'
            }
        });
        
        console.log(`     Storage Status: ${storageResponse.status}`);
        console.log(`     Storage CORS Allow-Origin: ${storageResponse.headers.get('Access-Control-Allow-Origin')}`);
        
    } catch (error) {
        console.log(`     ❌ Storage CORS エラー: ${error.message}`);
    }
    
    console.log('\n5. Auth APIのCORSテスト:');
    
    try {
        console.log('  🔐 Auth API CORS テスト中...');
        
        const authResponse = await fetch(`${supabaseUrl}/auth/v1/health`, {
            method: 'GET',
            headers: {
                'apikey': supabaseAnonKey,
                'Origin': 'http://localhost:3000'
            }
        });
        
        console.log(`     Auth Status: ${authResponse.status}`);
        console.log(`     Auth CORS Allow-Origin: ${authResponse.headers.get('Access-Control-Allow-Origin')}`);
        
    } catch (error) {
        console.log(`     ❌ Auth CORS エラー: ${error.message}`);
    }
    
    console.log('\n6. 不正なOriginからのアクセステスト:');
    
    const maliciousOrigins = [
        'https://malicious-site.com',
        'http://evil.example.com',
        'https://phishing-site.net'
    ];
    
    for (const maliciousOrigin of maliciousOrigins) {
        try {
            console.log(`  🚫 悪意のあるOrigin: ${maliciousOrigin}`);
            
            const maliciousResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
                method: 'GET',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                    'Origin': maliciousOrigin
                }
            });
            
            const allowOrigin = maliciousResponse.headers.get('Access-Control-Allow-Origin');
            
            if (allowOrigin === maliciousOrigin) {
                console.log(`     ⚠️  警告: 悪意のあるOriginが許可されています`);
            } else if (allowOrigin === '*') {
                console.log(`     ⚠️  警告: ワイルドカード許可（セキュリティリスク）`);
            } else {
                console.log(`     ✅ 適切にブロック/制限されています`);
            }
            
        } catch (error) {
            console.log(`     ✅ アクセス拒否（期待通り）: ${error.message}`);
        }
    }
    
    console.log('\n7. CORS設定の推奨事項チェック:');
    
    const recommendations = [];
    
    // 成功したoriginの確認
    const successfulOrigins = corsResults.filter(r => r.success).map(r => r.origin);
    
    if (successfulOrigins.length > 0) {
        console.log('  ✅ 許可されているOrigins:', successfulOrigins);
    }
    
    // ワイルドカード使用の確認
    const hasWildcard = corsResults.some(r => 
        r.corsHeaders && r.corsHeaders['Access-Control-Allow-Origin'] === '*'
    );
    
    if (hasWildcard) {
        console.log('  ⚠️  ワイルドカード（*）が使用されています - 本番環境では非推奨');
        recommendations.push('本番環境では具体的なドメインを指定してください');
    } else {
        console.log('  ✅ ワイルドカードは使用されていません');
    }
    
    // 推奨設定の提案
    console.log('\n  💡 推奨CORS設定:');
    console.log('     開発環境: http://localhost:*, http://127.0.0.1:*, exp://*');
    console.log('     本番環境: https://yourdomain.com のみ');
    
    // 評価
    const corsWorking = corsResults.some(r => r.success);
    const securityGood = !hasWildcard || corsResults.length <= 3;
    
    return {
        success: corsWorking && securityGood,
        corsResults,
        recommendations,
        metrics: {
            workingOrigins: successfulOrigins.length,
            hasWildcard,
            securityScore: securityGood ? 'Good' : 'Needs Improvement'
        }
    };
}

// テスト実行
testCORSConfiguration().then(result => {
    console.log('\n=== テスト結果 ===');
    if (result.success) {
        console.log('✅ TC-BE-001-07: PASSED - CORS設定が適切に動作しています');
        console.log('\n📊 CORS設定状況:');
        console.log(`  動作中のOrigins: ${result.metrics.workingOrigins}個`);
        console.log(`  ワイルドカード使用: ${result.metrics.hasWildcard ? 'はい' : 'いいえ'}`);
        console.log(`  セキュリティスコア: ${result.metrics.securityScore}`);
        
        if (result.recommendations.length > 0) {
            console.log('\n💡 改善提案:');
            result.recommendations.forEach((rec, index) => {
                console.log(`  ${index + 1}. ${rec}`);
            });
        }
    } else {
        console.log('❌ TC-BE-001-07: FAILED - CORS設定に問題があります');
        console.log('\n💡 修正方法:');
        console.log('  1. Supabaseダッシュボード > Settings > API > CORS Origins');
        console.log('  2. 開発環境用のOriginを追加:');
        console.log('     - http://localhost:*');
        console.log('     - http://127.0.0.1:*'); 
        console.log('     - exp://* (React Native/Expo用)');
        console.log('  3. 本番環境では具体的なドメインのみを指定');
    }
}).catch(error => {
    console.log('\n=== テスト結果 ===');
    console.log('❌ TC-BE-001-07: FAILED - テスト実行中にエラーが発生しました:', error.message);
});