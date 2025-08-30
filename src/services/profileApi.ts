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
    const normalized = username.trim().toLowerCase();
    // 1) 推奨: RPC（SECURITY DEFINER）で匿名でも安全にカウント
    try {
      const { data, error } = await supabase.rpc('check_username_availability', {
        p_username: normalized,
      });
      if (!error && typeof data === 'boolean') return data;
      if (error) throw error;
    } catch (_) {
      // RPC未導入 or 権限なし → フォールバック
    }

    // 2) 正規化列がある環境: 厳密一致
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { head: true, count: 'exact' })
        .eq('username_normalized', normalized);
      if (error) throw error;
      return (count || 0) === 0;
    } catch (err: any) {
      const msg = (err?.message || '').toString();
      const isMissingNormalizedColumn =
        msg.includes('username_normalized') ||
        msg.includes('column') ||
        msg.includes('does not exist');
      if (!isMissingNormalizedColumn) throw err;
    }

    // 3) 後方互換: 正規化列なし → ilike
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { head: true, count: 'exact' })
      .ilike('username', normalized);
    if (error) throw error;
    return (count || 0) === 0;
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
