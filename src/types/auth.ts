export interface User {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  user: User;
}

export interface AuthError {
  code: string;
  message: string;
}

export enum AuthState {
  IDLE = 'idle',
  VALIDATING = 'validating',
  SENDING = 'sending',
  SUCCESS = 'success',
  ERROR = 'error',
}
