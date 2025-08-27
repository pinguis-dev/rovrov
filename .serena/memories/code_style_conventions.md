# Code Style and Conventions

## ESLint Configuration
- **Base Config**: Airbnb + Airbnb TypeScript + React Native
- **Parser**: @typescript-eslint/parser
- **Key Rules**:
  - Strict TypeScript rules enabled
  - React/React Native optimizations
  - Import order enforcement
  - Prettier integration
  - No console.log (warn level)
  - Japanese comments encouraged in implementation

## Prettier Configuration
- **Semi**: true
- **Trailing Comma**: all  
- **Single Quote**: true
- **Print Width**: 100
- **Tab Width**: 2 spaces
- **No tabs**: spaces only
- **End of Line**: lf

## TypeScript Standards
- **Strict mode**: enabled
- **No explicit any**: warn level
- **Unused vars**: warn with underscore prefix ignore
- **Function return types**: optional but encouraged
- **Interface over type**: prefer interfaces

## File Naming Conventions
- **Components**: PascalCase (e.g., AuthScreen.tsx)
- **Hooks**: camelCase with use prefix (e.g., useAuth.ts)
- **Utils**: camelCase (e.g., validation.ts)
- **Types**: PascalCase interfaces (e.g., User, AuthState)

## Import Order
1. React imports first
2. External libraries
3. Internal imports (@/ path)
4. Relative imports
5. Alphabetical within groups
6. Newlines between groups

## React Native Specific Rules
- No inline styles (warn)
- Split platform components
- No color literals (use design system)
- Proper prop types with TypeScript

## Component Structure
```typescript
// 1. Imports
import React from 'react';
// 2. Types/Interfaces  
interface Props {}
// 3. Component
const Component: React.FC<Props> = () => {
  // 4. Hooks
  // 5. Event handlers
  // 6. Render
};
// 7. Export
export default Component;
```