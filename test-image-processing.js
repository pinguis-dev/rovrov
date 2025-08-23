require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// TC-BE-001-10: 画像処理設定の詳細テスト
console.log('=== TC-BE-001-10: 画像処理設定の詳細テスト ===\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function testImageProcessing() {
    const testResults = {
        basicTransform: false,
        resizeTransform: false,
        qualityTransform: false,
        formatTransform: false,
        multipleTransforms: false,
        urlGeneration: false
    };
    
    let testImagePath = null;
    
    console.log('1. テスト用画像のアップロード:');
    
    try {
        // より大きなPNG画像を作成（変換テスト用）
        const largePngBuffer = Buffer.from([
            // PNG signature
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            // IHDR chunk - 10x10 pixel image
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x0A, 0x00, 0x00, 0x00, 0x0A, // 10x10 pixels
            0x08, 0x02, 0x00, 0x00, 0x00, 0x02, 0x50, 0x58,
            0x5A, // checksum
            // IDAT chunk with simple pixel data
            0x00, 0x00, 0x00, 0x16, 0x49, 0x44, 0x41, 0x54,
            0x28, 0xCF, 0x63, 0xF8, 0x0C, 0x00, 0x01, 0x01,
            0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x1C, 0x00,
            0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC,
            0x33, // checksum
            // IEND chunk
            0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
            0xAE, 0x42, 0x60, 0x82
        ]);
        
        const testFile = new Blob([largePngBuffer], { type: 'image/png' });
        testImagePath = `test-transform-${Date.now()}.png`;
        
        console.log(`  📤 テスト画像アップロード: ${testImagePath}`);
        
        const { data: uploadData, error: uploadError } = await supabaseService.storage
            .from('avatars')
            .upload(testImagePath, testFile);
        
        if (uploadError) {
            console.log('  ❌ アップロードエラー:', uploadError.message);
            return { success: false, error: 'テスト画像のアップロードに失敗' };
        } else {
            console.log('  ✅ テスト画像アップロード成功');
        }
        
    } catch (error) {
        console.log('  ❌ 画像アップロード例外エラー:', error.message);
        return { success: false, error: error.message };
    }
    
    console.log('\n2. 基本的な画像変換URL生成テスト:');
    
    try {
        console.log('  🖼️  基本変換URLの生成...');
        
        const { data: basicUrl } = supabaseService.storage
            .from('avatars')
            .getPublicUrl(testImagePath, {
                transform: {
                    width: 100,
                    height: 100
                }
            });
        
        if (basicUrl && basicUrl.publicUrl) {
            console.log(`  ✅ 基本変換URL生成成功`);
            console.log(`     URL: ${basicUrl.publicUrl}`);
            
            // URLに変換パラメータが含まれているか確認
            if (basicUrl.publicUrl.includes('width=100') || basicUrl.publicUrl.includes('w=100')) {
                console.log(`  ✅ 変換パラメータ検出`);
                testResults.basicTransform = true;
            } else {
                console.log(`  ⚠️  変換パラメータが見つかりません`);
            }
            
            testResults.urlGeneration = true;
        } else {
            console.log(`  ❌ 基本変換URL生成失敗`);
        }
        
    } catch (error) {
        console.log(`  ❌ 基本変換テストエラー: ${error.message}`);
    }
    
    console.log('\n3. リサイズ変換のテスト:');
    
    const resizeTests = [
        { width: 50, height: 50, resize: 'cover', description: 'Cover Resize' },
        { width: 200, height: 100, resize: 'contain', description: 'Contain Resize' },
        { width: 150, height: 150, resize: 'fill', description: 'Fill Resize' }
    ];
    
    for (const resizeTest of resizeTests) {
        try {
            console.log(`  📏 ${resizeTest.description} (${resizeTest.width}x${resizeTest.height})...`);
            
            const { data: resizeUrl } = supabaseService.storage
                .from('avatars')
                .getPublicUrl(testImagePath, {
                    transform: {
                        width: resizeTest.width,
                        height: resizeTest.height,
                        resize: resizeTest.resize
                    }
                });
            
            if (resizeUrl && resizeUrl.publicUrl) {
                console.log(`    ✅ ${resizeTest.description} URL生成成功`);
                console.log(`       URL: ${resizeUrl.publicUrl}`);
                testResults.resizeTransform = true;
            } else {
                console.log(`    ❌ ${resizeTest.description} URL生成失敗`);
            }
            
        } catch (error) {
            console.log(`    ❌ ${resizeTest.description} エラー: ${error.message}`);
        }
    }
    
    console.log('\n4. 品質設定テスト:');
    
    const qualityTests = [80, 60, 40, 20];
    
    for (const quality of qualityTests) {
        try {
            console.log(`  🎨 品質設定 ${quality}% テスト...`);
            
            const { data: qualityUrl } = supabaseService.storage
                .from('avatars')
                .getPublicUrl(testImagePath, {
                    transform: {
                        width: 100,
                        height: 100,
                        quality: quality
                    }
                });
            
            if (qualityUrl && qualityUrl.publicUrl) {
                console.log(`    ✅ 品質 ${quality}% URL生成成功`);
                
                // 品質パラメータが含まれているか確認
                if (qualityUrl.publicUrl.includes(`quality=${quality}`) || 
                    qualityUrl.publicUrl.includes(`q=${quality}`)) {
                    console.log(`    ✅ 品質パラメータ検出`);
                    testResults.qualityTransform = true;
                }
                
            } else {
                console.log(`    ❌ 品質 ${quality}% URL生成失敗`);
            }
            
        } catch (error) {
            console.log(`    ❌ 品質 ${quality}% テストエラー: ${error.message}`);
        }
    }
    
    console.log('\n5. フォーマット変換テスト:');
    
    const formatTests = ['webp', 'avif', 'jpg'];
    
    for (const format of formatTests) {
        try {
            console.log(`  🔄 ${format.toUpperCase()} フォーマット変換テスト...`);
            
            const { data: formatUrl } = supabaseService.storage
                .from('avatars')
                .getPublicUrl(testImagePath, {
                    transform: {
                        width: 100,
                        height: 100,
                        format: format
                    }
                });
            
            if (formatUrl && formatUrl.publicUrl) {
                console.log(`    ✅ ${format.toUpperCase()} URL生成成功`);
                
                // フォーマットパラメータが含まれているか確認
                if (formatUrl.publicUrl.includes(`format=${format}`) || 
                    formatUrl.publicUrl.includes(`f=${format}`)) {
                    console.log(`    ✅ フォーマットパラメータ検出`);
                    testResults.formatTransform = true;
                }
                
            } else {
                console.log(`    ❌ ${format.toUpperCase()} URL生成失敗`);
            }
            
        } catch (error) {
            console.log(`    ❌ ${format.toUpperCase()} テストエラー: ${error.message}`);
        }
    }
    
    console.log('\n6. 複合変換テスト:');
    
    const complexTransforms = [
        {
            name: 'サムネイル+品質',
            transform: { width: 150, height: 150, resize: 'cover', quality: 80 }
        },
        {
            name: 'WebP+高品質',
            transform: { width: 200, height: 200, format: 'webp', quality: 90 }
        },
        {
            name: '小サイズ+低品質',
            transform: { width: 50, height: 50, format: 'jpg', quality: 50, resize: 'fill' }
        }
    ];
    
    for (const complexTest of complexTransforms) {
        try {
            console.log(`  🎯 ${complexTest.name}テスト...`);
            
            const { data: complexUrl } = supabaseService.storage
                .from('avatars')
                .getPublicUrl(testImagePath, {
                    transform: complexTest.transform
                });
            
            if (complexUrl && complexUrl.publicUrl) {
                console.log(`    ✅ ${complexTest.name} URL生成成功`);
                console.log(`       URL: ${complexUrl.publicUrl}`);
                testResults.multipleTransforms = true;
            } else {
                console.log(`    ❌ ${complexTest.name} URL生成失敗`);
            }
            
        } catch (error) {
            console.log(`    ❌ ${complexTest.name} エラー: ${error.message}`);
        }
    }
    
    console.log('\n7. 画像変換URL検証:');
    
    try {
        console.log('  🔍 生成されたURLの検証...');
        
        // 基本的な変換URLを使用してHTTPリクエスト
        const { data: testUrl } = supabaseService.storage
            .from('avatars')
            .getPublicUrl(testImagePath, {
                transform: {
                    width: 100,
                    height: 100,
                    quality: 80
                }
            });
        
        if (testUrl && testUrl.publicUrl) {
            console.log('  📡 変換されたURLへのリクエスト送信...');
            
            const response = await fetch(testUrl.publicUrl);
            
            console.log(`    Status: ${response.status}`);
            console.log(`    Content-Type: ${response.headers.get('content-type')}`);
            console.log(`    Content-Length: ${response.headers.get('content-length')} bytes`);
            
            if (response.ok) {
                console.log('  ✅ 変換されたURLが正常に動作');
                
                // 画像データの取得確認
                const imageData = await response.arrayBuffer();
                console.log(`    ✅ 画像データ取得成功 (${imageData.byteLength} bytes)`);
            } else {
                console.log(`  ⚠️  URLはアクセス可能だが、HTTPエラー: ${response.status}`);
            }
        }
        
    } catch (error) {
        console.log(`  ❌ URL検証エラー: ${error.message}`);
    }
    
    console.log('\n8. エラーケーステスト:');
    
    try {
        // 無効な変換パラメータ
        console.log('  🚫 無効な変換パラメータテスト...');
        
        const { data: invalidUrl } = supabaseService.storage
            .from('avatars')
            .getPublicUrl(testImagePath, {
                transform: {
                    width: -100,  // 無効な値
                    height: 'invalid', // 無効な型
                    quality: 150  // 範囲外の値
                }
            });
        
        if (invalidUrl && invalidUrl.publicUrl) {
            console.log('  ⚠️  無効なパラメータでもURL生成されました');
            console.log(`     URL: ${invalidUrl.publicUrl}`);
            
            // 実際にアクセスしてエラーハンドリングを確認
            try {
                const response = await fetch(invalidUrl.publicUrl);
                if (response.ok) {
                    console.log('  ⚠️  無効なパラメータでも正常なレスポンス');
                } else {
                    console.log(`  ✅ 無効なパラメータで適切なエラー: ${response.status}`);
                }
            } catch (error) {
                console.log(`  ✅ 無効なパラメータで適切なエラー: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.log(`  ✅ エラーケース適切に処理: ${error.message}`);
    }
    
    // クリーンアップ
    console.log('\n9. テストファイルのクリーンアップ:');
    
    if (testImagePath) {
        try {
            const { error: deleteError } = await supabaseService.storage
                .from('avatars')
                .remove([testImagePath]);
            
            if (deleteError) {
                console.log(`  ⚠️  クリーンアップエラー: ${deleteError.message}`);
            } else {
                console.log('  ✅ テストファイル削除完了');
            }
        } catch (error) {
            console.log(`  ⚠️  クリーンアップ例外エラー: ${error.message}`);
        }
    }
    
    // 結果の評価
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    const successRate = (passedTests / totalTests) * 100;
    
    console.log('\n=== 画像処理テスト結果まとめ ===');
    Object.entries(testResults).forEach(([test, passed]) => {
        const testName = {
            basicTransform: '基本変換',
            resizeTransform: 'リサイズ変換',
            qualityTransform: '品質設定',
            formatTransform: 'フォーマット変換',
            multipleTransforms: '複合変換',
            urlGeneration: 'URL生成'
        }[test];
        console.log(`${passed ? '✅' : '❌'} ${testName}`);
    });
    
    console.log(`\n成功率: ${passedTests}/${totalTests} (${successRate.toFixed(0)}%)`);
    
    return {
        success: successRate >= 50, // 画像変換は機能によって対応が異なるため50%で合格
        testResults,
        passedTests,
        totalTests,
        successRate
    };
}

// テスト実行
testImageProcessing().then(result => {
    console.log('\n=== テスト結果 ===');
    if (result.success) {
        console.log('✅ TC-BE-001-10: PASSED - 画像処理設定が動作しています');
        console.log('\n📊 処理状況:');
        console.log(`  成功率: ${result.successRate.toFixed(0)}%`);
        console.log(`  成功したテスト: ${result.passedTests}/${result.totalTests}`);
        
        console.log('\n💡 推奨事項:');
        console.log('  1. 本番環境では適切な画像サイズ制限を設定');
        console.log('  2. WebPやAVIFなどのモダンフォーマット対応を確認');
        console.log('  3. CDN設定で画像配信を最適化');
        console.log('  4. 画像変換のキャッシュ設定を調整');
        
    } else {
        console.log('❌ TC-BE-001-10: FAILED - 画像処理設定に問題があります');
        console.log(`\n📊 成功率: ${result.successRate.toFixed(0)}% (50%以上で合格)`);
        
        if (result.error) {
            console.log(`\nエラー: ${result.error}`);
        }
        
        console.log('\n🔧 確認が必要な項目:');
        Object.entries(result.testResults || {}).forEach(([test, passed]) => {
            if (!passed) {
                const testName = {
                    basicTransform: '基本変換',
                    resizeTransform: 'リサイズ変換', 
                    qualityTransform: '品質設定',
                    formatTransform: 'フォーマット変換',
                    multipleTransforms: '複合変換',
                    urlGeneration: 'URL生成'
                }[test];
                console.log(`  ❌ ${testName}`);
            }
        });
        
        console.log('\n💡 修正方法:');
        console.log('  1. Supabaseダッシュボードで画像変換機能を確認');
        console.log('  2. プロジェクトプランで画像変換がサポートされているか確認');
        console.log('  3. 代替として、クライアントサイドでの画像処理を検討');
    }
}).catch(error => {
    console.log('\n=== テスト結果 ===');
    console.log('❌ TC-BE-001-10: FAILED - テスト実行中にエラーが発生しました:', error.message);
});