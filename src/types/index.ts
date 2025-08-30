// TypeScript型定義

export interface Profile {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  header_url?: string;
  location?: string;
  website_url?: string;
  created_at: string;
  updated_at?: string;
  status: 'active' | 'suspended' | 'pending_deletion';
}

export interface ProfileFormData {
  username: string;
  display_name: string;
  bio: string;
  location: string;
  website_url: string;
  avatar_url?: string;
  header_url?: string;
}
