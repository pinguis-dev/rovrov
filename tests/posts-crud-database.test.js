/**
 * BE-008 Posts CRUD Database Test Suite
 * Direct database testing of posts creation, update, deletion, and retrieval
 * Tests the core database logic without Edge Function layer
 * Based on task specification: tasks/BE-008.md
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test configuration - use anon key with RLS bypassed for testing
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test users (matching test data in database)
const TEST_USERS = {
  USER_A: {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'user_a_active@test.com',
  },
  USER_B: {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'user_b_active@test.com',
  },
};

// Helper functions
async function createTestMediaFile(userId, status = 'ready') {
  const { data, error } = await supabase
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

  if (error) throw error;
  return data;
}

async function createTestPin() {
  const { data, error } = await supabase
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

  if (error) throw error;
  return data;
}

// Display point calculation helper (matching posts-api implementation)
function calculateDisplayPoint(pinLocation, mapVisibility) {
  switch (mapVisibility) {
    case 'none':
      return null;
    case 'exact':
      return pinLocation;
    case 'approx_100m':
      const coords = pinLocation.coordinates;
      return {
        type: 'Point',
        coordinates: [Math.floor(coords[0] * 1000) / 1000, Math.floor(coords[1] * 1000) / 1000],
      };
    default:
      return null;
  }
}

// Status transition validation
function isValidStatusTransition(currentStatus, newStatus) {
  const validTransitions = {
    draft: ['published', 'temporary', 'archived'],
    published: ['archived'],
    temporary: ['published', 'archived'],
    archived: ['published', 'temporary'],
  };
  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

// Tag normalization
function normalizeTags(tags) {
  return [
    ...new Set(
      tags
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0 && tag.length <= 50)
        .slice(0, 10),
    ),
  ];
}

async function cleanup() {
  // Clean up test data in reverse dependency order
  await supabase.from('post_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('post_media').delete().neq('post_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase
    .from('idempotency_keys')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('media_files').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('pins').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

// Simulate posts creation (matching posts-api logic)
async function createPost(userId, postData) {
  const {
    caption,
    media_ids = [],
    pin_id,
    tags = [],
    visibility = 'public',
    map_visibility = 'none',
    status = 'draft',
  } = postData;

  // Validation
  if (caption && caption.length > 2000) {
    throw new Error('Caption must be 2000 characters or less');
  }

  if (media_ids.length === 0 && !caption?.trim()) {
    throw new Error('Post must have either media or caption');
  }

  if (media_ids.length > 10) {
    throw new Error('Maximum 10 media files per post');
  }

  // Media file validation
  if (media_ids.length > 0) {
    const { data: mediaFiles, error: mediaError } = await supabase
      .from('media_files')
      .select('id, status, user_id')
      .in('id', media_ids)
      .eq('user_id', userId);

    if (mediaError || mediaFiles.length !== media_ids.length) {
      throw new Error('Invalid or unauthorized media files');
    }

    const notReadyFiles = mediaFiles.filter((f) => f.status !== 'ready');
    if (notReadyFiles.length > 0) {
      throw new Error('Some media files are not ready for use');
    }
  }

  // Pin validation and display_point calculation
  let displayPoint = null;
  if (pin_id) {
    const { data: pin, error: pinError } = await supabase
      .from('pins')
      .select('location')
      .eq('id', pin_id)
      .single();

    if (pinError || !pin) {
      throw new Error('Invalid pin_id');
    }

    displayPoint = calculateDisplayPoint(pin.location, map_visibility);
  }

  // Tag normalization
  const normalizedTags = normalizeTags(tags);

  // Create post
  const postId = crypto.randomUUID();
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      id: postId,
      user_id: userId,
      caption,
      pin_id,
      display_point: displayPoint,
      visibility,
      map_visibility,
      status,
      published_at:
        status === 'published' || status === 'temporary' ? new Date().toISOString() : null,
      expires_at:
        status === 'temporary' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (postError) throw postError;

  // Media file associations
  if (media_ids.length > 0) {
    const mediaAssociations = media_ids.map((mediaId, index) => ({
      post_id: postId,
      media_id: mediaId,
      display_order: index + 1,
    }));

    const { error: mediaAssocError } = await supabase.from('post_media').insert(mediaAssociations);

    if (mediaAssocError) throw mediaAssocError;

    // Update media_files post_id
    const { error: mediaUpdateError } = await supabase
      .from('media_files')
      .update({
        post_id: postId,
        updated_at: new Date().toISOString(),
      })
      .in('id', media_ids);

    if (mediaUpdateError) throw mediaUpdateError;
  }

  // Tag associations
  if (normalizedTags.length > 0) {
    // Upsert tags
    const tagInserts = normalizedTags.map((tag) => ({ name: tag }));
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .upsert(tagInserts, { onConflict: 'name' })
      .select();

    if (tagsError) throw tagsError;

    // Create post-tag associations
    const postTagAssociations = tags.map((tag) => ({
      post_id: postId,
      tag_id: tag.id,
    }));

    const { error: postTagsError } = await supabase.from('post_tags').insert(postTagAssociations);

    if (postTagsError) throw postTagsError;
  }

  return {
    ...post,
    tags: normalizedTags,
    media_count: media_ids.length,
  };
}

describe('BE-008 Posts CRUD Database Test Suite', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('1. POST Creation Logic', () => {
    describe('1.1 Normal Operations', () => {
      test('TC-POST-001: Basic post creation', async () => {
        const postData = {
          caption: 'Test post caption',
          status: 'published',
          visibility: 'public',
        };

        const result = await createPost(TEST_USERS.USER_A.id, postData);

        expect(result.id).toBeDefined();
        expect(result.caption).toBe(postData.caption);
        expect(result.status).toBe(postData.status);
        expect(result.published_at).toBeDefined();
      });

      test('TC-POST-002: Media-attached post creation', async () => {
        const mediaFile = await createTestMediaFile(TEST_USERS.USER_A.id);

        const postData = {
          caption: 'Post with media',
          media_ids: [mediaFile.id],
          status: 'published',
          visibility: 'public',
        };

        const result = await createPost(TEST_USERS.USER_A.id, postData);

        expect(result.media_count).toBe(1);

        // Verify media association
        const { data: mediaUpdate } = await supabase
          .from('media_files')
          .select('post_id')
          .eq('id', mediaFile.id)
          .single();

        expect(mediaUpdate.post_id).toBe(result.id);
      });

      test('TC-POST-003: Pin-attached post (exact location)', async () => {
        const pin = await createTestPin();

        const postData = {
          caption: 'Post with exact location',
          pin_id: pin.id,
          map_visibility: 'exact',
          status: 'published',
        };

        const result = await createPost(TEST_USERS.USER_A.id, postData);

        expect(result.pin_id).toBe(pin.id);
        expect(result.display_point).toEqual(pin.location);
      });

      test('TC-POST-004: Pin-attached post (approximate location)', async () => {
        const pin = await createTestPin();

        const postData = {
          caption: 'Post with approximate location',
          pin_id: pin.id,
          map_visibility: 'approx_100m',
          status: 'published',
        };

        const result = await createPost(TEST_USERS.USER_A.id, postData);

        expect(result.display_point).toBeDefined();
        expect(result.display_point.coordinates).not.toEqual(pin.location.coordinates);
        // Verify coordinates are rounded to 100m grid
        expect(result.display_point.coordinates[0]).toBe(
          Math.floor(pin.location.coordinates[0] * 1000) / 1000,
        );
        expect(result.display_point.coordinates[1]).toBe(
          Math.floor(pin.location.coordinates[1] * 1000) / 1000,
        );
      });

      test('TC-POST-005: Tagged post creation', async () => {
        const postData = {
          caption: 'Post with tags',
          tags: ['test', 'Test', 'test', 'japanese', 'JAPANESE'], // Contains duplicates and case variations
          status: 'published',
        };

        const result = await createPost(TEST_USERS.USER_A.id, postData);

        expect(result.tags).toHaveLength(2); // Duplicates removed
        expect(result.tags).toContain('test');
        expect(result.tags).toContain('japanese');
      });

      test('TC-POST-006: Temporary post creation', async () => {
        const postData = {
          caption: 'Temporary post',
          status: 'temporary',
        };

        const result = await createPost(TEST_USERS.USER_A.id, postData);

        expect(result.status).toBe('temporary');
        expect(result.expires_at).toBeDefined();
        expect(result.published_at).toBeDefined();

        // Verify expires_at is approximately 24 hours from now
        const expiresAt = new Date(result.expires_at);
        const expectedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        expect(Math.abs(expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(5000); // Within 5 seconds
      });
    });

    describe('1.2 Validation Errors', () => {
      test('TC-POST-011: Caption character limit exceeded', async () => {
        const longCaption = 'a'.repeat(2001);

        const postData = {
          caption: longCaption,
          status: 'published',
        };

        await expect(createPost(TEST_USERS.USER_A.id, postData)).rejects.toThrow('2000 characters');
      });

      test('TC-POST-012: Media file limit exceeded', async () => {
        const mediaFiles = [];
        for (let i = 0; i < 11; i++) {
          const media = await createTestMediaFile(TEST_USERS.USER_A.id);
          mediaFiles.push(media.id);
        }

        const postData = {
          caption: 'Too many media files',
          media_ids: mediaFiles,
          status: 'published',
        };

        await expect(createPost(TEST_USERS.USER_A.id, postData)).rejects.toThrow(
          'Maximum 10 media',
        );
      });

      test('TC-POST-013: Empty content error', async () => {
        const postData = {
          caption: '',
          media_ids: [],
          status: 'published',
        };

        await expect(createPost(TEST_USERS.USER_A.id, postData)).rejects.toThrow(
          'either media or caption',
        );
      });

      test('TC-POST-014: Invalid media ID', async () => {
        const postData = {
          caption: 'Invalid media test',
          media_ids: [crypto.randomUUID()],
          status: 'published',
        };

        await expect(createPost(TEST_USERS.USER_A.id, postData)).rejects.toThrow(
          'Invalid or unauthorized',
        );
      });

      test('TC-POST-015: Other users media file', async () => {
        const mediaFile = await createTestMediaFile(TEST_USERS.USER_B.id);

        const postData = {
          caption: 'Unauthorized media test',
          media_ids: [mediaFile.id],
          status: 'published',
        };

        await expect(createPost(TEST_USERS.USER_A.id, postData)).rejects.toThrow(
          'Invalid or unauthorized',
        );
      });

      test('TC-POST-016: Invalid Pin ID', async () => {
        const postData = {
          caption: 'Invalid pin test',
          pin_id: crypto.randomUUID(),
          status: 'published',
        };

        await expect(createPost(TEST_USERS.USER_A.id, postData)).rejects.toThrow('Invalid pin_id');
      });
    });
  });

  describe('2. Status Transition Validation', () => {
    test('TC-PATCH-006: Valid status transitions', () => {
      // Test all valid transitions
      expect(isValidStatusTransition('draft', 'published')).toBe(true);
      expect(isValidStatusTransition('draft', 'temporary')).toBe(true);
      expect(isValidStatusTransition('draft', 'archived')).toBe(true);
      expect(isValidStatusTransition('published', 'archived')).toBe(true);
      expect(isValidStatusTransition('temporary', 'published')).toBe(true);
      expect(isValidStatusTransition('temporary', 'archived')).toBe(true);
      expect(isValidStatusTransition('archived', 'published')).toBe(true);
      expect(isValidStatusTransition('archived', 'temporary')).toBe(true);
    });

    test('TC-PATCH-007: Invalid status transitions', () => {
      // Test invalid transitions
      expect(isValidStatusTransition('published', 'draft')).toBe(false);
      expect(isValidStatusTransition('published', 'temporary')).toBe(false);
      expect(isValidStatusTransition('temporary', 'draft')).toBe(false);
      expect(isValidStatusTransition('archived', 'draft')).toBe(false);
    });
  });

  describe('3. Database Operations', () => {
    let testPost;

    beforeEach(async () => {
      // Create a test post for update/delete operations
      const { data } = await supabase
        .from('posts')
        .insert({
          id: crypto.randomUUID(),
          user_id: TEST_USERS.USER_A.id,
          caption: 'Test post for operations',
          status: 'draft',
          visibility: 'public',
        })
        .select()
        .single();

      testPost = data;
    });

    test('TC-PATCH-001: Basic information update', async () => {
      const updateData = {
        caption: 'Updated caption',
        visibility: 'private',
        updated_at: new Date().toISOString(),
      };

      const { data: updatedPost, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', testPost.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updatedPost.caption).toBe(updateData.caption);
      expect(updatedPost.visibility).toBe(updateData.visibility);
      expect(updatedPost.updated_at).not.toBe(testPost.updated_at);
    });

    test('TC-DELETE-001: Logical deletion', async () => {
      const { error } = await supabase
        .from('posts')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', testPost.id);

      expect(error).toBeNull();

      // Verify logical deletion
      const { data: deletedPost } = await supabase
        .from('posts')
        .select('deleted_at')
        .eq('id', testPost.id)
        .single();

      expect(deletedPost.deleted_at).toBeDefined();
    });

    test('TC-GET-001: Post retrieval with relationships', async () => {
      const pin = await createTestPin();
      const mediaFile = await createTestMediaFile(TEST_USERS.USER_A.id);

      // Update post with pin and media
      await supabase.from('posts').update({ pin_id: pin.id }).eq('id', testPost.id);
      await supabase.from('media_files').update({ post_id: testPost.id }).eq('id', mediaFile.id);

      // Retrieve with relationships
      const { data: post, error } = await supabase
        .from('posts')
        .select(
          `
          *,
          pins (*),
          media_files (*)
        `,
        )
        .eq('id', testPost.id)
        .single();

      expect(error).toBeNull();
      expect(post.pins).toBeDefined();
      expect(post.media_files).toHaveLength(1);
      expect(post.media_files[0].id).toBe(mediaFile.id);
    });
  });

  describe('4. Performance Tests', () => {
    test('TC-PERF-001: Maximum media files post creation', async () => {
      const mediaFiles = [];
      for (let i = 0; i < 10; i++) {
        const media = await createTestMediaFile(TEST_USERS.USER_A.id);
        mediaFiles.push(media.id);
      }

      const startTime = Date.now();

      const result = await createPost(TEST_USERS.USER_A.id, {
        caption: 'Maximum media test',
        media_ids: mediaFiles,
        status: 'published',
      });

      const duration = Date.now() - startTime;

      expect(result.media_count).toBe(10);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('TC-PERF-003: Caption boundary value (2000 characters)', async () => {
      const caption = 'a'.repeat(2000);

      const result = await createPost(TEST_USERS.USER_A.id, {
        caption,
        status: 'published',
      });

      expect(result.caption).toHaveLength(2000);
    });
  });

  describe('5. Idempotency Key Logic', () => {
    test('TC-POST-007: Idempotency key storage', async () => {
      const idempotencyKey = crypto.randomUUID();
      const userId = TEST_USERS.USER_A.id;
      const endpoint = 'POST /posts';
      const responseData = { test: 'data' };

      // Store idempotency key
      const { data, error } = await supabase
        .from('idempotency_keys')
        .insert({
          key: idempotencyKey,
          user_id: userId,
          endpoint: endpoint,
          response_data: responseData,
          status_code: 201,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.key).toBe(idempotencyKey);
      expect(data.user_id).toBe(userId);
      expect(data.endpoint).toBe(endpoint);
      expect(data.expires_at).toBeDefined();
    });

    test('TC-POST-008: Duplicate idempotency key detection', async () => {
      const idempotencyKey = crypto.randomUUID();
      const userId = TEST_USERS.USER_A.id;
      const endpoint = 'POST /posts';

      // First insertion
      await supabase.from('idempotency_keys').insert({
        key: idempotencyKey,
        user_id: userId,
        endpoint: endpoint,
        response_data: { first: 'request' },
        status_code: 201,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      // Check for existing response
      const { data: existing } = await supabase
        .from('idempotency_keys')
        .select('response_data, status_code')
        .eq('key', idempotencyKey)
        .eq('user_id', userId)
        .eq('endpoint', endpoint)
        .gt('expires_at', new Date().toISOString())
        .single();

      expect(existing).toBeDefined();
      expect(existing.response_data.first).toBe('request');
      expect(existing.status_code).toBe(201);
    });
  });
});

// Export helper functions for external use
module.exports = {
  createPost,
  createTestMediaFile,
  createTestPin,
  calculateDisplayPoint,
  isValidStatusTransition,
  normalizeTags,
  cleanup,
  TEST_USERS,
};
