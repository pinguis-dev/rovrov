export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  header_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  caption?: string;
  visibility: 'public' | 'friends' | 'private';
  status: 'draft' | 'temporary' | 'published' | 'archived';
  location?: {
    latitude: number;
    longitude: number;
    display_latitude?: number;
    display_longitude?: number;
  };
  pin_id?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  media: Media[];
  user?: User;
  pin?: Pin;
}

export interface Media {
  id: string;
  post_id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail_url?: string;
  visibility: 'inherit' | 'public' | 'friends' | 'private';
  order: number;
  created_at: string;
}

export interface Pin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  display_latitude: number;
  display_longitude: number;
  category?: string;
  address?: string;
  phone?: string;
  hours?: string;
  external_id?: string;
  external_source?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

export interface PostTag {
  post_id: string;
  tag_id: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Pinning {
  id: string;
  user_id: string;
  pin_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export type TabRoute = 'Timeline' | 'Rove' | 'Post' | 'Account';

export interface NavigationTabParamList {
  Timeline: undefined;
  Rove: undefined;
  Post: undefined;
  Account: undefined;
}