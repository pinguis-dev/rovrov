# Suggested Commands for RovRov Development

## Project Setup
```bash
# Install dependencies
npm install

# iOS setup (macOS only)
cd ios && pod install && cd ..
```

## Development Commands
```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Code Quality
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Testing
npm test
```

## Git Operations
```bash
# Check status
git status

# View recent commits
git log --oneline -10

# Create feature branch
git checkout -b feature/task-name

# Stage and commit
git add .
git commit -m "message"
```

## Expo Commands
```bash
# Clear cache
expo start -c

# Check Expo status
expo whoami

# Build for production
expo build:ios
expo build:android
```

## System Utilities (macOS/Darwin)
```bash
# File operations
ls -la
find . -name "*.ts" -type f
grep -r "pattern" --include="*.ts" .

# Directory navigation
cd path/to/directory
pwd
```