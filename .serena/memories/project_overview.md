# RovRov SNS App - Project Overview

## Project Purpose
RovRov SNS app is a location-based social networking application for sharing daily happiness moments with photo/video posts, map exploration, and timeline features.

## Tech Stack
- **Frontend**: React Native + Expo + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **State Management**: Zustand
- **Navigation**: React Navigation (Bottom tabs + Stack)
- **Maps**: React Native Maps (Google Maps SDK)
- **Styling**: Custom design system based on Dieter Rams principles
- **Media**: Expo Image Picker, Expo Camera
- **Security**: Expo SecureStore for token storage

## Key Features
- Magic link authentication (passwordless)
- Location-based posts with pin management
- Interactive map exploration
- Timeline feed
- User profiles and social features
- Offline synchronization

## Project Structure
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

## Current Status
- ✅ Basic project structure
- ✅ TypeScript configuration
- ✅ Navigation setup
- ✅ Screen scaffolding
- ✅ Supabase integration setup
- ✅ Auth state management
- ⏳ Magic link authentication (FE-002 in progress)
- ⏳ Post creation with media
- ⏳ Map integration
- ⏳ Timeline feed
- ⏳ User profiles