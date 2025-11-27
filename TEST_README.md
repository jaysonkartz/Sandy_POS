# Testing Guide

This project uses [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/react) for unit testing.

## Setup

Install dependencies:

```bash
pnpm install
```

## Running Tests

Run all tests:
```bash
pnpm test
```

Run tests in watch mode:
```bash
pnpm test --watch
```

Run tests with UI:
```bash
pnpm test:ui
```

Run tests with coverage:
```bash
pnpm test:coverage
```

## Test Structure

Tests are organized to mirror the source code structure:

```
app/
├── components/
│   ├── __tests__/
│   │   ├── ErrorState.test.tsx
│   │   ├── LanguageToggle.test.tsx
│   │   ├── QuickSignInCheck.test.tsx
│   │   └── protected-route.test.tsx
│   └── ...
├── hooks/
│   ├── __tests__/
│   │   ├── useAuth.test.ts
│   │   ├── useSession.test.ts
│   │   ├── useSignInLogging.test.ts
│   │   └── useWhatsApp.test.ts
│   └── ...
├── lib/
│   ├── __tests__/
│   │   └── signin-logger.test.ts
│   └── ...
└── utils/
    ├── __tests__/
    │   └── session-helpers.test.ts
    └── ...
```

## Test Coverage

Current test coverage includes:

### Components
- ✅ ErrorState - Error display component
- ✅ LanguageToggle - Language switching component
- ✅ QuickSignInCheck - Sign-in history display
- ✅ ProtectedRoute - Route protection wrapper
- ✅ FloatingOrderButton - Floating action button
- ✅ CategoryFilter - Category filtering component

### Hooks
- ✅ useAuth - Authentication hook
- ✅ useSession - Session management hook
- ✅ useSignInLogging - Sign-in logging hook
- ✅ useWhatsApp - WhatsApp integration hook

### Utilities
- ✅ session-helpers - Session management utilities
- ✅ signin-logger - Sign-in logging utilities

## Writing New Tests

When adding new components or hooks, create corresponding test files:

1. Create a `__tests__` directory next to your component/hook
2. Name the test file `[ComponentName].test.tsx` or `[hookName].test.ts`
3. Follow the existing test patterns

Example test structure:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Mocking

The test setup includes mocks for:
- Next.js router (`next/navigation`)
- Supabase client
- LocalStorage
- Window.open
- MatchMedia

## Best Practices

1. **Test behavior, not implementation** - Focus on what users see and do
2. **Use descriptive test names** - Test names should clearly describe what they test
3. **Keep tests isolated** - Each test should be independent
4. **Mock external dependencies** - Mock API calls, localStorage, etc.
5. **Test edge cases** - Include tests for error states, empty states, etc.

## Stress Testing

For load and stress testing, see the comprehensive stress test documentation:

- **[STRESS_TEST_PLAN.md](./STRESS_TEST_PLAN.md)** - Complete stress test plan with scenarios, metrics, and success criteria
- **[STRESS_TEST_STEPS.md](./STRESS_TEST_STEPS.md)** - Step-by-step guide to execute stress tests
- **[STRESS_TEST_CHECKLIST.md](./STRESS_TEST_CHECKLIST.md)** - Quick reference checklist

### Quick Start

1. Install k6: `choco install k6` (Windows) or `brew install k6` (macOS)
2. Run baseline test: `k6 run --vus 1 --duration 30s stress-tests/k6/product-catalog.js`
3. Follow the step-by-step guide in `STRESS_TEST_STEPS.md`

## Continuous Integration

Tests should pass before merging code. Consider adding a pre-commit hook to run tests automatically.

