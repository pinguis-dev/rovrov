import { Profile, ProfileFormData } from '../types';

import { supabase } from './supabase';

export const profileApi = {
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, profileData: ProfileFormData): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    // If error.code === 'PGRST116', no rows returned (username available)
    if (error?.code === 'PGRST116') return true;
    if (error) throw error;

    return !data; // データが存在しない = 使用可能
  },

  async uploadProfileImage(uri: string, type: 'avatar' | 'header'): Promise<{ url: string }> {
    const fileExt = uri.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${type}s/${fileName}`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from(type === 'avatar' ? 'avatars' : 'headers')
      .upload(filePath, blob, {
        contentType: blob.type,
        cacheControl: '3600',
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(type === 'avatar' ? 'avatars' : 'headers').getPublicUrl(data.path);

    return { url: publicUrl };
  },
};
