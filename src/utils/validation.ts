export const emailValidation = {
  pattern:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  maxLength: 255,

  validate: (email: string): boolean => {
    const trimmed = email.trim();
    return emailValidation.pattern.test(trimmed) && trimmed.length <= emailValidation.maxLength;
  },

  normalize: (email: string): string => {
    return email.toLowerCase().trim();
  },
};
