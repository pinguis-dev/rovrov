/**
 * BE-008 Posts CRUD API Test Suite
 * Comprehensive test cases for posts creation, update, deletion, and retrieval
 * Based on task specification: tasks/BE-008.md
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const POSTS_API_URL = `${SUPABASE_URL}/functions/v1/posts-api/posts`;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test users - create actual session tokens
const TEST_USERS = {
  USER_A: {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'user_a_active@test.com',
    token: null, // Will be populated with actual session token
  },
  USER_B: {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'user_b_active@test.com',
    token: null, // Will be populated with actual session token
  },
};

// Create test session tokens
async function initializeTestUsers() {
  try {
    // For testing purposes, we'll use the service role key to simulate JWT tokens
    // In a real test environment, you would create actual user sessions

    // For now, we'll create mock JWT-like tokens that can be validated by our test API
    TEST_USERS.USER_A.token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJlbWFpbCI6InVzZXJfYV9hY3RpdmVAdGVzdC5jb20iLCJpYXQiOjE2OTE2NzI0MDAsImV4cCI6MTcyMzI5NDgwMCwiaXNzIjoic3VwYWJhc2UiLCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.test-signature-user-a';
    TEST_USERS.USER_B.token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMjIyMjIyMi0yMjIyLTIyMjItMjIyMi0yMjIyMjIyMjIyMjIiLCJlbWFpbCI6InVzZXJfYl9hY3RpdmVAdGVzdC5jb20iLCJpYXQiOjE2OTE2NzI0MDAsImV4cCI6MTcyMzI5NDgwMCwiaXNzIjoic3VwYWJhc2UiLCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.test-signature-user-b';
  } catch (error) {
    console.error('Failed to initialize test users:', error);
  }
}

// Helper functions
async function makeRequest(method, endpoint, data = null, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.auth) {
    headers['Authorization'] = `Bearer ${options.auth}`;
  }

  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  const requestOptions = {
    method,
    headers,
  };

  if (data) {
    requestOptions.body = JSON.stringify(data);
  }

  const response = await fetch(endpoint, requestOptions);
  const responseData = await response.text();

  let parsedData;
  try {
    parsedData = JSON.parse(responseData);
  } catch {
    parsedData = responseData;
  }

  return {
    status: response.status,
    data: parsedData,
    headers: Object.fromEntries(response.headers.entries()),
  };
}

async function createTestMediaFile(userId, status = 'ready') {
  const { data } = await supabase
    .from('media_files')
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      file_name: 'test-image.jpg',
      mime_type: 'image/jpeg',
      file_size: 1024000,
      storage_path: 'test/path/image.jpg',
      path: 'test/path/image.jpg',
      bucket: 'posts',
      type: 'image',
      status: status,
      storage_provider: 'supabase_storage',
    })
    .select()
    .single();

  return data;
}

async function createTestPin() {
  const { data } = await supabase
    .from('pins')
    .insert({
      id: crypto.randomUUID(),
      name: 'Test Location',
      location: {
        type: 'Point',
        coordinates: [139.6917, 35.6895], // Tokyo coordinates
      },
      address: 'Tokyo, Japan',
    })
    .select()
    .single();

  return data;
}

async function cleanup() {
  // Clean up test data
  await supabase.from('post_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('post_media').delete().neq('post_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase
    .from('idempotency_keys')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
}

describe('BE-008 Posts CRUD API Test Suite', () => {
  beforeAll(async () => {
    await initializeTestUsers();
  });

  beforeEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('1. POST /posts - Post Creation', () => {
    describe('1.1 Normal Operations', () => {
      test('TC-001: Basic post creation', async () => {
        const idempotencyKey = crypto.randomUUID();
        const postData = {
          caption: 'Test post caption',
          status: 'published',
          visibility: 'public',
        };

        const response = await makeRequest('POST', POSTS_API_URL, postData, {
          auth: TEST_USERS.USER_A.token,
          idempotencyKey,
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data.caption).toBe(postData.caption);
        expect(response.data.status).toBe(postData.status);
        expect(response.data).toHaveProperty('published_at');
      });

      test('TC-002: Media-attached post creation', async () => {
        const mediaFile = await createTestMediaFile(TEST_USERS.USER_A.id);
        const idempotencyKey = crypto.randomUUID();

        const postData = {
          caption: 'Post with media',
          media_ids: [mediaFile.id],
          status: 'published',
          visibility: 'public',
        };

        const response = await makeRequest('POST', POSTS_API_URL, postData, {
          auth: TEST_USERS.USER_A.token,
          idempotencyKey,
        });

        expect(response.status).toBe(201);
        expect(response.data.media_count).toBe(1);

        // Verify media association
        const { data: mediaUpdate } = await supabase
          .from('media_files')
          .select('post_id')
          .eq('id', mediaFile.id)
          .single();

        expect(mediaUpdate.post_id).toBe(response.data.id);
      });

      test('TC-003: Pin-attached post (exact location)', async () => {
        const pin = await createTestPin();
        const idempotencyKey = crypto.randomUUID();

        const postData = {
          caption: 'Post with exact location',
          pin_id: pin.id,
          map_visibility: 'exact',
          status: 'published',
        };

        const response = await makeRequest('POST', POSTS_API_URL, postData, {
          auth: TEST_USERS.USER_A.token,
          idempotencyKey,
        });

        expect(response.status).toBe(201);
        expect(response.data.pin_id).toBe(pin.id);
        expect(response.data.display_point).toEqual(pin.location);
      });

      test('TC-004: Pin-attached post (approximate location)', async () => {
        const pin = await createTestPin();
        const idempotencyKey = crypto.randomUUID();

        const postData = {
          caption: 'Post with approximate location',
          pin_id: pin.id,
          map_visibility: 'approx_100m',
          status: 'published',
        };

        const response = await makeRequest('POST', POSTS_API_URL, postData, {
          auth: TEST_USERS.USER_A.token,
          idempotencyKey,
        });

        expect(response.status).toBe(201);
        expect(response.data.display_point).toBeDefined();
        expect(response.data.display_point.coordinates).not.toEqual(pin.location.coordinates);
      });

      test('TC-005: Tagged post creation', async () => {
        const idempotencyKey = crypto.randomUUID();
        const postData = {
          caption: 'Post with tags',
          tags: ['test', 'Test', 'test', 'japanese', 'JAPANESE'],
          status: 'published',
        };

        const response = await makeRequest('POST', POSTS_API_URL, postData, {
          auth: TEST_USERS.USER_A.token,
          idempotencyKey,
        });

        expect(response.status).toBe(201);
        expect(response.data.tags).toHaveLength(2); // Duplicates removed
        expect(response.data.tags).toContain('test');
        expect(response.data.tags).toContain('japanese');
      });

      test('TC-006: Temporary post creation', async () => {
        const idempotencyKey = crypto.randomUUID();
        const postData = {
          caption: 'Temporary post',
          status: 'temporary',
        };

        const response = await makeRequest('POST', POSTS_API_URL, postData, {
          auth: TEST_USERS.USER_A.token,
          idempotencyKey,
        });

        expect(response.status).toBe(201);
        expect(response.data.status).toBe('temporary');
        expect(response.data).toHaveProperty('expires_at');
        expect(response.data).toHaveProperty('published_at');
      });
    });

    describe('1.2 Idempotency-Key Processing', () => {
      test('TC-007: Initial idempotency key processing', async () => {
        const idempotencyKey = crypto.randomUUID();
        const postData = {
          caption: 'Idempotency test',
          status: 'published',
        };

        const response = await makeRequest('POST', POSTS_API_URL, postData, {
          auth: TEST_USERS.USER_A.token,
          idempotencyKey,
        });

        expect(response.status).toBe(201);

        // Verify key storage
        const { data: storedKey } = await supabase
          .from('idempotency_keys')
          .select('*')
          .eq('key', idempotencyKey)
          .eq('user_id', TEST_USERS.USER_A.id)
          .single();

        expect(storedKey).toBeDefined();
      });

      test('TC-008: Duplicate idempotency key processing', async () => {
        const idempotencyKey = crypto.randomUUID();
        const postData = {
          caption: 'Duplicate idempotency test',
          status: 'published',
        };

        // First request
        const response1 = await makeRequest('POST', POSTS_API_URL, postData, {
          auth: TEST_USERS.USER_A.token,
          idempotencyKey,
        });

        // Second request with same key
        const response2 = await makeRequest('POST', POSTS_API_URL, postData, {
          auth: TEST_USERS.USER_A.token,
          idempotencyKey,
        });

        expect(response1.status).toBe(201);
        expect(response2.status).toBe(201);
        expect(response1.data).toEqual(response2.data);

        // Verify only one post was created
        const { data: posts } = await supabase
          .from('posts')
          .select('id')
          .eq('caption', postData.caption);

        expect(posts).toHaveLength(1);
      });
    });

    describe('1.3 Validation Errors', () => {
      test('TC-010: Missing idempotency key', async () => {
        const postData = {
          caption: 'Test without idempotency key',
          status: 'published',
        };

        const response = await makeRequest('POST', POSTS_API_URL, postData, {
          auth: TEST_USERS.USER_A.token,
        });

        expect(response.status).toBe(400);
        expect(response.data.error.code).toBe('MISSING_IDEMPOTENCY_KEY');
      });

      test('TC-011: Caption character limit exceeded', async () => {
        const idempotencyKey = crypto.randomUUID();
        const longCaption = 'a'.repeat(2001);

        const postData = {
          caption: longCaption,
          status: 'published',
        };

        const response = await makeRequest('POST', POSTS_API_URL, postData, {
          auth: TEST_USERS.USER_A.token,
          idempotencyKey,
        });

        expect(response.status).toBe(400);
        expect(response.data.error.message).toContain('2000 characters');
      });

      test('TC-012: Media file limit exceeded', async () => {
        const mediaFiles = [];
        for (let i = 0; i < 11; i++) {
          const media = await createTestMediaFile(TEST_USERS.USER_A.id);
          mediaFiles.push(media.id);
        }

        const idempotencyKey = crypto.randomUUID();
        const postData = {
          caption: 'Too many media files',
          media_ids: mediaFiles,
          status: 'published',
        };

        const response = await makeRequest('POST', POSTS_API_URL, postData, {
          auth: TEST_USERS.USER_A.token,
          idempotencyKey,
        });

        expect(response.status).toBe(400);
        expect(response.data.error.message).toContain('Maximum 10 media');
      });

      test('TC-013: Empty content error', async () => {
        const idempotencyKey = crypto.randomUUID();
        const postData = {
          caption: '',
          media_ids: [],
          status: 'published',
        };

        const response = await makeRequest('POST', POSTS_API_URL, postData, {
          auth: TEST_USERS.USER_A.token,
          idempotencyKey,
        });

        expect(response.status).toBe(400);
        expect(response.data.error.message).toContain('either media or caption');
      });

      test('TC-014: Invalid media ID', async () => {
        const idempotencyKey = crypto.randomUUID();
        const postData = {
          caption: 'Invalid media test',
          media_ids: [crypto.randomUUID()],
          status: 'published',
        };

        const response = await makeRequest('POST', POSTS_API_URL, postData, {
          auth: TEST_USERS.USER_A.token,
          idempotencyKey,
        });

        expect(response.status).toBe(400);
        expect(response.data.error.message).toContain('Invalid or unauthorized');
      });

      test('TC-015: Other users media file', async () => {
        const mediaFile = await createTestMediaFile(TEST_USERS.USER_B.id);
        const idempotencyKey = crypto.randomUUID();

        const postData = {
          caption: 'Unauthorized media test',
          media_ids: [mediaFile.id],
          status: 'published',
        };

        const response = await makeRequest('POST', POSTS_API_URL, postData, {
          auth: TEST_USERS.USER_A.token,
          idempotencyKey,
        });

        expect(response.status).toBe(400);
        expect(response.data.error.message).toContain('Invalid or unauthorized');
      });

      test('TC-017: Unauthorized access', async () => {
        const postData = {
          caption: 'Unauthorized test',
          status: 'published',
        };

        const response = await makeRequest('POST', POSTS_API_URL, postData, {
          idempotencyKey: crypto.randomUUID(),
        });

        expect(response.status).toBe(401);
        expect(response.data.error.code).toBe('UNAUTHORIZED');
      });
    });
  });

  describe('2. PATCH /posts/{post_id} - Post Updates', () => {
    let testPost;

    beforeEach(async () => {
      // Create a test post
      const { data } = await supabase
        .from('posts')
        .insert({
          id: crypto.randomUUID(),
          user_id: TEST_USERS.USER_A.id,
          caption: 'Test post for updates',
          status: 'draft',
          visibility: 'public',
        })
        .select()
        .single();

      testPost = data;
    });

    describe('2.1 Normal Operations', () => {
      test('TC-020: Basic information update', async () => {
        const updateData = {
          caption: 'Updated caption',
          visibility: 'private',
        };

        const response = await makeRequest('PATCH', `${POSTS_API_URL}/${testPost.id}`, updateData, {
          auth: TEST_USERS.USER_A.token,
        });

        expect(response.status).toBe(200);
        expect(response.data.caption).toBe(updateData.caption);
        expect(response.data.visibility).toBe(updateData.visibility);
        expect(response.data.updated_at).not.toBe(testPost.updated_at);
      });

      test('TC-025: Draft to published transition', async () => {
        const updateData = {
          status: 'published',
        };

        const response = await makeRequest('PATCH', `${POSTS_API_URL}/${testPost.id}`, updateData, {
          auth: TEST_USERS.USER_A.token,
        });

        expect(response.status).toBe(200);
        expect(response.data.status).toBe('published');
        expect(response.data.published_at).toBeDefined();
      });
    });

    describe('2.2 Error Cases', () => {
      test('TC-027: Invalid status transition', async () => {
        // First, publish the post
        await supabase.from('posts').update({ status: 'published' }).eq('id', testPost.id);

        const updateData = {
          status: 'draft', // Invalid transition from published to draft
        };

        const response = await makeRequest('PATCH', `${POSTS_API_URL}/${testPost.id}`, updateData, {
          auth: TEST_USERS.USER_A.token,
        });

        expect(response.status).toBe(400);
        expect(response.data.error.code).toBe('INVALID_STATUS_TRANSITION');
      });

      test('TC-028: Non-existent post update', async () => {
        const fakePostId = crypto.randomUUID();
        const updateData = {
          caption: 'Update non-existent post',
        };

        const response = await makeRequest('PATCH', `${POSTS_API_URL}/${fakePostId}`, updateData, {
          auth: TEST_USERS.USER_A.token,
        });

        expect(response.status).toBe(404);
        expect(response.data.error.code).toBe('POST_NOT_FOUND');
      });

      test('TC-029: Other users post update', async () => {
        const updateData = {
          caption: 'Unauthorized update',
        };

        const response = await makeRequest('PATCH', `${POSTS_API_URL}/${testPost.id}`, updateData, {
          auth: TEST_USERS.USER_B.token,
        });

        expect(response.status).toBe(404);
        expect(response.data.error.code).toBe('POST_NOT_FOUND');
      });
    });
  });

  describe('3. DELETE /posts/{post_id} - Post Deletion', () => {
    let testPost;

    beforeEach(async () => {
      const { data } = await supabase
        .from('posts')
        .insert({
          id: crypto.randomUUID(),
          user_id: TEST_USERS.USER_A.id,
          caption: 'Test post for deletion',
          status: 'published',
          visibility: 'public',
        })
        .select()
        .single();

      testPost = data;
    });

    describe('3.1 Normal Operations', () => {
      test('TC-032: Logical deletion', async () => {
        const response = await makeRequest('DELETE', `${POSTS_API_URL}/${testPost.id}`, null, {
          auth: TEST_USERS.USER_A.token,
        });

        expect(response.status).toBe(204);

        // Verify logical deletion
        const { data: deletedPost } = await supabase
          .from('posts')
          .select('deleted_at')
          .eq('id', testPost.id)
          .single();

        expect(deletedPost.deleted_at).toBeDefined();
      });
    });

    describe('3.2 Error Cases', () => {
      test('TC-034: Non-existent post deletion', async () => {
        const fakePostId = crypto.randomUUID();

        const response = await makeRequest('DELETE', `${POSTS_API_URL}/${fakePostId}`, null, {
          auth: TEST_USERS.USER_A.token,
        });

        expect(response.status).toBe(404);
        expect(response.data.error.code).toBe('POST_NOT_FOUND');
      });

      test('TC-035: Other users post deletion', async () => {
        const response = await makeRequest('DELETE', `${POSTS_API_URL}/${testPost.id}`, null, {
          auth: TEST_USERS.USER_B.token,
        });

        expect(response.status).toBe(404);
        expect(response.data.error.code).toBe('POST_NOT_FOUND');
      });

      test('TC-036: Duplicate deletion attempt', async () => {
        // First deletion
        await makeRequest('DELETE', `${POSTS_API_URL}/${testPost.id}`, null, {
          auth: TEST_USERS.USER_A.token,
        });

        // Second deletion attempt
        const response = await makeRequest('DELETE', `${POSTS_API_URL}/${testPost.id}`, null, {
          auth: TEST_USERS.USER_A.token,
        });

        expect(response.status).toBe(410);
        expect(response.data.error.code).toBe('POST_ALREADY_DELETED');
      });
    });
  });

  describe('4. GET /posts/{post_id} - Post Retrieval', () => {
    let testPost;

    beforeEach(async () => {
      const pin = await createTestPin();
      const mediaFile = await createTestMediaFile(TEST_USERS.USER_A.id);

      const { data: post } = await supabase
        .from('posts')
        .insert({
          id: crypto.randomUUID(),
          user_id: TEST_USERS.USER_A.id,
          caption: 'Test post for retrieval',
          pin_id: pin.id,
          status: 'published',
          visibility: 'public',
        })
        .select()
        .single();

      // Associate media
      await supabase.from('media_files').update({ post_id: post.id }).eq('id', mediaFile.id);

      testPost = post;
    });

    describe('4.1 Normal Operations', () => {
      test('TC-038: Public post retrieval (authenticated)', async () => {
        const response = await makeRequest('GET', `${POSTS_API_URL}/${testPost.id}`, null, {
          auth: TEST_USERS.USER_A.token,
        });

        expect(response.status).toBe(200);
        expect(response.data.id).toBe(testPost.id);
        expect(response.data).toHaveProperty('author');
        expect(response.data).toHaveProperty('pin');
        expect(response.data).toHaveProperty('media_files');
        expect(response.data).toHaveProperty('is_favorited');
        expect(response.data).toHaveProperty('is_reposted');
      });

      test('TC-039: Public post retrieval (anonymous)', async () => {
        const response = await makeRequest('GET', `${POSTS_API_URL}/${testPost.id}`);

        expect(response.status).toBe(200);
        expect(response.data.id).toBe(testPost.id);
        expect(response.data.is_favorited).toBe(false);
        expect(response.data.is_reposted).toBe(false);
      });
    });

    describe('4.2 Error Cases', () => {
      test('TC-043: Non-existent post retrieval', async () => {
        const fakePostId = crypto.randomUUID();

        const response = await makeRequest('GET', `${POSTS_API_URL}/${fakePostId}`, null, {
          auth: TEST_USERS.USER_A.token,
        });

        expect(response.status).toBe(404);
        expect(response.data.error.code).toBe('POST_NOT_FOUND');
      });
    });
  });

  describe('5. Performance and Security Tests', () => {
    test('TC-PERF-001: Maximum media files post creation', async () => {
      const mediaFiles = [];
      for (let i = 0; i < 10; i++) {
        const media = await createTestMediaFile(TEST_USERS.USER_A.id);
        mediaFiles.push(media.id);
      }

      const idempotencyKey = crypto.randomUUID();
      const startTime = Date.now();

      const response = await makeRequest(
        'POST',
        POSTS_API_URL,
        {
          caption: 'Maximum media test',
          media_ids: mediaFiles,
          status: 'published',
        },
        {
          auth: TEST_USERS.USER_A.token,
          idempotencyKey,
        },
      );

      const duration = Date.now() - startTime;

      expect(response.status).toBe(201);
      expect(response.data.media_count).toBe(10);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('TC-PERF-003: Caption boundary value (2000 characters)', async () => {
      const caption = 'a'.repeat(2000);
      const idempotencyKey = crypto.randomUUID();

      const response = await makeRequest(
        'POST',
        POSTS_API_URL,
        {
          caption,
          status: 'published',
        },
        {
          auth: TEST_USERS.USER_A.token,
          idempotencyKey,
        },
      );

      expect(response.status).toBe(201);
      expect(response.data.caption).toHaveLength(2000);
    });
  });
});

// Export helper functions for external use
module.exports = {
  makeRequest,
  createTestMediaFile,
  createTestPin,
  cleanup,
  TEST_USERS,
  POSTS_API_URL,
};
