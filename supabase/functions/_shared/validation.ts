// utils/validation.ts
export const isValidUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

export const sanitizeUsername = (username: string): string => {
  return username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
};

export const validateImageUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  return validExtensions.some((ext) => url.toLowerCase().includes(ext));
};

export const isValidUuid = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// XSS対策のサニタイゼーション
export const sanitizeUserInput = (input: string): string => {
  if (!input) return input;

  // HTMLタグの完全除去
  const stripped = input.replace(/<[^>]*>/g, '');

  // 特殊文字のエスケープ
  const escaped = stripped
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return escaped;
};

// プロファイル更新データの型
export interface ProfileUpdateData {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  header_url?: string;
  location?: string;
  website_url?: string;
}

// バリデーション結果の型
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// プロファイル更新データのバリデーション
export const validateProfileUpdateData = (data: ProfileUpdateData): ValidationResult => {
  const errors: string[] = [];

  // username バリデーション
  if (data.username !== undefined) {
    if (data.username.length < 3 || data.username.length > 30) {
      errors.push('Username must be between 3 and 30 characters');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
      errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }
  }

  // display_name バリデーション
  if (
    data.display_name !== undefined &&
    data.display_name !== null &&
    data.display_name.length > 50
  ) {
    errors.push('Display name must be 50 characters or less');
  }

  // bio バリデーション
  if (data.bio !== undefined && data.bio !== null && data.bio.length > 300) {
    errors.push('Bio must be 300 characters or less');
  }

  // website_url バリデーション
  if (
    data.website_url !== undefined &&
    data.website_url !== null &&
    !isValidUrl(data.website_url)
  ) {
    errors.push('Invalid website URL');
  }

  // location バリデーション
  if (data.location !== undefined && data.location !== null && data.location.length > 100) {
    errors.push('Location must be 100 characters or less');
  }

  // avatar_url バリデーション
  if (data.avatar_url !== undefined && data.avatar_url !== null) {
    if (!isValidUrl(data.avatar_url)) {
      errors.push('Invalid avatar URL format');
    } else if (!validateImageUrl(data.avatar_url)) {
      errors.push('Avatar URL must be a valid image file');
    }
  }

  // header_url バリデーション
  if (data.header_url !== undefined && data.header_url !== null) {
    if (!isValidUrl(data.header_url)) {
      errors.push('Invalid header URL format');
    } else if (!validateImageUrl(data.header_url)) {
      errors.push('Header URL must be a valid image file');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// データのサニタイゼーション
export const sanitizeProfileUpdateData = (data: ProfileUpdateData): ProfileUpdateData => {
  const sanitized: ProfileUpdateData = {};

  if (data.username !== undefined) {
    sanitized.username = sanitizeUsername(data.username);
  }

  if (data.display_name !== undefined) {
    sanitized.display_name = data.display_name
      ? sanitizeUserInput(data.display_name)
      : data.display_name;
  }

  if (data.bio !== undefined) {
    sanitized.bio = data.bio ? sanitizeUserInput(data.bio) : data.bio;
  }

  if (data.location !== undefined) {
    sanitized.location = data.location ? sanitizeUserInput(data.location) : data.location;
  }

  // URLフィールドはサニタイズせずそのまま（バリデーション済み前提）
  if (data.avatar_url !== undefined) {
    sanitized.avatar_url = data.avatar_url;
  }

  if (data.header_url !== undefined) {
    sanitized.header_url = data.header_url;
  }

  if (data.website_url !== undefined) {
    sanitized.website_url = data.website_url;
  }

  return sanitized;
};
