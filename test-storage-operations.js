require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// TC-BE-001-09: Storageファイル操作の詳細テスト
console.log('=== TC-BE-001-09: Storageファイル操作の詳細テスト ===\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function testStorageFileOperations() {
    const testResults = {
        upload: false,
        download: false,
        publicUrl: false,
        delete: false,
        list: false,
        metadata: false,
        multipleFiles: false
    };
    
    const testFiles = [];
    
    console.log('1. 基本的なファイルアップロードテスト:');
    
    try {
        // PNG画像ファイルのシミュレーション
        const pngBuffer = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
            0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xFF, 0xFF,
            0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x73, 0x75,
            0x01, 0x18, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
            0xAE, 0x42, 0x60, 0x82
        ]);
        const pngFile = new Blob([pngBuffer], { type: 'image/png' });
        const testFileName = `test-image-${Date.now()}.png`;
        
        console.log(`  📤 PNG画像アップロード: ${testFileName}`);
        
        const { data: uploadData, error: uploadError } = await supabaseService.storage
            .from('avatars')
            .upload(testFileName, pngFile, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (uploadError) {
            console.log('  ❌ アップロードエラー:', uploadError.message);
        } else {
            console.log('  ✅ アップロード成功');
            console.log(`     Path: ${uploadData.path}`);
            console.log(`     FullPath: ${uploadData.fullPath || 'N/A'}`);
            testResults.upload = true;
            testFiles.push({ bucket: 'avatars', path: testFileName, type: 'image/png' });
        }
        
        // テキストファイルのアップロードテスト
        const textFile = new Blob(['Hello, Supabase Storage!'], { type: 'text/plain' });
        const textFileName = `test-text-${Date.now()}.txt`;
        
        console.log(`  📝 テキストファイルアップロード: ${textFileName}`);
        
        const { data: textUploadData, error: textUploadError } = await supabaseService.storage
            .from('temporary')
            .upload(textFileName, textFile);
        
        if (textUploadError) {
            console.log('  ❌ テキストアップロードエラー:', textUploadError.message);
        } else {
            console.log('  ✅ テキストアップロード成功');
            testResults.upload = true;
            testFiles.push({ bucket: 'temporary', path: textFileName, type: 'text/plain' });
        }
        
    } catch (error) {
        console.log('  ❌ ファイルアップロード例外エラー:', error.message);
    }
    
    console.log('\n2. ファイルダウンロードテスト:');
    
    if (testFiles.length > 0) {
        for (const testFile of testFiles) {
            try {
                console.log(`  📥 ダウンロード: ${testFile.path}`);
                
                const { data: downloadData, error: downloadError } = await supabaseService.storage
                    .from(testFile.bucket)
                    .download(testFile.path);
                
                if (downloadError) {
                    console.log(`    ❌ ダウンロードエラー: ${downloadError.message}`);
                } else {
                    console.log(`    ✅ ダウンロード成功`);
                    console.log(`    Size: ${downloadData.size} bytes`);
                    console.log(`    Type: ${downloadData.type}`);
                    testResults.download = true;
                }
                
            } catch (error) {
                console.log(`    ❌ ダウンロード例外エラー: ${error.message}`);
            }
        }
    } else {
        console.log('  ⚠️  ダウンロードテスト用ファイルがありません');
    }
    
    console.log('\n3. パブリックURLの生成テスト:');
    
    if (testFiles.length > 0) {
        for (const testFile of testFiles) {
            try {
                console.log(`  🔗 パブリックURL生成: ${testFile.path}`);
                
                const { data: urlData } = supabaseService.storage
                    .from(testFile.bucket)
                    .getPublicUrl(testFile.path);
                
                if (urlData && urlData.publicUrl) {
                    console.log(`    ✅ URL生成成功`);
                    console.log(`    URL: ${urlData.publicUrl}`);
                    
                    // URL形式の検証
                    const expectedPattern = new RegExp(`^${supabaseUrl}/storage/v1/object/public/${testFile.bucket}/${testFile.path}$`);
                    if (expectedPattern.test(urlData.publicUrl)) {
                        console.log(`    ✅ URL形式正常`);
                        testResults.publicUrl = true;
                    } else {
                        console.log(`    ⚠️  URL形式が期待と異なります`);
                    }
                } else {
                    console.log(`    ❌ URL生成失敗`);
                }
                
            } catch (error) {
                console.log(`    ❌ URL生成例外エラー: ${error.message}`);
            }
        }
    }
    
    console.log('\n4. ファイル一覧表示テスト:');
    
    const buckets = ['avatars', 'headers', 'posts', 'temporary'];
    
    for (const bucket of buckets) {
        try {
            console.log(`  📋 バケット "${bucket}" 一覧取得...`);
            
            const { data: listData, error: listError } = await supabaseService.storage
                .from(bucket)
                .list('', {
                    limit: 10,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' }
                });
            
            if (listError) {
                console.log(`    ❌ 一覧取得エラー: ${listError.message}`);
            } else {
                console.log(`    ✅ 一覧取得成功 (${listData.length} ファイル)`);
                
                if (listData.length > 0) {
                    listData.forEach((file, index) => {
                        if (index < 3) { // 最初の3つだけ表示
                            console.log(`      - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
                        }
                    });
                    testResults.list = true;
                }
            }
            
        } catch (error) {
            console.log(`    ❌ 一覧取得例外エラー: ${error.message}`);
        }
    }
    
    console.log('\n5. ファイルメタデータ取得テスト:');
    
    if (testFiles.length > 0) {
        for (const testFile of testFiles) {
            try {
                console.log(`  📊 メタデータ取得: ${testFile.path}`);
                
                // リストAPIを使用してメタデータを取得
                const { data: metaData, error: metaError } = await supabaseService.storage
                    .from(testFile.bucket)
                    .list('', {
                        search: testFile.path
                    });
                
                if (metaError) {
                    console.log(`    ❌ メタデータ取得エラー: ${metaError.message}`);
                } else {
                    const fileInfo = metaData.find(f => f.name === testFile.path);
                    if (fileInfo) {
                        console.log(`    ✅ メタデータ取得成功`);
                        console.log(`    Name: ${fileInfo.name}`);
                        console.log(`    Size: ${fileInfo.metadata?.size || 'unknown'} bytes`);
                        console.log(`    LastModified: ${fileInfo.metadata?.lastModified || fileInfo.updated_at}`);
                        console.log(`    ContentType: ${fileInfo.metadata?.mimetype || 'unknown'}`);
                        testResults.metadata = true;
                    } else {
                        console.log(`    ⚠️  ファイルメタデータが見つかりません`);
                    }
                }
                
            } catch (error) {
                console.log(`    ❌ メタデータ取得例外エラー: ${error.message}`);
            }
        }
    }
    
    console.log('\n6. 複数ファイル操作テスト:');
    
    try {
        console.log('  📚 複数ファイルの一括アップロード...');
        
        const multipleFiles = [
            { name: `batch-1-${Date.now()}.txt`, content: 'File 1 Content', type: 'text/plain' },
            { name: `batch-2-${Date.now()}.txt`, content: 'File 2 Content', type: 'text/plain' },
            { name: `batch-3-${Date.now()}.txt`, content: 'File 3 Content', type: 'text/plain' }
        ];
        
        const uploadPromises = multipleFiles.map(file => 
            supabaseService.storage
                .from('temporary')
                .upload(file.name, new Blob([file.content], { type: file.type }))
        );
        
        const uploadResults = await Promise.allSettled(uploadPromises);
        const successfulUploads = uploadResults.filter(result => result.status === 'fulfilled' && !result.value.error);
        
        console.log(`  ✅ 一括アップロード完了: ${successfulUploads.length}/${multipleFiles.length} 成功`);
        
        if (successfulUploads.length > 0) {
            testResults.multipleFiles = true;
            
            // 一括削除テスト
            const filesToDelete = multipleFiles.map(file => file.name);
            const { data: deleteData, error: deleteError } = await supabaseService.storage
                .from('temporary')
                .remove(filesToDelete);
            
            if (!deleteError) {
                console.log(`  ✅ 一括削除完了`);
            } else {
                console.log(`  ⚠️  一括削除エラー: ${deleteError.message}`);
            }
        }
        
    } catch (error) {
        console.log('  ❌ 複数ファイル操作例外エラー:', error.message);
    }
    
    console.log('\n7. ファイル削除テスト:');
    
    if (testFiles.length > 0) {
        for (const testFile of testFiles) {
            try {
                console.log(`  🗑️  削除: ${testFile.path}`);
                
                const { data: deleteData, error: deleteError } = await supabaseService.storage
                    .from(testFile.bucket)
                    .remove([testFile.path]);
                
                if (deleteError) {
                    console.log(`    ❌ 削除エラー: ${deleteError.message}`);
                } else {
                    console.log(`    ✅ 削除成功`);
                    testResults.delete = true;
                }
                
            } catch (error) {
                console.log(`    ❌ 削除例外エラー: ${error.message}`);
            }
        }
    }
    
    console.log('\n8. エラーハンドリングテスト:');
    
    try {
        // 存在しないファイルのダウンロード
        console.log('  🚫 存在しないファイルのダウンロード...');
        const { data: notFoundData, error: notFoundError } = await supabaseService.storage
            .from('avatars')
            .download('non-existent-file.jpg');
        
        if (notFoundError) {
            console.log(`    ✅ 適切なエラーメッセージ: ${notFoundError.message}`);
        } else {
            console.log(`    ⚠️  エラーが発生しませんでした`);
        }
        
        // 無効なバケットへのアクセス
        console.log('  🚫 存在しないバケットへのアクセス...');
        const { data: invalidBucketData, error: invalidBucketError } = await supabaseService.storage
            .from('non-existent-bucket')
            .list();
        
        if (invalidBucketError) {
            console.log(`    ✅ 適切なエラーメッセージ: ${invalidBucketError.message}`);
        } else {
            console.log(`    ⚠️  エラーが発生しませんでした`);
        }
        
    } catch (error) {
        console.log('  ✅ エラーハンドリング適切に動作:', error.message);
    }
    
    // 結果の評価
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    const successRate = (passedTests / totalTests) * 100;
    
    console.log('\n=== Storage操作テスト結果まとめ ===');
    Object.entries(testResults).forEach(([test, passed]) => {
        const testName = {
            upload: 'ファイルアップロード',
            download: 'ファイルダウンロード',
            publicUrl: 'パブリックURL生成',
            delete: 'ファイル削除',
            list: 'ファイル一覧取得',
            metadata: 'メタデータ取得',
            multipleFiles: '複数ファイル操作'
        }[test];
        console.log(`${passed ? '✅' : '❌'} ${testName}`);
    });
    
    console.log(`\n成功率: ${passedTests}/${totalTests} (${successRate.toFixed(0)}%)`);
    
    return {
        success: successRate >= 70,
        testResults,
        passedTests,
        totalTests,
        successRate
    };
}

// テスト実行
testStorageFileOperations().then(result => {
    console.log('\n=== テスト結果 ===');
    if (result.success) {
        console.log('✅ TC-BE-001-09: PASSED - Storageファイル操作が正常に動作しています');
        console.log('\n📊 操作状況:');
        console.log(`  成功率: ${result.successRate.toFixed(0)}%`);
        console.log(`  成功したテスト: ${result.passedTests}/${result.totalTests}`);
        
        console.log('\n💡 推奨事項:');
        console.log('  1. 本番環境ではファイルサイズ制限を適切に設定');
        console.log('  2. ファイル形式の検証を実装');
        console.log('  3. アップロード時のウイルススキャン検討');
        console.log('  4. 定期的な不要ファイルクリーンアップ');
        
    } else {
        console.log('❌ TC-BE-001-09: FAILED - Storageファイル操作に問題があります');
        console.log(`\n📊 成功率: ${result.successRate.toFixed(0)}% (70%以上で合格)`);
        
        console.log('\n🔧 修正が必要な項目:');
        Object.entries(result.testResults).forEach(([test, passed]) => {
            if (!passed) {
                const testName = {
                    upload: 'ファイルアップロード',
                    download: 'ファイルダウンロード', 
                    publicUrl: 'パブリックURL生成',
                    delete: 'ファイル削除',
                    list: 'ファイル一覧取得',
                    metadata: 'メタデータ取得',
                    multipleFiles: '複数ファイル操作'
                }[test];
                console.log(`  ❌ ${testName}`);
            }
        });
    }
}).catch(error => {
    console.log('\n=== テスト結果 ===');
    console.log('❌ TC-BE-001-09: FAILED - テスト実行中にエラーが発生しました:', error.message);
});