# Code Style and Conventions

## TypeScript Configuration
- **Strict Mode**: Enabled (`"strict": true`)
- **Type Safety**: All code must include proper TypeScript types
- **No implicit any**: Avoid using `any` type
- **Extends**: Uses Expo's base TypeScript configuration

## File Organization
```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components (Timeline, Rove, Post, Account)
├── navigation/     # Navigation configuration
├── services/       # External services (Supabase)
├── store/          # Global state (Zustand)
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
└── assets/         # Images, fonts, etc.
```

## Naming Conventions
- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase (e.g., `TimelineScreen.tsx`)
- **Hooks**: camelCase starting with "use" (e.g., `useAuth.ts`)
- **Types**: PascalCase with descriptive names (e.g., `UserProfile`, `PostData`)
- **Constants**: UPPER_SNAKE_CASE

## Code Quality Standards
- All files must be properly typed
- Use functional components with hooks
- Implement proper error handling
- Follow React Native best practices
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

## Import Order
1. React and React Native imports
2. Third-party libraries
3. Internal utilities and services
4. Component imports
5. Type imports (using `import type`)

## Environment Variables
- Use `.env.example` as template
- Never commit actual environment values
- Use `EXPO_PUBLIC_` prefix for client-accessible variables