# Design System Guidelines - Dieter Rams Principles

## Design Philosophy
RovRov follows Dieter Rams' 10 principles of good design:

1. **Innovative**: Passwordless authentication, intuitive UX
2. **Useful**: Simple, functional interfaces that serve user needs
3. **Aesthetic**: Golden ratio layouts, harmonious visual design
4. **Understandable**: Self-explanatory, no manual needed
5. **Unobtrusive**: Quietly supports user goals
6. **Honest**: No false promises, transparent functionality
7. **Long-lasting**: Timeless design, not trend-driven
8. **Thorough**: Every detail considered, all edge cases covered
9. **Environmentally friendly**: Dark mode for power efficiency
10. **As little design as possible**: Essential elements only, perfectly implemented

## Color Palette
```typescript
const colors = {
  neutral: {
    0: '#FFFFFF',    // Background
    100: '#F7F7F7',  // Soft accent
    200: '#F0F0F0',  // Input field background
    300: '#E0E0E0',  // Border (0.5px thin)
    500: '#8A9198',  // Footnote text
    600: '#666666',  // Body text
    700: '#3A3A3A',  // Title text
    800: '#2F2F2F',  // Primary button
  },
  semantic: {
    error: '#DC2626',    // Error state
    success: '#059669',  // Success state
    link: '#1D70B8',     // Link text
  }
};
```

## Typography System
```typescript
const typography = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: '200' }, // Logo
  title: { fontSize: 22, lineHeight: 28, fontWeight: '300' },   // Screen titles
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },    // Input, buttons
  footnote: { fontSize: 14, lineHeight: 20, fontWeight: '300' }, // Error, footer
};
```

## Layout Principles
- **Golden Ratio**: 1.618 ratio for spacing and proportions
- **Minimum Touch Target**: 48px, recommended 56px
- **Safe Areas**: Respect device safe areas
- **Spacing Scale**: 8px base unit (8, 16, 24, 32, 40, 48, 56, 80, 120px)

## Component States
```typescript
enum ComponentState {
  IDLE = 'idle',
  LOADING = 'loading', 
  SUCCESS = 'success',
  ERROR = 'error',
  DISABLED = 'disabled'
}
```

## Animation Guidelines
- **Duration**: 200-300ms for micro-interactions
- **Easing**: Natural, spring-based animations
- **Purpose**: Provide feedback, guide attention
- **Restraint**: Subtle, never distracting

## Accessibility Requirements
- **WCAG 2.1 AA**: Minimum compliance level
- **Color Contrast**: 4.5:1 minimum ratio
- **Screen Readers**: Full support with aria-labels
- **Keyboard Navigation**: Complete tab order support
- **Focus Management**: Clear focus indicators