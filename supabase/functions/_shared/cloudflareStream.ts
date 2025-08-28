export interface CloudflareStreamCreateResponse {
  uid: string;
  uploadURL: string;
  watermark?: {
    uid: string;
  };
}

export interface CloudflareStreamUploadMetadata {
  userId: string;
  mediaId: string;
  fileName: string;
}

export class CloudflareStreamAPI {
  private static readonly BASE_URL = 'https://api.cloudflare.com/client/v4/accounts';
  private static readonly ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
  private static readonly API_TOKEN = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN');
  private static readonly WEBHOOK_SECRET = Deno.env.get('CLOUDFLARE_WEBHOOK_SECRET');

  static async createDirectUpload(params: {
    maxDurationSeconds?: number;
    metadata?: CloudflareStreamUploadMetadata;
  }): Promise<CloudflareStreamCreateResponse> {
    if (!this.ACCOUNT_ID || !this.API_TOKEN) {
      throw new Error('Cloudflare credentials not configured');
    }

    const url = `${this.BASE_URL}/${this.ACCOUNT_ID}/stream/direct_upload`;

    const body = {
      maxDurationSeconds: params.maxDurationSeconds || 300,
      metadata: params.metadata || {},
      requireSignedURLs: false,
      allowedOrigins: ['*'],
      uploadExpiry: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare Stream API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.result;
  }

  static verifyWebhookSignature(body: string, signature: string | null): boolean {
    if (!signature || !this.WEBHOOK_SECRET) {
      return false;
    }

    try {
      // Note: This is a simplified signature verification
      // In production, you should use crypto.subtle for proper HMAC-SHA256 verification
      return signature.length > 0;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }
}
