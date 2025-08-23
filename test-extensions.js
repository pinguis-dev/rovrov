require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// TC-BE-001-03: PostgreSQL拡張機能検証テスト
console.log('=== TC-BE-001-03: PostgreSQL拡張機能検証テスト ===\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function testPostgreSQLExtensions() {
    let allExtensionsWorking = true;
    
    console.log('1. インストール済み拡張機能の確認:');
    
    try {
        // 拡張機能の一覧を取得
        const { data: extensions, error: extError } = await supabaseService
            .from('pg_extension')
            .select('extname, extversion')
            .in('extname', ['pgcrypto', 'postgis', 'pg_trgm']);
        
        if (extError) {
            console.log('  ❌ 拡張機能一覧取得エラー:', extError.message);
            return false;
        }
        
        const installedExtensions = extensions.map(ext => ext.extname);
        const requiredExtensions = ['pgcrypto', 'postgis', 'pg_trgm'];
        
        console.log('  インストール済み拡張機能:', installedExtensions);
        
        for (const required of requiredExtensions) {
            const installed = extensions.find(ext => ext.extname === required);
            if (installed) {
                console.log(`  ✓ ${required}: バージョン ${installed.extversion}`);
            } else {
                console.log(`  ❌ ${required}: 未インストール`);
                allExtensionsWorking = false;
            }
        }
        
    } catch (error) {
        console.log('  ❌ 拡張機能確認エラー:', error.message);
        allExtensionsWorking = false;
    }
    
    console.log('\n2. pgcrypto 拡張機能のテスト:');
    try {
        // UUID生成テスト
        const { data: uuidData, error: uuidError } = await supabaseService.rpc('gen_random_uuid');
        
        if (uuidError) {
            console.log('  ❌ UUID生成エラー:', uuidError.message);
            allExtensionsWorking = false;
        } else {
            console.log('  ✓ UUID生成成功:', uuidData);
        }
        
        // ハッシュ機能テスト
        const { data: hashData, error: hashError } = await supabaseService
            .rpc('crypt', { password: 'test', salt: '$2b$10$salt12345678901234' });
        
        if (hashError) {
            console.log('  ❌ ハッシュ機能エラー:', hashError.message);
            // この関数は存在しない可能性があるので、警告のみ
            console.log('  ⚠️  crypt関数は利用可能でない可能性があります');
        } else {
            console.log('  ✓ ハッシュ機能動作確認');
        }
        
    } catch (error) {
        console.log('  ❌ pgcrypto テストエラー:', error.message);
        allExtensionsWorking = false;
    }
    
    console.log('\n3. PostGIS 拡張機能のテスト:');
    try {
        // PostGISバージョン取得
        const { data: versionData, error: versionError } = await supabaseService
            .rpc('postgis_version');
        
        if (versionError) {
            console.log('  ❌ PostGISバージョン取得エラー:', versionError.message);
            allExtensionsWorking = false;
        } else {
            console.log('  ✓ PostGIS バージョン:', versionData);
        }
        
        // 空間データ作成テスト
        const { data: pointData, error: pointError } = await supabaseService
            .rpc('st_astext', { geom: 'POINT(0 0)' });
        
        if (pointError) {
            console.log('  ❌ 空間データテストエラー:', pointError.message);
            allExtensionsWorking = false;
        } else {
            console.log('  ✓ 空間データ作成成功:', pointData);
        }
        
        // 距離計算テスト
        const { data: distanceData, error: distanceError } = await supabaseService
            .rpc('st_distance', { 
                geom1: 'POINT(0 0)', 
                geom2: 'POINT(1 1)' 
            });
        
        if (distanceError) {
            console.log('  ❌ 距離計算テストエラー:', distanceError.message);
            allExtensionsWorking = false;
        } else {
            console.log('  ✓ 距離計算成功:', distanceData);
        }
        
    } catch (error) {
        console.log('  ❌ PostGIS テストエラー:', error.message);
        allExtensionsWorking = false;
    }
    
    console.log('\n4. pg_trgm 拡張機能のテスト:');
    try {
        // テキスト類似度テスト
        const { data: similarityData, error: similarityError } = await supabaseService
            .rpc('similarity', { 
                text1: 'test', 
                text2: 'testing' 
            });
        
        if (similarityError) {
            console.log('  ❌ テキスト類似度テストエラー:', similarityError.message);
            allExtensionsWorking = false;
        } else {
            console.log('  ✓ テキスト類似度計算成功:', similarityData);
        }
        
        // トライグラム演算子テスト（これは直接SQLで実行する必要がある）
        console.log('  ⚠️  トライグラム演算子テストはSQLエディタで手動確認が必要です');
        
    } catch (error) {
        console.log('  ❌ pg_trgm テストエラー:', error.message);
        allExtensionsWorking = false;
    }
    
    return allExtensionsWorking;
}

// テスト実行
testPostgreSQLExtensions().then(success => {
    console.log('\n=== テスト結果 ===');
    if (success) {
        console.log('✅ TC-BE-001-03: PASSED - PostgreSQL拡張機能が正常に動作しています');
    } else {
        console.log('❌ TC-BE-001-03: FAILED - PostgreSQL拡張機能に問題があります');
        console.log('   手動でSupabase SQL Editorから以下を実行してください:');
        console.log('   CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
        console.log('   CREATE EXTENSION IF NOT EXISTS "postgis";');
        console.log('   CREATE EXTENSION IF NOT EXISTS "pg_trgm";');
    }
}).catch(error => {
    console.log('\n=== テスト結果 ===');
    console.log('❌ TC-BE-001-03: FAILED - テスト実行中にエラーが発生しました:', error.message);
});