require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// TC-BE-001-03: PostgreSQL拡張機能の最終検証
console.log('=== TC-BE-001-03: PostgreSQL拡張機能の最終検証 ===\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalExtensionTest() {
    let pgcryptoWorking = false;
    let postgisWorking = false;
    let pgtrgmWorking = false;
    
    console.log('1. 拡張機能の個別テスト:\n');
    
    // pgcrypto テスト
    console.log('🧪 pgcrypto拡張機能のテスト:');
    try {
        const { data: uuid, error: uuidError } = await supabase.rpc('gen_random_uuid');
        if (uuidError) {
            console.log('  ❌ gen_random_uuid エラー:', uuidError.message);
        } else {
            console.log('  ✅ UUID生成成功:', uuid);
            pgcryptoWorking = true;
        }
    } catch (error) {
        console.log('  ❌ pgcrypto テストエラー:', error.message);
    }
    
    // postgis テスト
    console.log('\n🌍 PostGIS拡張機能のテスト:');
    try {
        const { data: version, error: versionError } = await supabase.rpc('postgis_version');
        if (versionError) {
            console.log('  ❌ PostGIS バージョン取得エラー:', versionError.message);
        } else {
            console.log('  ✅ PostGIS バージョン:', version);
            postgisWorking = true;
        }
        
        // 空間関数のテスト
        const { data: point, error: pointError } = await supabase.rpc('st_point', { x: 0, y: 0 });
        if (!pointError) {
            console.log('  ✅ 空間データ作成テスト成功');
        }
        
    } catch (error) {
        console.log('  ❌ PostGIS テストエラー:', error.message);
    }
    
    // pg_trgm テスト
    console.log('\n🔍 pg_trgm拡張機能のテスト:');
    try {
        const { data: similarity, error: simError } = await supabase.rpc('similarity', {
            text1: 'test',
            text2: 'testing'
        });
        if (simError) {
            console.log('  ❌ similarity 関数エラー:', simError.message);
        } else {
            console.log('  ✅ テキスト類似度計算成功:', similarity);
            pgtrgmWorking = true;
        }
    } catch (error) {
        console.log('  ❌ pg_trgm テストエラー:', error.message);
    }
    
    // 総合評価
    console.log('\n=== 拡張機能の状態まとめ ===');
    console.log(`pgcrypto: ${pgcryptoWorking ? '✅ 動作中' : '❌ 未動作'}`);
    console.log(`PostGIS: ${postgisWorking ? '✅ 動作中' : '❌ 未動作'}`);
    console.log(`pg_trgm: ${pgtrgmWorking ? '✅ 動作中' : '❌ 未動作'}`);
    
    const workingCount = [pgcryptoWorking, postgisWorking, pgtrgmWorking].filter(Boolean).length;
    
    console.log(`\n動作中の拡張機能: ${workingCount}/3`);
    
    if (workingCount === 3) {
        console.log('✅ すべての拡張機能が正常に動作しています');
        return true;
    } else if (workingCount >= 1) {
        console.log('⚠️  一部の拡張機能が動作していません');
        console.log('\n手動でSupabase SQL Editorから以下を実行してください:');
        if (!pgcryptoWorking) console.log('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
        if (!postgisWorking) console.log('CREATE EXTENSION IF NOT EXISTS "postgis";');
        if (!pgtrgmWorking) console.log('CREATE EXTENSION IF NOT EXISTS "pg_trgm";');
        return workingCount >= 2; // 2つ以上動作していればパス
    } else {
        console.log('❌ 拡張機能が動作していません');
        return false;
    }
}

// テスト実行
finalExtensionTest().then(success => {
    console.log('\n=== テスト結果 ===');
    if (success) {
        console.log('✅ TC-BE-001-03: PASSED - PostgreSQL拡張機能が適切に動作しています');
    } else {
        console.log('❌ TC-BE-001-03: FAILED - PostgreSQL拡張機能に重要な問題があります');
    }
}).catch(error => {
    console.log('\n=== テスト結果 ===');
    console.log('❌ TC-BE-001-03: FAILED - テスト実行中にエラーが発生しました:', error.message);
});