import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface AuthUser {
  id: string;
  email?: string;
  aud: string;
  role?: string;
  exp?: number;
  iat?: number;
}

// リクエストから認証ユーザーを取得
export const getAuthUser = async (request: Request): Promise<AuthUser | null> => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // "Bearer " を除去

    // JWTトークンを検証
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      aud: user.aud,
      role: user.role,
    };
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
};

// 認証が必要なエンドポイントで認証チェック
export const requireAuth = async (request: Request): Promise<AuthUser> => {
  const user = await getAuthUser(request);
  if (!user) {
    throw new Response(
      JSON.stringify({
        error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }
  return user;
};

// 本人確認（特定のuser_idが認証ユーザーと一致するかチェック）
export const requireSelfAccess = async (request: Request, userId: string): Promise<AuthUser> => {
  const user = await requireAuth(request);

  if (user.id !== userId) {
    throw new Response(
      JSON.stringify({
        error: { code: 'UNAUTHORIZED', message: 'Not authorized to access this resource' },
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return user;
};
