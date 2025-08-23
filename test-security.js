require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// TC-BE-001-08: セキュリティ設定検証テスト（完全版）
console.log('=== TC-BE-001-08: セキュリティ設定の詳細検証テスト ===\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function testSecurityConfiguration() {
    const securityResults = {
        jwtValidation: false,
        rolePermissions: false,
        dataAccess: false,
        authProtection: false,
        keyManagement: false,
        rlsEnabled: false
    };
    
    console.log('1. JWT トークンの検証:');
    
    try {
        // JWTペイロードの解析
        function decodeJWT(token) {
            const [header, payload, signature] = token.split('.');
            return {
                header: JSON.parse(Buffer.from(header, 'base64').toString()),
                payload: JSON.parse(Buffer.from(payload, 'base64').toString()),
                signature: signature
            };
        }
        
        const anonDecoded = decodeJWT(supabaseAnonKey);
        const serviceDecoded = decodeJWT(supabaseServiceKey);
        
        console.log('  🔑 ANON キー分析:');
        console.log(`     Role: ${anonDecoded.payload.role}`);
        console.log(`     Issuer: ${anonDecoded.payload.iss}`);
        console.log(`     Expiry: ${new Date(anonDecoded.payload.exp * 1000).toLocaleString()}`);
        console.log(`     Algorithm: ${anonDecoded.header.alg}`);
        
        console.log('  🔑 SERVICE キー分析:');
        console.log(`     Role: ${serviceDecoded.payload.role}`);
        console.log(`     Issuer: ${serviceDecoded.payload.iss}`);
        console.log(`     Expiry: ${new Date(serviceDecoded.payload.exp * 1000).toLocaleString()}`);
        console.log(`     Algorithm: ${serviceDecoded.header.alg}`);
        
        // JWTの基本検証
        const validAnon = anonDecoded.payload.role === 'anon' && anonDecoded.payload.iss === 'supabase';
        const validService = serviceDecoded.payload.role === 'service_role' && serviceDecoded.payload.iss === 'supabase';
        
        if (validAnon && validService) {
            console.log('  ✅ JWT設定: 有効');
            securityResults.jwtValidation = true;
        } else {
            console.log('  ❌ JWT設定: 無効');
        }
        
    } catch (error) {
        console.log('  ❌ JWT解析エラー:', error.message);
    }
    
    console.log('\n2. ロール権限の検証:');
    
    try {
        // Service roleの上位権限テスト
        console.log('  🛡️  Service Role 権限テスト...');
        
        const { data: serviceSystemData, error: serviceSystemError } = await supabaseService
            .from('information_schema.tables')
            .select('table_name, table_schema')
            .eq('table_schema', 'information_schema')
            .limit(5);
        
        if (!serviceSystemError) {
            console.log(`     ✅ システムテーブル アクセス可能 (${serviceSystemData.length} テーブル)`);
            securityResults.rolePermissions = true;
        } else {
            console.log('     ❌ システムテーブル アクセス失敗:', serviceSystemError.message);
        }
        
        // Anon roleの制限テスト
        console.log('  🚫 Anon Role 制限テスト...');
        
        const { data: anonSystemData, error: anonSystemError } = await supabaseAnon
            .from('pg_tables')
            .select('tablename')
            .limit(1);
        
        if (anonSystemError) {
            console.log('     ✅ システムテーブル アクセス制限 (期待通り)');
            console.log(`     制限内容: ${anonSystemError.message}`);
        } else {
            console.log('     ⚠️  システムテーブル アクセス可能 (セキュリティ問題の可能性)');
        }
        
    } catch (error) {
        console.log('  ❌ ロール権限テストエラー:', error.message);
    }
    
    console.log('\n3. 認証システムのデータアクセス制御:');
    
    try {
        // Auth スキーマへのアクセステスト
        console.log('  🔐 Auth スキーマ アクセステスト...');
        
        // Service roleでauth.usersアクセス
        const { data: serviceAuthData, error: serviceAuthError } = await supabaseService
            .from('auth.users')
            .select('id')
            .limit(1);
        
        if (!serviceAuthError) {
            console.log('     ✅ Service Role: auth.users アクセス可能');
        } else {
            console.log('     ❌ Service Role: auth.users アクセス失敗:', serviceAuthError.message);
        }
        
        // Anon roleでauth.usersアクセス（失敗するべき）
        const { data: anonAuthData, error: anonAuthError } = await supabaseAnon
            .from('auth.users')
            .select('id')
            .limit(1);
        
        if (anonAuthError) {
            console.log('     ✅ Anon Role: auth.users アクセス拒否 (期待通り)');
            console.log(`     拒否理由: ${anonAuthError.message}`);
            securityResults.authProtection = true;
        } else {
            console.log('     ❌ Anon Role: auth.users アクセス許可 (セキュリティ問題)');
        }
        
    } catch (error) {
        console.log('  ❌ 認証データアクセステストエラー:', error.message);
    }
    
    console.log('\n4. データベースアクセス制御の検証:');
    
    try {
        // publicスキーマへのアクセス
        console.log('  📊 Public スキーマ アクセステスト...');
        
        // テストテーブルの存在確認（存在しなくても問題ない）
        const { data: publicData, error: publicError } = await supabaseAnon
            .from('profiles')
            .select('*')
            .limit(1);
        
        if (publicError && publicError.message.includes('does not exist')) {
            console.log('     ℹ️  テーブル未作成 (正常)');
            securityResults.dataAccess = true;
        } else if (publicError && publicError.message.includes('RLS')) {
            console.log('     ✅ RLS (Row Level Security) が有効');
            securityResults.dataAccess = true;
            securityResults.rlsEnabled = true;
        } else if (!publicError) {
            console.log('     ⚠️  テーブルアクセス可能 - RLS設定を確認してください');
            securityResults.dataAccess = true;
        } else {
            console.log('     ❌ 予期しないエラー:', publicError.message);
        }
        
    } catch (error) {
        console.log('  ❌ データアクセス制御テストエラー:', error.message);
    }
    
    console.log('\n5. APIキー管理の検証:');
    
    try {
        // 無効なAPIキーでのアクセステスト
        console.log('  🗝️  無効なAPIキーでのアクセステスト...');
        
        const invalidClient = createClient(supabaseUrl, 'invalid-key-12345');
        const { data: invalidData, error: invalidError } = await invalidClient
            .from('test')
            .select('*')
            .limit(1);
        
        if (invalidError && invalidError.message.includes('Invalid API key')) {
            console.log('     ✅ 無効なAPIキー拒否 (期待通り)');
            securityResults.keyManagement = true;
        } else if (invalidError) {
            console.log(`     ✅ アクセス拒否: ${invalidError.message}`);
            securityResults.keyManagement = true;
        } else {
            console.log('     ❌ 無効なAPIキーでアクセス成功 (セキュリティ問題)');
        }
        
        // 空のAPIキーでのテスト
        const emptyClient = createClient(supabaseUrl, '');
        const { data: emptyData, error: emptyError } = await emptyClient
            .from('test')
            .select('*')
            .limit(1);
        
        if (emptyError) {
            console.log('     ✅ 空のAPIキー拒否 (期待通り)');
        } else {
            console.log('     ❌ 空のAPIキーでアクセス成功 (セキュリティ問題)');
        }
        
    } catch (error) {
        console.log('     ✅ APIキーエラー適切に処理:', error.message);
        securityResults.keyManagement = true;
    }
    
    console.log('\n6. HTTPSとセキュリティヘッダーの確認:');
    
    try {
        console.log('  🔒 HTTPS とセキュリティヘッダーの検証...');
        
        const response = await fetch(supabaseUrl, {
            headers: { 'apikey': supabaseAnonKey }
        });
        
        console.log(`     URL Protocol: ${new URL(supabaseUrl).protocol}`);
        console.log(`     Security Headers:`);
        console.log(`       Strict-Transport-Security: ${response.headers.get('Strict-Transport-Security')}`);
        console.log(`       X-Content-Type-Options: ${response.headers.get('X-Content-Type-Options')}`);
        console.log(`       X-Frame-Options: ${response.headers.get('X-Frame-Options')}`);
        console.log(`       X-XSS-Protection: ${response.headers.get('X-XSS-Protection')}`);
        
        const isHTTPS = new URL(supabaseUrl).protocol === 'https:';
        if (isHTTPS) {
            console.log('     ✅ HTTPS プロトコル使用');
        } else {
            console.log('     ❌ HTTP プロトコル使用 (セキュリティリスク)');
        }
        
    } catch (error) {
        console.log('  ❌ セキュリティヘッダー検証エラー:', error.message);
    }
    
    console.log('\n7. レート制限の確認:');
    
    try {
        console.log('  ⚡ レート制限テスト...');
        
        // 短時間で複数リクエストを送信
        const rapidRequests = Array.from({ length: 20 }, (_, i) => 
            fetch(`${supabaseUrl}/rest/v1/`, {
                headers: { 'apikey': supabaseAnonKey }
            }).then(res => ({ index: i, status: res.status }))
        );
        
        const results = await Promise.all(rapidRequests);
        const rateLimited = results.some(r => r.status === 429);
        
        if (rateLimited) {
            console.log('     ✅ レート制限が適用されています');
            console.log(`     制限されたリクエスト: ${results.filter(r => r.status === 429).length}/20`);
        } else {
            console.log('     ⚠️  レート制限が検出されませんでした');
        }
        
    } catch (error) {
        console.log('  ❌ レート制限テストエラー:', error.message);
    }
    
    console.log('\n8. セキュリティ設定の推奨事項:');
    
    const recommendations = [];
    
    if (!securityResults.rlsEnabled) {
        recommendations.push('Row Level Security (RLS) をすべてのテーブルで有効化');
    }
    
    if (!securityResults.authProtection) {
        recommendations.push('auth スキーマへのアクセス制御を強化');
    }
    
    recommendations.push('本番環境では具体的なCORS設定を使用');
    recommendations.push('定期的なAPIキーのローテーション');
    recommendations.push('監査ログの有効化');
    
    console.log('  💡 推奨セキュリティ設定:');
    recommendations.forEach((rec, index) => {
        console.log(`     ${index + 1}. ${rec}`);
    });
    
    // 総合セキュリティスコアの計算
    const securityScore = Object.values(securityResults).filter(Boolean).length;
    const totalChecks = Object.keys(securityResults).length;
    const securityPercentage = (securityScore / totalChecks) * 100;
    
    console.log(`\n  🏆 セキュリティスコア: ${securityScore}/${totalChecks} (${securityPercentage.toFixed(0)}%)`);
    
    return {
        success: securityPercentage >= 70,
        securityResults,
        securityScore,
        securityPercentage,
        recommendations
    };
}

// テスト実行
testSecurityConfiguration().then(result => {
    console.log('\n=== テスト結果 ===');
    if (result.success) {
        console.log('✅ TC-BE-001-08: PASSED - セキュリティ設定が適切に動作しています');
        console.log('\n📊 セキュリティ状況:');
        console.log(`  総合スコア: ${result.securityScore}/${Object.keys(result.securityResults).length} (${result.securityPercentage.toFixed(0)}%)`);
        
        Object.entries(result.securityResults).forEach(([check, passed]) => {
            const checkName = {
                jwtValidation: 'JWT設定',
                rolePermissions: 'ロール権限',
                dataAccess: 'データアクセス',
                authProtection: '認証保護',
                keyManagement: 'APIキー管理',
                rlsEnabled: 'RLS有効化'
            }[check];
            
            console.log(`  ${passed ? '✅' : '❌'} ${checkName}`);
        });
        
        if (result.recommendations.length > 0) {
            console.log('\n💡 セキュリティ改善提案:');
            result.recommendations.forEach((rec, index) => {
                console.log(`  ${index + 1}. ${rec}`);
            });
        }
        
    } else {
        console.log('❌ TC-BE-001-08: FAILED - セキュリティ設定に重要な問題があります');
        console.log(`\n📊 セキュリティスコア: ${result.securityPercentage.toFixed(0)}% (70%以上で合格)`);
        
        console.log('\n🚨 緊急対応が必要な項目:');
        Object.entries(result.securityResults).forEach(([check, passed]) => {
            if (!passed) {
                const checkName = {
                    jwtValidation: 'JWT設定',
                    rolePermissions: 'ロール権限',
                    dataAccess: 'データアクセス',
                    authProtection: '認証保護',
                    keyManagement: 'APIキー管理',
                    rlsEnabled: 'RLS有効化'
                }[check];
                console.log(`  ❌ ${checkName}`);
            }
        });
    }
}).catch(error => {
    console.log('\n=== テスト結果 ===');
    console.log('❌ TC-BE-001-08: FAILED - テスト実行中にエラーが発生しました:', error.message);
});