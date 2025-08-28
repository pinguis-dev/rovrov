import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Verify JWT and get user
    const jwt = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: { code: 'UNAUTHORIZED', message: 'Invalid authentication token' },
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method allowed' },
        }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { fileName, fileSize, mimeType } = await req.json();

    // Validate required fields
    if (!fileName || !fileSize || !mimeType) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_REQUEST',
            message: 'fileName, fileSize, and mimeType are required',
          },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // File size validation (10MB for images)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (fileSize > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          error: { code: 'FILE_TOO_LARGE', message: 'File size must be less than 10MB' },
        }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // MIME type validation
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(mimeType)) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed',
          },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Extension spoofing protection
    const validExtensions: Record<string, string[]> = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    };

    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    if (!validExtensions[mimeType]?.includes(fileExtension)) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'EXTENSION_MISMATCH',
            message: 'File extension does not match MIME type',
          },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Generate unique file ID and sanitize file name
    const fileId = crypto.randomUUID();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '');
    const storagePath = `posts/${user.id}/${fileId}/${sanitizedFileName}`;

    // Create media_files record
    const { data: mediaFile, error: dbError } = await supabase
      .from('media_files')
      .insert({
        id: fileId,
        user_id: user.id,
        file_name: sanitizedFileName,
        mime_type: mimeType,
        file_size: fileSize,
        storage_path: storagePath,
        path: storagePath,
        bucket: 'posts',
        type: 'image',
        status: 'uploading',
        storage_provider: 'supabase_storage',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({
          error: { code: 'DATABASE_ERROR', message: 'Failed to create media record' },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Generate signed upload URL (1 hour expiry)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('posts')
      .createSignedUploadUrl(storagePath, {
        expiresIn: 3600, // 1 hour
        upsert: false,
      });

    if (urlError) {
      console.error('Storage URL error:', urlError);
      // Cleanup database record on failure
      await supabase.from('media_files').delete().eq('id', fileId);

      return new Response(
        JSON.stringify({
          error: { code: 'UPLOAD_URL_FAILED', message: 'Failed to generate upload URL' },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        media_id: fileId,
        upload_url: signedUrl.signedUrl,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Media upload URL generation error:', error);
    return new Response(
      JSON.stringify({
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
