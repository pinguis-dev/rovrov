import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { CloudflareStreamAPI } from '../_shared/cloudflareStream.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

interface StreamWebhookEvent {
  id: string;
  eventType: string;
  uid: string;
  duration?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  errorMessage?: string;
  metadata?: Record<string, string>;
}

async function sendToDLQ(event: StreamWebhookEvent, error: Error) {
  try {
    await supabase.from('failed_webhook_events').insert({
      external_id: event.id,
      provider: 'cloudflare_stream',
      event_data: event,
      error_message: error.message,
      retry_count: 0,
      created_at: new Date().toISOString(),
    });
  } catch (dlqError) {
    console.error('DLQ insertion error:', dlqError);
  }
}

async function processStreamEvent(event: StreamWebhookEvent) {
  const { uid, eventType, metadata } = event;

  switch (eventType) {
    case 'video.upload.complete': {
      const updateData: any = {
        status: 'ready',
        processed_at: new Date().toISOString(),
      };

      if (event.duration || event.dimensions) {
        updateData.metadata = {
          duration: event.duration,
          dimensions: event.dimensions,
        };
        if (event.dimensions) {
          updateData.width = event.dimensions.width;
          updateData.height = event.dimensions.height;
        }
        if (event.duration) {
          updateData.duration_seconds = event.duration;
        }
      }

      const { error } = await supabase
        .from('media_files')
        .update(updateData)
        .eq('external_id', uid);

      if (error) throw error;
      break;
    }

    case 'video.upload.failed': {
      const { error } = await supabase
        .from('media_files')
        .update({
          status: 'failed',
          error_message: event.errorMessage || 'Video upload failed',
          processed_at: new Date().toISOString(),
        })
        .eq('external_id', uid);

      if (error) throw error;
      break;
    }

    case 'video.processing.complete': {
      // Additional processing complete event (if needed)
      const { error } = await supabase
        .from('media_files')
        .update({
          status: 'ready',
          processed_at: new Date().toISOString(),
        })
        .eq('external_id', uid);

      if (error) throw error;
      break;
    }

    default:
      console.log(`Unhandled event type: ${eventType}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
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
    // Get webhook signature
    const signature = req.headers.get('cf-signature');
    const body = await req.text();

    // Verify webhook signature
    if (!CloudflareStreamAPI.verifyWebhookSignature(body, signature)) {
      return new Response('Invalid signature', {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    let event: StreamWebhookEvent;
    try {
      event = JSON.parse(body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response('Invalid JSON', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Check for duplicate events (idempotency)
    const eventId = event.id;
    if (!eventId) {
      return new Response('Missing event ID', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('external_id', eventId)
      .single();

    if (existingEvent) {
      return new Response('Event already processed', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Record event
    const { error: eventError } = await supabase.from('webhook_events').insert({
      external_id: eventId,
      provider: 'cloudflare_stream',
      event_type: event.eventType,
      processed_at: new Date().toISOString(),
    });

    if (eventError) {
      console.error('Event recording error:', eventError);
      // Don't fail the webhook for this
    }

    // Process the event
    try {
      await processStreamEvent(event);
      return new Response('OK', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    } catch (processingError) {
      console.error('Stream webhook processing error:', processingError);

      // Send to DLQ for retry
      await sendToDLQ(event, processingError as Error);

      return new Response('Processing failed', {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});
