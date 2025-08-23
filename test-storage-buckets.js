require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// TC-BE-001-04: Storageバケット作成テスト
console.log('=== TC-BE-001-04: Storageバケット作成テスト ===\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStorageBuckets() {
    const requiredBuckets = [
        { name: 'avatars', expectedPublic: true, description: 'プロファイル画像' },
        { name: 'headers', expectedPublic: true, description: 'ヘッダー画像' },
        { name: 'posts', expectedPublic: false, description: '投稿メディア' },
        { name: 'temporary', expectedPublic: false, description: '一時ファイル' }
    ];
    
    console.log('1. バケット一覧の取得:');
    
    try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
            console.log('  ❌ バケット一覧取得エラー:', listError.message);
            return false;
        }
        
        console.log(`  ✅ バケット一覧取得成功 (${buckets.length}個のバケット)`);
        
        buckets.forEach(bucket => {
            console.log(`     - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
        });
        
        console.log('\n2. 必要なバケットの存在確認:');
        
        let allBucketsExist = true;
        
        for (const required of requiredBuckets) {
            const bucket = buckets.find(b => b.name === required.name);
            
            if (!bucket) {
                console.log(`  ❌ バケット "${required.name}" が見つかりません`);
                allBucketsExist = false;
                continue;
            }
            
            const publicMatch = bucket.public === required.expectedPublic;
            if (!publicMatch) {
                console.log(`  ⚠️  バケット "${required.name}": 公開設定が期待値と異なります`);
                console.log(`     期待: ${required.expectedPublic ? 'public' : 'private'}, 実際: ${bucket.public ? 'public' : 'private'}`);
            }
            
            console.log(`  ✅ バケット "${required.name}": ${required.description} (${bucket.public ? 'public' : 'private'})`);
        }
        
        console.log('\n3. バケット設定の詳細確認:');
        
        for (const required of requiredBuckets) {
            try {
                const { data: bucketInfo, error: infoError } = await supabase.storage.getBucket(required.name);
                
                if (infoError) {
                    console.log(`  ⚠️  バケット "${required.name}" の詳細取得エラー:`, infoError.message);
                    continue;
                }
                
                console.log(`  📁 バケット "${required.name}":`);
                console.log(`     - ID: ${bucketInfo.id}`);
                console.log(`     - 作成日: ${new Date(bucketInfo.created_at).toLocaleString()}`);
                console.log(`     - 更新日: ${new Date(bucketInfo.updated_at).toLocaleString()}`);
                console.log(`     - 公開設定: ${bucketInfo.public ? 'public' : 'private'}`);
                
                // ファイル数の確認
                const { data: files, error: filesError } = await supabase.storage
                    .from(required.name)
                    .list('', { limit: 1 });
                
                if (!filesError) {
                    console.log(`     - ファイル状態: アクセス可能`);
                }
                
            } catch (error) {
                console.log(`  ⚠️  バケット "${required.name}" の詳細確認エラー:`, error.message);
            }
        }
        
        console.log('\n4. バケット作成機能のテスト（テスト用バケット）:');
        
        const testBucketName = 'test-bucket-' + Date.now();
        
        try {
            // テスト用バケットを作成
            const { data: createData, error: createError } = await supabase.storage.createBucket(
                testBucketName,
                { public: false, fileSizeLimit: 1024 * 1024 } // 1MB制限
            );
            
            if (createError) {
                console.log('  ❌ テストバケット作成エラー:', createError.message);
            } else {
                console.log(`  ✅ テストバケット "${testBucketName}" 作成成功`);
                
                // テスト用バケットを削除
                const { error: deleteError } = await supabase.storage.deleteBucket(testBucketName);
                
                if (deleteError) {
                    console.log(`  ⚠️  テストバケット "${testBucketName}" 削除エラー:`, deleteError.message);
                } else {
                    console.log(`  ✅ テストバケット "${testBucketName}" 削除成功`);
                }
            }
            
        } catch (error) {
            console.log('  ❌ バケット作成テストエラー:', error.message);
        }
        
        return allBucketsExist;
        
    } catch (error) {
        console.log('❌ Storageテストエラー:', error.message);
        return false;
    }
}

// テスト実行
testStorageBuckets().then(success => {
    console.log('\n=== テスト結果 ===');
    if (success) {
        console.log('✅ TC-BE-001-04: PASSED - Storageバケットが適切に設定されています');
    } else {
        console.log('❌ TC-BE-001-04: FAILED - Storageバケットの設定に問題があります');
    }
}).catch(error => {
    console.log('\n=== テスト結果 ===');
    console.log('❌ TC-BE-001-04: FAILED - テスト実行中にエラーが発生しました:', error.message);
});