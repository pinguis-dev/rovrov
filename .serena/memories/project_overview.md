# RovRov SNS App Project Overview

## Project Purpose
RovRov is a location-based social networking mobile application that enables users to share daily happiness moments through photo/video posts, explore content on an interactive map, and view timeline feeds. The app focuses on location-based content discovery and social connection through shared experiences.

## Tech Stack
- **React Native 0.79.5** - Cross-platform mobile framework with Expo 53.0.22
- **TypeScript** - Type-safe development with strict mode enabled
- **Supabase** - Backend-as-a-Service (Auth, Database, Storage)
- **React Navigation** - Navigation framework (Bottom tabs + Stack)
- **Zustand** - State management
- **React Native Maps** - Map functionality and location services
- **PostgreSQL** - Database with extensions (pgcrypto, PostGIS, pg_trgm)

## Architecture
The app follows a modular React Native architecture with:
- Client Layer: React Native app for iOS/Android
- Backend: Supabase with PostgreSQL and Storage
- Authentication: Supabase Auth with JWT tokens
- Real-time: Supabase subscriptions
- File Storage: Supabase Storage with bucket-based organization

## Development Status
- Phase 1: Foundation building (Backend setup, DB schema)
- Current: Supabase project setup and configuration
- Next: Database schema implementation and API development