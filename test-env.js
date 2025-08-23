require('dotenv').config();

// TC-BE-001-01: 環境変数検証テスト
console.log('=== TC-BE-001-01: 環境変数検証テスト ===\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;

console.log('1. 環境変数の存在確認:');
console.log('  SUPABASE_URL exists:', !!supabaseUrl);
console.log('  SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
console.log('  SUPABASE_SERVICE_KEY exists:', !!supabaseServiceKey);
console.log('  SUPABASE_ACCESS_TOKEN exists:', !!supabaseAccessToken);

console.log('\n2. URL形式の検証:');
const urlPattern = /^https:\/\/[a-z0-9]+\.supabase\.co$/;
console.log('  URL format valid:', urlPattern.test(supabaseUrl));
console.log('  URL value:', supabaseUrl);

console.log('\n3. JWTキー形式の検証:');
const jwtPattern = /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
console.log('  ANON key format valid:', jwtPattern.test(supabaseAnonKey));
console.log('  SERVICE key format valid:', jwtPattern.test(supabaseServiceKey));

console.log('\n4. キーの長さ検証:');
console.log('  ANON key length:', supabaseAnonKey ? supabaseAnonKey.length : 0);
console.log('  SERVICE key length:', supabaseServiceKey ? supabaseServiceKey.length : 0);

// JWTペイロードのデコード（base64）
function decodeJWT(token) {
    try {
        const payload = token.split('.')[1];
        const decoded = Buffer.from(payload, 'base64').toString('utf8');
        return JSON.parse(decoded);
    } catch (error) {
        return null;
    }
}

console.log('\n5. JWTペイロードの検証:');
const anonPayload = decodeJWT(supabaseAnonKey);
const servicePayload = decodeJWT(supabaseServiceKey);

if (anonPayload) {
    console.log('  ANON token role:', anonPayload.role);
    console.log('  ANON token ref:', anonPayload.ref);
} else {
    console.log('  ANON token decode failed');
}

if (servicePayload) {
    console.log('  SERVICE token role:', servicePayload.role);
    console.log('  SERVICE token ref:', servicePayload.ref);
} else {
    console.log('  SERVICE token decode failed');
}

console.log('\n6. React Native環境変数の検証:');
const expoPublicUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const expoPublicAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('  EXPO_PUBLIC_SUPABASE_URL exists:', !!expoPublicUrl);
console.log('  EXPO_PUBLIC_SUPABASE_ANON_KEY exists:', !!expoPublicAnonKey);
console.log('  EXPO URL matches main URL:', expoPublicUrl === supabaseUrl);
console.log('  EXPO ANON key matches main:', expoPublicAnonKey === supabaseAnonKey);

console.log('\n=== テスト結果 ===');
const urlValid = urlPattern.test(supabaseUrl);
const anonKeyValid = jwtPattern.test(supabaseAnonKey);
const serviceKeyValid = jwtPattern.test(supabaseServiceKey);
const allVarsExist = !!supabaseUrl && !!supabaseAnonKey && !!supabaseServiceKey && !!supabaseAccessToken;
const expoVarsValid = !!expoPublicUrl && !!expoPublicAnonKey && expoPublicUrl === supabaseUrl && expoPublicAnonKey === supabaseAnonKey;

if (allVarsExist && urlValid && anonKeyValid && serviceKeyValid && expoVarsValid) {
    console.log('✅ TC-BE-001-01: PASSED - すべての環境変数が適切に設定されています');
} else {
    console.log('❌ TC-BE-001-01: FAILED - 環境変数に問題があります');
    if (!allVarsExist) console.log('  - 必要な環境変数が不足しています');
    if (!urlValid) console.log('  - URL形式が無効です');
    if (!anonKeyValid) console.log('  - ANON key形式が無効です');
    if (!serviceKeyValid) console.log('  - SERVICE key形式が無効です');
    if (!expoVarsValid) console.log('  - React Native用環境変数に問題があります');
}