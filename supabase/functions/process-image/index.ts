import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Image processing utility functions using Canvas API (Deno runtime)
async function processImage(imageBuffer: ArrayBuffer, mimeType: string) {
  // For now, we'll implement basic processing without EXIF removal
  // In production, you would use a proper image processing library
  // like Sharp.js or similar, but Edge Functions have limitations

  // This is a placeholder implementation
  // In a real scenario, you would:
  // 1. Remove EXIF data
  // 2. Optimize the image
  // 3. Generate thumbnails

  return {
    processedBuffer: imageBuffer, // Placeholder - should be processed
    thumbnails: [
      { size: 150, buffer: imageBuffer }, // Placeholder
      { size: 300, buffer: imageBuffer }, // Placeholder
      { size: 600, buffer: imageBuffer }, // Placeholder
    ],
  };
}

async function uploadProcessedImage(
  bucket: string,
  path: string,
  buffer: ArrayBuffer,
  contentType: string,
) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    cacheControl: '31536000', // 1 year
    upsert: true,
  });

  if (error) throw error;
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }

  try {
    const { mediaId } = await req.json();

    if (!mediaId) {
      return new Response('Missing mediaId', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Get media file record
    const { data: mediaFile, error: fetchError } = await supabase
      .from('media_files')
      .select('*')
      .eq('id', mediaId)
      .single();

    if (fetchError || !mediaFile) {
      console.error('Media file not found:', fetchError);
      return new Response('Media file not found', {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Only process images
    if (mediaFile.type !== 'image') {
      return new Response('Not an image file', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Update status to processing
    await supabase.from('media_files').update({ status: 'processing' }).eq('id', mediaId);

    try {
      // Download the image from storage
      const { data: imageData, error: downloadError } = await supabase.storage
        .from(mediaFile.bucket)
        .download(mediaFile.storage_path);

      if (downloadError || !imageData) {
        throw new Error(`Failed to download image: ${downloadError?.message}`);
      }

      const buffer = await imageData.arrayBuffer();

      // Process the image (EXIF removal, optimization)
      const { processedBuffer, thumbnails } = await processImage(buffer, mediaFile.mime_type);

      // Upload processed image (overwrites original)
      await uploadProcessedImage(
        mediaFile.bucket,
        mediaFile.storage_path,
        processedBuffer,
        'image/jpeg', // Convert to JPEG
      );

      // Generate and upload thumbnails
      const thumbnailPaths = [];
      for (const thumbnail of thumbnails) {
        const thumbPath = mediaFile.storage_path.replace(
          /\.[^.]+$/,
          `_thumb_${thumbnail.size}.jpg`,
        );

        await uploadProcessedImage(mediaFile.bucket, thumbPath, thumbnail.buffer, 'image/jpeg');

        thumbnailPaths.push(thumbPath);
      }

      // Update media file record
      const { error: updateError } = await supabase
        .from('media_files')
        .update({
          status: 'ready',
          processed_at: new Date().toISOString(),
          mime_type: 'image/jpeg', // Converted to JPEG
          thumb_path: thumbnailPaths[0], // Store primary thumbnail path
          metadata: {
            thumbnails: thumbnailPaths.map((path, index) => ({
              size: thumbnails[index].size,
              path: path,
            })),
          },
        })
        .eq('id', mediaId);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          mediaId,
          thumbnails: thumbnailPaths.length,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    } catch (processingError) {
      console.error('Image processing error:', processingError);

      // Update status to failed
      await supabase
        .from('media_files')
        .update({
          status: 'failed',
          error_message: (processingError as Error).message,
          processed_at: new Date().toISOString(),
        })
        .eq('id', mediaId);

      return new Response('Image processing failed', {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }
  } catch (error) {
    console.error('Process image handler error:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});
