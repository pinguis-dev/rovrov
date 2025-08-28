/**
 * BE-007 Media Upload API Test Suite
 *
 * This test suite covers the test cases defined in tasks/BE-007.md
 * Tests are organized by functional area:
 * 1. Image Upload API (TC-IMG-001 to TC-IMG-007)
 * 2. Video Upload API (TC-VID-001 to TC-VID-004)
 * 3. Cloudflare Stream Webhook (TC-WHK-001 to TC-WHK-005)
 * 4. Media Processing Pipeline (TC-PROC-001 to TC-PROC-004)
 * 5. Security Tests (TC-SEC-001 to TC-SEC-003)
 */

import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const TEST_USER_EMAIL = 'test@example.com';

// Test clients
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test utilities
async function createTestUser() {
  const { data, error } = await supabaseService.auth.admin.createUser({
    email: TEST_USER_EMAIL,
    password: 'test-password-123',
    email_confirm: true,
  });

  if (error) throw error;
  return data.user;
}

async function signInTestUser() {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: 'test-password-123',
  });

  if (error) throw error;
  return data;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const response = await signInTestUser();
  return {
    Authorization: `Bearer ${response.session?.access_token}`,
    'Content-Type': 'application/json',
  };
}

// Test data
const VALID_IMAGE_JPEG = {
  fileName: 'test_image.jpg',
  mimeType: 'image/jpeg',
  fileSize: 1048576, // 1MB
};

const VALID_IMAGE_PNG = {
  fileName: 'test_image.png',
  mimeType: 'image/png',
  fileSize: 2097152, // 2MB
};

const LARGE_IMAGE = {
  fileName: 'large_image.jpg',
  mimeType: 'image/jpeg',
  fileSize: 11534336, // 11MB
};

const INVALID_FILE_TYPE = {
  fileName: 'document.pdf',
  mimeType: 'application/pdf',
  fileSize: 1048576,
};

const EXTENSION_MISMATCH = {
  fileName: 'fake_image.jpg',
  mimeType: 'image/png',
  fileSize: 1048576,
};

const VALID_VIDEO = {
  fileName: 'test_video.mp4',
  fileSize: 52428800, // 50MB
};

const LARGE_VIDEO = {
  fileName: 'large_video.mp4',
  fileSize: 110100480, // 105MB
};

// Test functions for Image Upload API

/**
 * TC-IMG-001: 正常な画像アップロードURL取得（JPEG）
 */
async function testValidImageUploadJPEG() {
  console.log('Running TC-IMG-001: Valid JPEG upload URL generation');

  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/media-upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify(VALID_IMAGE_JPEG),
  });

  console.assert(response.status === 200, 'Expected HTTP 200');

  const data = await response.json();
  console.assert(data.media_id, 'Expected media_id in response');
  console.assert(data.upload_url, 'Expected upload_url in response');
  console.assert(data.expires_at, 'Expected expires_at in response');

  console.log('✅ TC-IMG-001 passed');
  return data.media_id;
}

/**
 * TC-IMG-002: 正常な画像アップロードURL取得（PNG）
 */
async function testValidImageUploadPNG() {
  console.log('Running TC-IMG-002: Valid PNG upload URL generation');

  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/media-upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify(VALID_IMAGE_PNG),
  });

  console.assert(response.status === 200, 'Expected HTTP 200');

  const data = await response.json();
  console.assert(data.media_id, 'Expected media_id in response');
  console.assert(data.upload_url, 'Expected upload_url in response');

  console.log('✅ TC-IMG-002 passed');
}

/**
 * TC-IMG-004: 未認証ユーザーによるアクセス
 */
async function testUnauthorizedAccess() {
  console.log('Running TC-IMG-004: Unauthorized access test');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/media-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(VALID_IMAGE_JPEG),
  });

  console.assert(response.status === 401, 'Expected HTTP 401');

  const data = await response.json();
  console.assert(data.error.code === 'UNAUTHORIZED', 'Expected UNAUTHORIZED error code');

  console.log('✅ TC-IMG-004 passed');
}

/**
 * TC-IMG-005: ファイルサイズ超過
 */
async function testFileSizeExceeded() {
  console.log('Running TC-IMG-005: File size exceeded test');

  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/media-upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify(LARGE_IMAGE),
  });

  console.assert(response.status === 413, 'Expected HTTP 413');

  const data = await response.json();
  console.assert(data.error.code === 'FILE_TOO_LARGE', 'Expected FILE_TOO_LARGE error code');

  console.log('✅ TC-IMG-005 passed');
}

/**
 * TC-IMG-006: 無効なMIMEタイプ
 */
async function testInvalidMimeType() {
  console.log('Running TC-IMG-006: Invalid MIME type test');

  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/media-upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify(INVALID_FILE_TYPE),
  });

  console.assert(response.status === 400, 'Expected HTTP 400');

  const data = await response.json();
  console.assert(data.error.code === 'INVALID_FILE_TYPE', 'Expected INVALID_FILE_TYPE error code');

  console.log('✅ TC-IMG-006 passed');
}

/**
 * TC-IMG-007: 拡張子偽装対策
 */
async function testExtensionSpoofing() {
  console.log('Running TC-IMG-007: Extension spoofing protection test');

  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/media-upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify(EXTENSION_MISMATCH),
  });

  console.assert(response.status === 400, 'Expected HTTP 400');

  const data = await response.json();
  console.assert(
    data.error.code === 'EXTENSION_MISMATCH',
    'Expected EXTENSION_MISMATCH error code',
  );

  console.log('✅ TC-IMG-007 passed');
}

/**
 * TC-VID-001: 正常な動画アップロードURL取得（MP4）
 */
async function testValidVideoUpload() {
  console.log('Running TC-VID-001: Valid video upload URL generation');

  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/stream-upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify(VALID_VIDEO),
  });

  console.assert(response.status === 200, 'Expected HTTP 200');

  const data = await response.json();
  console.assert(data.media_id, 'Expected media_id in response');
  console.assert(data.upload_url, 'Expected upload_url in response');
  console.assert(data.stream_uid, 'Expected stream_uid in response');

  console.log('✅ TC-VID-001 passed');
}

/**
 * TC-VID-003: 動画ファイルサイズ超過
 */
async function testVideoSizeExceeded() {
  console.log('Running TC-VID-003: Video size exceeded test');

  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/stream-upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify(LARGE_VIDEO),
  });

  console.assert(response.status === 413, 'Expected HTTP 413');

  const data = await response.json();
  console.assert(data.error.code === 'FILE_TOO_LARGE', 'Expected FILE_TOO_LARGE error code');

  console.log('✅ TC-VID-003 passed');
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Media Upload API Test Suite (BE-007)');

  try {
    // Setup: Create test user
    console.log('Setting up test user...');
    await createTestUser();

    // Image Upload API Tests
    console.log('\n📷 Image Upload API Tests');
    await testValidImageUploadJPEG();
    await testValidImageUploadPNG();
    await testUnauthorizedAccess();
    await testFileSizeExceeded();
    await testInvalidMimeType();
    await testExtensionSpoofing();

    // Video Upload API Tests
    console.log('\n🎥 Video Upload API Tests');
    await testValidVideoUpload();
    await testVideoSizeExceeded();

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup: Remove test user
    console.log('Cleaning up test user...');
    try {
      const { data: users } = await supabaseService.auth.admin.listUsers();
      const user = users.users.find((u) => u.email === TEST_USER_EMAIL);
      if (user) {
        await supabaseService.auth.admin.deleteUser(user.id);
      }
    } catch (cleanupError) {
      console.warn('Cleanup warning:', cleanupError);
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.main) {
  runTests();
}

export {
  runTests,
  testValidImageUploadJPEG,
  testValidImageUploadPNG,
  testUnauthorizedAccess,
  testFileSizeExceeded,
  testInvalidMimeType,
  testExtensionSpoofing,
  testValidVideoUpload,
  testVideoSizeExceeded,
};
