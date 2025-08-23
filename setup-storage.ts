import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBuckets() {
  console.log('🚀 Storageバケットのセットアップを開始...\n');

  const buckets = [
    { 
      name: 'avatars', 
      public: true, 
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      description: 'プロファイル画像（public read）'
    },
    { 
      name: 'headers', 
      public: true, 
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      description: 'ヘッダー画像（public read）'
    },
    { 
      name: 'posts', 
      public: false, 
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: ['image/*', 'video/*'],
      description: '投稿メディア（認証ユーザーのみ）'
    },
    { 
      name: 'temporary', 
      public: false, 
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['*'],
      description: '一時ファイル（24時間TTL）'
    }
  ];

  for (const bucket of buckets) {
    console.log(`📁 バケット "${bucket.name}" を作成中...`);
    console.log(`   ${bucket.description}`);
    
    const { data, error } = await supabase.storage.createBucket(
      bucket.name, 
      {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes
      }
    );
    
    if (error && !error.message.includes('already exists')) {
      console.error(`❌ バケット "${bucket.name}" の作成に失敗:`, error.message);
      throw error;
    } else if (error && error.message.includes('already exists')) {
      console.log(`   ℹ️  バケット "${bucket.name}" は既に存在します`);
    } else {
      console.log(`   ✅ バケット "${bucket.name}" を作成しました`);
    }
  }

  // 作成されたバケットの確認
  console.log('\n📋 作成されたバケットの確認...');
  const { data: allBuckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ バケット一覧の取得に失敗:', listError.message);
    return;
  }

  console.log('\n📦 利用可能なバケット:');
  allBuckets?.forEach((bucket: any) => {
    console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
  });

  console.log('\n🎉 Storageバケットのセットアップが完了しました！');
}

// スクリプト実行
if (require.main === module) {
  setupStorageBuckets()
    .then(() => {
      console.log('\n✨ セットアップ完了！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 エラーが発生しました:', error.message);
      process.exit(1);
    });
}

export { setupStorageBuckets };