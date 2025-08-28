import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { corsHeaders } from '../_shared/cors.ts';
import { getAuthUser, supabase } from '../_shared/auth.ts';
import {
  isValidUuid,
  validateProfileUpdateData,
  sanitizeProfileUpdateData,
} from '../_shared/validation.ts';
import {
  PROFILE_ERROR_CODES,
  type ApiErrorResponse,
  type ProfileData,
  type PublicProfileData,
  type ProfileWithStats,
  type ProfileUpdatePayload,
} from '../_shared/types.ts';

// Helper function to create error responses
const createErrorResponse = (
  code: string,
  message: string,
  status: number,
  details?: string[],
): Response => {
  const errorResponse: ApiErrorResponse = {
    error: { code: code as any, message, ...(details && { details }) },
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
};

// GET /profiles/{user_id} - プロファイル取得
const handleGetProfile = async (userId: string, request: Request): Promise<Response> => {
  // UUID形式チェック
  if (!isValidUuid(userId)) {
    return createErrorResponse(PROFILE_ERROR_CODES.INVALID_UUID_FORMAT, 'Invalid UUID format', 400);
  }

  const authUser = await getAuthUser(request);

  try {
    // 認証状態による処理分岐
    if (authUser) {
      // 認証済みユーザー: profilesテーブルから詳細情報を取得
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(
          `
          id, username, display_name, bio, avatar_url, header_url,
          location, website_url, created_at, updated_at, status,
          (SELECT COUNT(*) FROM follows WHERE following_id = profiles.id) as followers_count,
          (SELECT COUNT(*) FROM follows WHERE follower_id = profiles.id) as following_count,
          (SELECT COUNT(*) FROM posts WHERE user_id = profiles.id AND status = 'published') as posts_count
        `,
        )
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return createErrorResponse(PROFILE_ERROR_CODES.PROFILE_NOT_FOUND, 'Profile not found', 404);
      }

      // suspended/pending_deletionユーザーの可視性制御
      if (profile.status === 'suspended' && authUser.id !== userId) {
        return createErrorResponse(
          PROFILE_ERROR_CODES.PROFILE_SUSPENDED,
          'Profile is suspended',
          403,
        );
      }

      if (profile.status === 'pending_deletion') {
        return createErrorResponse(PROFILE_ERROR_CODES.PROFILE_NOT_FOUND, 'Profile not found', 404);
      }

      return new Response(JSON.stringify(profile), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } else {
      // 匿名ユーザー: public_profilesビューから限定的な情報を取得
      const { data: profile, error } = await supabase
        .from('public_profiles')
        .select(
          `
          id, username, display_name, bio, avatar_url, header_url,
          location, website_url, created_at,
          followers_count, following_count, posts_count
        `,
        )
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return createErrorResponse(PROFILE_ERROR_CODES.PROFILE_NOT_FOUND, 'Profile not found', 404);
      }

      // Cache headers for public profiles
      const response = new Response(JSON.stringify(profile), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=600',
          'CDN-Cache-Control': 'max-age=600',
          ...corsHeaders,
        },
      });

      return response;
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500);
  }
};

// PATCH /profiles/{user_id} - プロファイル更新
const handleUpdateProfile = async (userId: string, request: Request): Promise<Response> => {
  // UUID形式チェック
  if (!isValidUuid(userId)) {
    return createErrorResponse(PROFILE_ERROR_CODES.INVALID_UUID_FORMAT, 'Invalid UUID format', 400);
  }

  const authUser = await getAuthUser(request);

  // 認証チェック
  if (!authUser || authUser.id !== userId) {
    return createErrorResponse(
      PROFILE_ERROR_CODES.UNAUTHORIZED,
      'Not authorized to update this profile',
      403,
    );
  }

  try {
    const updateData: ProfileUpdatePayload = await request.json();

    // バリデーション
    const validationResult = validateProfileUpdateData(updateData);
    if (!validationResult.isValid) {
      return createErrorResponse(
        PROFILE_ERROR_CODES.VALIDATION_ERROR,
        'Validation failed',
        400,
        validationResult.errors,
      );
    }

    // username重複チェック
    if (updateData.username) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', updateData.username)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return createErrorResponse(
          PROFILE_ERROR_CODES.USERNAME_TAKEN,
          'Username is already taken',
          409,
        );
      }
    }

    // データサニタイゼーション
    const sanitizedData = sanitizeProfileUpdateData(updateData);

    // 更新実行
    const updateFields = {
      ...sanitizedData,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateFields)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return createErrorResponse(
        PROFILE_ERROR_CODES.UPDATE_FAILED,
        'Failed to update profile',
        500,
      );
    }

    return new Response(JSON.stringify(updatedProfile), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500);
  }
};

Deno.serve(async (req: Request) => {
  // CORS preflight handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // パス形式: /profiles/{user_id}
    if (pathSegments.length !== 2 || pathSegments[0] !== 'profiles') {
      return createErrorResponse('INVALID_ENDPOINT', 'Invalid endpoint', 404);
    }

    const userId = pathSegments[1];

    switch (req.method) {
      case 'GET':
        return await handleGetProfile(userId, req);

      case 'PATCH':
        return await handleUpdateProfile(userId, req);

      default:
        return createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500);
  }
});
