# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

RovRov SNS app development initialized with spec-driven workflow. Active specifications:

- **rovrov-sns-app**: Location-based social networking app for sharing daily happiness moments with photo/video posts, map exploration, and timeline features

## Active Specifications

- `.kiro/specs/rovrov-sns-app/` - Main SNS application specification

## Common Commands

```bash
# Install dependencies
npm install

# iOS setup (macOS only)
cd ios && pod install && cd ..

# Run on iOS
npm run ios

# Run on Android
npm run android

# Start Metro bundler
npm start

# Type checking
npm run typecheck

# Linting
npm run lint

# Testing
npm test

# Media API Testing
npm run test:media
```

## Architecture Overview

### Tech Stack

- **React Native 0.73.2** - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **Supabase** - Backend (Auth, Database, Storage)
- **React Navigation** - Navigation (Bottom tabs + Stack)
- **Zustand** - State management
- **React Native Maps** - Map functionality

### Project Structure

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

### Key Features Implementation Status

- ✅ Basic project structure
- ✅ TypeScript configuration
- ✅ Navigation setup (Bottom tabs)
- ✅ Screen scaffolding (Timeline, Rove, Post, Account)
- ✅ Supabase integration setup
- ✅ Auth state management (Zustand)
- ✅ Media Upload API (BE-007)
  - ✅ Image upload with signed URLs (10MB limit)
  - ✅ Video upload with Cloudflare Stream (100MB limit)
  - ✅ MIME type validation and extension spoofing protection
  - ✅ EXIF removal and image processing pipeline
  - ✅ Webhook handling with idempotency and DLQ
  - ✅ Comprehensive test suite
- ⏳ Magic link authentication
- ⏳ Post creation with media
- ⏳ Map integration
- ⏳ Timeline feed
- ⏳ User profiles

## Development Notes

_Project-specific development guidance will be added as the codebase grows_
