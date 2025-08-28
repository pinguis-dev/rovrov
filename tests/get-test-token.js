import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bbyccvmwcubiummtpakz.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJieWNjdm13Y3ViaXVtbXRwYWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTIxNTYsImV4cCI6MjA3MTUyODE1Nn0.5-Q68GYXqt_l5f1VGSnaHu_WDpTKfNZoCtigsO781jY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// テスト用ユーザーでサインイン
async function getTestToken() {
  try {
    const {
      data: { user, session },
      error,
    } = await supabase.auth.signInWithPassword({
      email: 'user_a_active@test.com',
      password: 'test123456',
    });

    if (error) {
      console.error('認証エラー:', error.message);
      return null;
    }

    if (session) {
      console.log('認証成功');
      console.log('User ID:', user.id);
      console.log('Access Token:', session.access_token);
      return {
        userId: user.id,
        accessToken: session.access_token,
      };
    }
  } catch (error) {
    console.error('予期しないエラー:', error);
    return null;
  }
}

// 実行
getTestToken().then((result) => {
  if (result) {
    console.log('テスト用トークン取得成功');
    console.log(`export TEST_USER_ID="${result.userId}"`);
    console.log(`export TEST_ACCESS_TOKEN="${result.accessToken}"`);
  } else {
    console.log('テスト用トークン取得失敗');
  }
});
