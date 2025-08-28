import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { CloudflareStreamAPI } from '../_shared/cloudflareStream.ts';

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

    const { fileName, fileSize } = await req.json();

    // Validate required fields
    if (!fileName || !fileSize) {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_REQUEST', message: 'fileName and fileSize are required' },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // File size validation (100MB for videos)
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    if (fileSize > MAX_VIDEO_SIZE) {
      return new Response(
        JSON.stringify({
          error: { code: 'FILE_TOO_LARGE', message: 'Video size must be less than 100MB' },
        }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const fileId = crypto.randomUUID();

    try {
      // Create Cloudflare Stream direct upload URL
      const streamResponse = await CloudflareStreamAPI.createDirectUpload({
        maxDurationSeconds: 300, // 5 minutes
        metadata: {
          userId: user.id,
          mediaId: fileId,
          fileName: fileName,
        },
      });

      // Create media_files record
      const { data: mediaFile, error: dbError } = await supabase
        .from('media_files')
        .insert({
          id: fileId,
          user_id: user.id,
          file_name: fileName,
          mime_type: 'video/mp4', // Cloudflare Stream auto-converts
          file_size: fileSize,
          external_id: streamResponse.uid,
          storage_provider: 'cloudflare_stream',
          bucket: 'cloudflare-stream',
          path: streamResponse.uid,
          type: 'video',
          status: 'uploading',
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

      return new Response(
        JSON.stringify({
          media_id: fileId,
          upload_url: streamResponse.uploadURL,
          stream_uid: streamResponse.uid,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    } catch (streamError) {
      console.error('Cloudflare Stream error:', streamError);
      return new Response(
        JSON.stringify({
          error: { code: 'STREAM_UPLOAD_FAILED', message: 'Failed to initialize video upload' },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
  } catch (error) {
    console.error('Stream upload error:', error);
    return new Response(
      JSON.stringify({
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
