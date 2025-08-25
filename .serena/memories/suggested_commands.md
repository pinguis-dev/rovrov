# Suggested Commands for RovRov Development

## Development Commands

### Package Management
```bash
npm install                 # Install dependencies
```

### Development Servers
```bash
npm start                   # Start Expo development server
npm run ios                 # Run on iOS simulator/device  
npm run android            # Run on Android emulator/device
npm run web                # Run on web browser
```

### Code Quality
```bash
npm run typecheck          # TypeScript type checking
npm run typecheck:watch    # TypeScript type checking in watch mode
npm run lint               # Run ESLint
npm run lint:fix           # Run ESLint with auto-fix
npm run format             # Format code with Prettier
npm run format:check       # Check if code is formatted
npm run validate           # Run typecheck + lint + format:check
```

### Pre-commit Hooks
```bash
npm run pre-commit         # Run lint-staged (automatic via husky)
```

### Platform Specific (iOS - macOS only)
```bash
cd ios && pod install && cd ..  # Install iOS CocoaPods dependencies
```

## System Commands (Darwin/macOS)

### File Operations
```bash
ls -la                     # List files with details
find . -name "*.tsx"       # Find TypeScript React files
grep -r "pattern" src/     # Search in source code
```

### Git Operations
```bash
git status                 # Check git status
git add .                  # Stage all changes
git commit -m "message"    # Commit with message
git push                   # Push to remote
git pull                   # Pull from remote
```

### Process Management
```bash
ps aux | grep node         # Find Node processes
kill -9 [PID]             # Force kill process
lsof -i :8081             # Check what's using Metro port
```

## Task Completion Workflow
When completing a task, run these commands in order:
1. `npm run validate`      # Ensure code quality
2. `git add .`            # Stage changes
3. `git commit -m "feat(task): description"`  # Commit
4. `npm start`            # Test the app