// Profile related types
export interface ProfileData {
  id: string;
  username: string;
  email?: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  header_url: string | null;
  location: string | null;
  website_url: string | null;
  status: 'active' | 'suspended' | 'pending_deletion' | 'deleted';
  suspended_until: string | null;
  moderation_note: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProfileStats {
  followers_count: number;
  following_count: number;
  posts_count: number;
}

export interface PublicProfileData {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  header_url: string | null;
  location: string | null;
  website_url: string | null;
  created_at: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
}

export interface ProfileWithStats extends ProfileData, ProfileStats {}

// Error codes for profile operations
export const PROFILE_ERROR_CODES = {
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  PROFILE_SUSPENDED: 'PROFILE_SUSPENDED',
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UPDATE_FAILED: 'UPDATE_FAILED',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  INVALID_UUID_FORMAT: 'INVALID_UUID_FORMAT',
  BLOCKED_USER: 'BLOCKED_USER',
} as const;

export type ProfileErrorCode = (typeof PROFILE_ERROR_CODES)[keyof typeof PROFILE_ERROR_CODES];

// API Error response structure
export interface ApiError {
  code: ProfileErrorCode;
  message: string;
  details?: string[];
}

export interface ApiErrorResponse {
  error: ApiError;
}

// Profile update payload
export interface ProfileUpdatePayload {
  username?: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  header_url?: string | null;
  location?: string | null;
  website_url?: string | null;
}
