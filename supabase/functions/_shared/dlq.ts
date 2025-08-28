import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

export interface DLQEvent {
  external_id: string;
  provider: string;
  event_data: any;
  error_message: string;
}

export const DLQService = {
  async sendToDLQ(event: DLQEvent): Promise<void> {
    try {
      const { error } = await supabase.from('failed_webhook_events').insert({
        external_id: event.external_id,
        provider: event.provider,
        event_data: event.event_data,
        error_message: event.error_message,
        retry_count: 0,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('DLQ insertion error:', error);
        throw error;
      }
    } catch (dlqError) {
      console.error('Failed to send event to DLQ:', dlqError);
      throw dlqError;
    }
  },

  async getFailedEvents(limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('failed_webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch DLQ events:', error);
      throw error;
    }

    return data || [];
  },

  async retryEvent(eventId: string): Promise<boolean> {
    try {
      const { data: event, error: fetchError } = await supabase
        .from('failed_webhook_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (fetchError || !event) {
        throw new Error('Event not found');
      }

      // Increment retry count
      const { error: updateError } = await supabase
        .from('failed_webhook_events')
        .update({
          retry_count: event.retry_count + 1,
          last_retry_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (updateError) {
        throw updateError;
      }

      // Here you would trigger the retry logic
      // For now, we'll just mark it as retried
      return true;
    } catch (error) {
      console.error('Retry event error:', error);
      return false;
    }
  },

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('failed_webhook_events').delete().eq('id', eventId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Delete DLQ event error:', error);
      return false;
    }
  },
};
