import { describe, expect, it } from 'vitest';

import { renderBorderToken, renderMotionToken, renderTokenValue } from './render-token-value';
import type { MotionToken } from './tokens';

describe('renderTokenValue', () => {
  it('formats numeric values as pixels', () => {
    expect(renderTokenValue(16)).toBe('16px');
  });

  it('returns string tokens unchanged', () => {
    expect(renderTokenValue('#3A3A3A')).toBe('#3A3A3A');
  });

  it('formats border tokens with resolved color', () => {
    const border = { width: 0.3, color: 'color-border-hairline' } as const;
    const formatted = renderBorderToken(border, 'border-0.3', {
      'color-border-hairline': 'rgba(15, 23, 42, 0.18)',
    });

    expect(formatted).toBe('border-0.3: 0.3px / rgba(15, 23, 42, 0.18)');
  });

  it('serialises motion timing tokens with easing', () => {
    const motion: MotionToken = {
      duration: 260,
      easing: [0, 0, 0.2, 1],
    };

    expect(renderMotionToken(motion, 'motion-content')).toBe(
      'motion-content: 260ms • cubic-bezier(0, 0, 0.2, 1)',
    );
  });

  it('serialises motion spring tokens', () => {
    const motion: MotionToken = {
      type: 'spring',
      mass: 1,
      stiffness: 180,
      damping: 24,
    };

    expect(renderMotionToken(motion, 'motion-hero')).toBe(
      'motion-hero: spring(mass: 1, stiffness: 180, damping: 24)',
    );
  });
});
