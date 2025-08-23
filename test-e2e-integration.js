require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// TC-BE-001-12: エンドツーエンド統合検証テスト（完全版）
console.log('=== TC-BE-001-12: エンドツーエンド統合検証テスト ===\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

async function runEndToEndIntegrationTest() {
    const integrationResults = {
        environmentSetup: false,
        clientInitialization: false,
        databaseConnectivity: false,
        storageOperations: false,
        authenticationFlow: false,
        crossComponentIntegration: false,
        performanceMetrics: false,
        securityValidation: false
    };
    
    const metrics = {
        totalStartTime: Date.now(),
        testTimes: {},
        errors: []
    };
    
    console.log('🚀 BE-001 完全統合ワークフローテスト開始\n');
    
    // 1. 環境セットアップの検証
    console.log('1. 📋 環境セットアップの検証:');
    const envTestStart = Date.now();
    
    try {
        console.log('  🔍 環境変数の存在確認...');
        
        const requiredEnvs = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'];
        const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
        
        if (missingEnvs.length === 0) {
            console.log('  ✅ すべての必要な環境変数が設定済み');
            
            // URL形式とキー形式の検証
            const urlValid = /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(supabaseUrl);
            const anonKeyValid = /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(supabaseAnonKey);
            const serviceKeyValid = /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(supabaseServiceKey);
            
            if (urlValid && anonKeyValid && serviceKeyValid) {
                console.log('  ✅ 環境変数の形式が正常');
                integrationResults.environmentSetup = true;
            } else {
                console.log('  ❌ 環境変数の形式に問題があります');
                metrics.errors.push('環境変数形式エラー');
            }
        } else {
            console.log(`  ❌ 不足している環境変数: ${missingEnvs.join(', ')}`);
            metrics.errors.push(`不足環境変数: ${missingEnvs.join(', ')}`);
        }
        
    } catch (error) {
        console.log(`  ❌ 環境セットアップエラー: ${error.message}`);
        metrics.errors.push(`環境セットアップ: ${error.message}`);
    }
    
    metrics.testTimes.environmentSetup = Date.now() - envTestStart;
    
    // 2. クライアント初期化の検証
    console.log('\n2. 🔧 Supabaseクライアント初期化:');
    const clientTestStart = Date.now();
    
    let supabaseAnon, supabaseService;
    
    try {
        console.log('  ⚡ ANONクライアント初期化...');
        supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
        console.log('  ✅ ANONクライアント初期化成功');
        
        console.log('  ⚡ SERVICEクライアント初期化...');
        supabaseService = createClient(supabaseUrl, supabaseServiceKey);
        console.log('  ✅ SERVICEクライアント初期化成功');
        
        integrationResults.clientInitialization = true;
        
    } catch (error) {
        console.log(`  ❌ クライアント初期化エラー: ${error.message}`);
        metrics.errors.push(`クライアント初期化: ${error.message}`);
    }
    
    metrics.testTimes.clientInitialization = Date.now() - clientTestStart;
    
    // 3. データベース接続性の検証
    console.log('\n3. 🗄️  データベース接続性テスト:');
    const dbTestStart = Date.now();
    
    try {
        console.log('  📡 基本接続テスト...');
        
        const { data: healthCheck, error: healthError } = await supabaseService
            .from('information_schema.tables')
            .select('count')
            .limit(1);
        
        if (!healthError) {
            console.log('  ✅ データベース基本接続成功');
            
            // PostgreSQL拡張機能の確認
            console.log('  🔧 拡張機能の確認...');
            
            const extensionTests = [
                { name: 'PostGIS', test: () => supabaseService.rpc('postgis_version') }
            ];
            
            let extensionCount = 0;
            for (const ext of extensionTests) {
                try {
                    const { data, error } = await ext.test();
                    if (!error) {
                        console.log(`    ✅ ${ext.name}: 動作確認済み`);
                        extensionCount++;
                    } else {
                        console.log(`    ⚠️  ${ext.name}: ${error.message}`);
                    }
                } catch (extError) {
                    console.log(`    ⚠️  ${ext.name}: ${extError.message}`);
                }
            }
            
            integrationResults.databaseConnectivity = true;
            
        } else {
            console.log(`  ❌ データベース接続エラー: ${healthError.message}`);
            metrics.errors.push(`データベース接続: ${healthError.message}`);
        }
        
    } catch (error) {
        console.log(`  ❌ データベーステストエラー: ${error.message}`);
        metrics.errors.push(`データベーステスト: ${error.message}`);
    }
    
    metrics.testTimes.databaseConnectivity = Date.now() - dbTestStart;
    
    // 4. Storage操作の統合テスト
    console.log('\n4. 📦 Storage統合操作テスト:');
    const storageTestStart = Date.now();
    
    try {
        console.log('  📋 バケット確認...');
        
        const { data: buckets, error: bucketError } = await supabaseService.storage.listBuckets();
        
        if (!bucketError && buckets) {
            const requiredBuckets = ['avatars', 'headers', 'posts', 'temporary'];
            const existingBuckets = buckets.map(b => b.name);
            const missingBuckets = requiredBuckets.filter(b => !existingBuckets.includes(b));
            
            if (missingBuckets.length === 0) {
                console.log(`  ✅ 必要なバケット確認済み (${buckets.length}個)`);
                
                // 実際のファイル操作テスト
                console.log('  📤 ファイルアップロードテスト...');
                
                const testFile = new Blob(['E2E Integration Test'], { type: 'text/plain' });
                const testFileName = `e2e-test-${Date.now()}.txt`;
                
                const { data: uploadData, error: uploadError } = await supabaseService.storage
                    .from('temporary')
                    .upload(testFileName, testFile);
                
                if (!uploadError) {
                    console.log('  ✅ ファイルアップロード成功');
                    
                    // ダウンロードテスト
                    console.log('  📥 ファイルダウンロードテスト...');
                    
                    const { data: downloadData, error: downloadError } = await supabaseService.storage
                        .from('temporary')
                        .download(testFileName);
                    
                    if (!downloadError) {
                        console.log('  ✅ ファイルダウンロード成功');
                        
                        // クリーンアップ
                        await supabaseService.storage.from('temporary').remove([testFileName]);
                        console.log('  ✅ テストファイル削除完了');
                        
                        integrationResults.storageOperations = true;
                    } else {
                        console.log(`  ❌ ダウンロードエラー: ${downloadError.message}`);
                        metrics.errors.push(`Storage ダウンロード: ${downloadError.message}`);
                    }
                } else {
                    console.log(`  ❌ アップロードエラー: ${uploadError.message}`);
                    metrics.errors.push(`Storage アップロード: ${uploadError.message}`);
                }
            } else {
                console.log(`  ❌ 不足バケット: ${missingBuckets.join(', ')}`);
                metrics.errors.push(`不足バケット: ${missingBuckets.join(', ')}`);
            }
        } else {
            console.log(`  ❌ バケット一覧エラー: ${bucketError?.message || '不明'}`);
            metrics.errors.push(`バケット一覧: ${bucketError?.message || '不明'}`);
        }
        
    } catch (error) {
        console.log(`  ❌ Storageテストエラー: ${error.message}`);
        metrics.errors.push(`Storageテスト: ${error.message}`);
    }
    
    metrics.testTimes.storageOperations = Date.now() - storageTestStart;
    
    // 5. 認証フローの検証
    console.log('\n5. 🔐 認証システム検証:');
    const authTestStart = Date.now();
    
    try {
        console.log('  🔑 認証エンドポイントの確認...');
        
        const authHealthResponse = await fetch(`${supabaseUrl}/auth/v1/health`, {
            headers: { 'apikey': supabaseAnonKey }
        });
        
        if (authHealthResponse.ok) {
            console.log('  ✅ 認証システム正常');
            
            // 権限分離の確認
            console.log('  🛡️  権限分離の確認...');
            
            const { data: anonData, error: anonError } = await supabaseAnon
                .from('auth.users')
                .select('id')
                .limit(1);
            
            if (anonError) {
                console.log('  ✅ ANON権限適切に制限されています');
                integrationResults.authenticationFlow = true;
            } else {
                console.log('  ⚠️  ANON権限が強すぎる可能性があります');
            }
            
        } else {
            console.log(`  ❌ 認証システムエラー: ${authHealthResponse.status}`);
            metrics.errors.push(`認証システム: HTTP ${authHealthResponse.status}`);
        }
        
    } catch (error) {
        console.log(`  ❌ 認証テストエラー: ${error.message}`);
        metrics.errors.push(`認証テスト: ${error.message}`);
    }
    
    metrics.testTimes.authenticationFlow = Date.now() - authTestStart;
    
    // 6. コンポーネント間統合の検証
    console.log('\n6. 🔄 コンポーネント間統合テスト:');
    const integrationTestStart = Date.now();
    
    try {
        console.log('  🧩 統合ワークフロー実行...');
        
        // データベース → Storage → 認証の連携テスト
        const workflowSteps = [];
        
        // Step 1: データベースから情報取得
        console.log('    1️⃣  データベース情報取得...');
        const { data: dbInfo, error: dbInfoError } = await supabaseService
            .from('information_schema.tables')
            .select('table_name, table_schema')
            .limit(5);
        
        if (!dbInfoError) {
            workflowSteps.push('データベース取得成功');
            console.log('      ✅ データベース情報取得成功');
        } else {
            console.log(`      ❌ データベース情報エラー: ${dbInfoError.message}`);
        }
        
        // Step 2: Storageの状態確認
        console.log('    2️⃣  Storage状態確認...');
        const { data: storageInfo, error: storageInfoError } = await supabaseService.storage.listBuckets();
        
        if (!storageInfoError) {
            workflowSteps.push('Storage確認成功');
            console.log('      ✅ Storage状態確認成功');
        } else {
            console.log(`      ❌ Storage状態エラー: ${storageInfoError.message}`);
        }
        
        // Step 3: 認証状態確認
        console.log('    3️⃣  認証状態確認...');
        const authCheckResponse = await fetch(`${supabaseUrl}/auth/v1/health`, {
            headers: { 'apikey': supabaseAnonKey }
        });
        
        if (authCheckResponse.ok) {
            workflowSteps.push('認証確認成功');
            console.log('      ✅ 認証状態確認成功');
        } else {
            console.log(`      ❌ 認証状態エラー: ${authCheckResponse.status}`);
        }
        
        if (workflowSteps.length >= 2) {
            console.log(`  ✅ 統合ワークフロー成功 (${workflowSteps.length}/3 ステップ)`);
            integrationResults.crossComponentIntegration = true;
        } else {
            console.log(`  ⚠️  統合ワークフロー部分成功 (${workflowSteps.length}/3 ステップ)`);
        }
        
    } catch (error) {
        console.log(`  ❌ 統合テストエラー: ${error.message}`);
        metrics.errors.push(`統合テスト: ${error.message}`);
    }
    
    metrics.testTimes.crossComponentIntegration = Date.now() - integrationTestStart;
    
    // 7. パフォーマンス指標の測定
    console.log('\n7. ⚡ パフォーマンス指標測定:');
    const perfTestStart = Date.now();
    
    try {
        console.log('  📊 応答時間測定...');
        
        const performanceTests = [
            {
                name: 'データベースクエリ',
                test: () => supabaseService.from('information_schema.tables').select('count').limit(1)
            },
            {
                name: 'Storage一覧取得',
                test: () => supabaseService.storage.listBuckets()
            }
        ];
        
        const performanceResults = [];
        
        for (const perfTest of performanceTests) {
            const startTime = Date.now();
            try {
                const { error } = await perfTest.test();
                const responseTime = Date.now() - startTime;
                
                console.log(`    ${perfTest.name}: ${responseTime}ms ${responseTime < 2000 ? '✅' : '⚠️'}`);
                performanceResults.push({
                    name: perfTest.name,
                    time: responseTime,
                    success: !error
                });
            } catch (error) {
                console.log(`    ${perfTest.name}: エラー ❌`);
                performanceResults.push({
                    name: perfTest.name,
                    error: error.message,
                    success: false
                });
            }
        }
        
        const avgResponseTime = performanceResults
            .filter(r => r.time)
            .reduce((sum, r) => sum + r.time, 0) / performanceResults.filter(r => r.time).length;
        
        console.log(`  📈 平均応答時間: ${avgResponseTime.toFixed(0)}ms`);
        
        if (avgResponseTime < 3000) {
            console.log('  ✅ パフォーマンス良好');
            integrationResults.performanceMetrics = true;
        } else {
            console.log('  ⚠️  パフォーマンス要改善');
        }
        
    } catch (error) {
        console.log(`  ❌ パフォーマンステストエラー: ${error.message}`);
        metrics.errors.push(`パフォーマンス: ${error.message}`);
    }
    
    metrics.testTimes.performanceMetrics = Date.now() - perfTestStart;
    
    // 8. セキュリティ検証
    console.log('\n8. 🔒 セキュリティ統合検証:');
    const secTestStart = Date.now();
    
    try {
        console.log('  🛡️  セキュリティチェック...');
        
        // HTTPS使用確認
        const httpsUsed = supabaseUrl.startsWith('https://');
        console.log(`    HTTPS使用: ${httpsUsed ? '✅' : '❌'}`);
        
        // 認証制限確認
        const { data: restrictedData, error: restrictedError } = await supabaseAnon
            .from('auth.users')
            .select('id')
            .limit(1);
        
        const authRestricted = !!restrictedError;
        console.log(`    認証制限: ${authRestricted ? '✅' : '❌'}`);
        
        // APIキー形式確認
        const validApiKeys = supabaseAnonKey.length > 100 && supabaseServiceKey.length > 100;
        console.log(`    APIキー形式: ${validApiKeys ? '✅' : '❌'}`);
        
        const securityScore = [httpsUsed, authRestricted, validApiKeys].filter(Boolean).length;
        
        if (securityScore >= 2) {
            console.log(`  ✅ セキュリティ検証成功 (${securityScore}/3)`);
            integrationResults.securityValidation = true;
        } else {
            console.log(`  ⚠️  セキュリティ要改善 (${securityScore}/3)`);
        }
        
    } catch (error) {
        console.log(`  ❌ セキュリティテストエラー: ${error.message}`);
        metrics.errors.push(`セキュリティ: ${error.message}`);
    }
    
    metrics.testTimes.securityValidation = Date.now() - secTestStart;
    
    // 結果の集計
    const totalTime = Date.now() - metrics.totalStartTime;
    const passedTests = Object.values(integrationResults).filter(Boolean).length;
    const totalTests = Object.keys(integrationResults).length;
    const successRate = (passedTests / totalTests) * 100;
    
    console.log('\n' + '='.repeat(70));
    console.log('🎯 エンドツーエンド統合テスト結果まとめ');
    console.log('='.repeat(70));
    
    Object.entries(integrationResults).forEach(([test, passed]) => {
        const testName = {
            environmentSetup: '環境セットアップ',
            clientInitialization: 'クライアント初期化',
            databaseConnectivity: 'データベース接続',
            storageOperations: 'Storage操作',
            authenticationFlow: '認証フロー',
            crossComponentIntegration: 'コンポーネント間統合',
            performanceMetrics: 'パフォーマンス指標',
            securityValidation: 'セキュリティ検証'
        }[test];
        
        const testTime = metrics.testTimes[test] ? ` (${metrics.testTimes[test]}ms)` : '';
        console.log(`${passed ? '✅' : '❌'} ${testName}${testTime}`);
    });
    
    console.log(`\n📊 統合テスト成功率: ${passedTests}/${totalTests} (${successRate.toFixed(0)}%)`);
    console.log(`⏱️  総実行時間: ${totalTime}ms`);
    
    if (metrics.errors.length > 0) {
        console.log(`\n⚠️  発生したエラー (${metrics.errors.length}件):`);
        metrics.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
        });
    }
    
    return {
        success: successRate >= 75, // 75%以上で合格
        integrationResults,
        metrics,
        passedTests,
        totalTests,
        successRate,
        totalTime
    };
}

// テスト実行
runEndToEndIntegrationTest().then(result => {
    console.log('\n' + '='.repeat(70));
    console.log('🏁 TC-BE-001-12 テスト結果');
    console.log('='.repeat(70));
    
    if (result.success) {
        console.log('✅ TC-BE-001-12: PASSED - エンドツーエンド統合が正常に動作しています');
        console.log('\n🎉 BE-001: Supabaseプロジェクト初期設定 - 統合テスト完了!');
        console.log(`📈 統合成功率: ${result.successRate.toFixed(0)}%`);
        console.log(`⏱️  総実行時間: ${(result.totalTime / 1000).toFixed(1)}秒`);
        
        console.log('\n🚀 次のステップ:');
        console.log('  1. BE-002: データベーススキーマ実装の準備完了');
        console.log('  2. 必要に応じてPostgreSQL拡張機能の手動有効化');
        console.log('  3. Storage RLSポリシーの詳細設定');
        console.log('  4. 本番環境での追加セキュリティ設定');
        
    } else {
        console.log('❌ TC-BE-001-12: FAILED - エンドツーエンド統合に問題があります');
        console.log(`📊 統合成功率: ${result.successRate.toFixed(0)}% (75%以上で合格)`);
        
        console.log('\n🔧 修正が必要な項目:');
        Object.entries(result.integrationResults).forEach(([test, passed]) => {
            if (!passed) {
                const testName = {
                    environmentSetup: '環境セットアップ',
                    clientInitialization: 'クライアント初期化',
                    databaseConnectivity: 'データベース接続',
                    storageOperations: 'Storage操作',
                    authenticationFlow: '認証フロー',
                    crossComponentIntegration: 'コンポーネント間統合',
                    performanceMetrics: 'パフォーマンス指標',
                    securityValidation: 'セキュリティ検証'
                }[test];
                console.log(`  ❌ ${testName}`);
            }
        });
        
        console.log('\n💡 推奨修正アクション:');
        console.log('  1. 失敗したコンポーネントの個別確認');
        console.log('  2. 環境変数とSupabase設定の再確認');
        console.log('  3. ネットワーク接続とファイアウォール設定の確認');
        console.log('  4. Supabaseプロジェクトの状態確認');
    }
}).catch(error => {
    console.log('\n=== テスト結果 ===');
    console.log('❌ TC-BE-001-12: FAILED - テスト実行中に重大なエラーが発生しました:', error.message);
    console.log('\n🚨 緊急対応が必要です。環境設定を確認してください。');
});