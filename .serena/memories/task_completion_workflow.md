# Task Completion Workflow

## After Implementation
When completing any development task, follow this checklist:

### 1. Code Quality Checks
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Fix any linting issues
npm run lint -- --fix
```

### 2. Testing
```bash
# Run tests
npm test

# For React Native specific testing
npm run test:ios
npm run test:android
```

### 3. Build Verification
```bash
# Verify builds work
npm run ios    # Test iOS build
npm run android # Test Android build
```

### 4. Documentation Updates
- Update relevant documentation files
- Add/update comments for complex logic
- Update API documentation if applicable
- Update README if new features are added

### 5. Git Operations
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: implement [task-name] - [brief description]"

# Push to feature branch
git push origin feature/branch-name
```

### 6. Task-Specific Validation
For Backend tasks:
- Verify database connections work
- Test API endpoints if applicable
- Validate environment configurations

For Frontend tasks:
- Test UI on both iOS and Android
- Verify navigation flows
- Check responsive design
- Test error states

### 7. Pre-Merge Checklist
- All tests pass
- Code is properly typed
- No console errors or warnings
- Performance impact assessed
- Security implications reviewed