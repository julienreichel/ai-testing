# AI Testing Platform

A comprehensive Vue 3 + TypeScript platform for managing and testing AI providers with a robust component architecture.

## 🚀 Features

- **Provider Management**: Add, test, and manage multiple AI providers (OpenAI, Claude, Mock)
- **Secure Storage**: API keys stored locally in browser with encryption notice
- **Real-time Testing**: Test provider connections with visual feedback
- **Responsive Design**: Clean, modern UI with dark/light theme support
- **Internationalization**: Full i18n support with Vue I18n
- **Type Safety**: Complete TypeScript coverage with strict type checking

## 🏗️ Architecture

### Component System

Built with a comprehensive reusable component library:

- **10 Base UI Components**: Button, Dialog, Form, Input, Card, Badge, Toast, Notice, Spinner, EmptyState
- **Feature Components**: ProviderCard, ProviderForm for specialized functionality
- **Clean Architecture**: 75% code reduction through component extraction (762 → 190 lines)

### Key Benefits

- **DRY Principle**: Single source of truth for UI patterns
- **Type Safety**: Full TypeScript interfaces for all components
- **Accessibility**: Built-in ARIA labels and keyboard navigation
- **Testing Ready**: Boston School behavior-driven testing approach
- **Maintainable**: Separated concerns with clear component boundaries

## 🛠️ Tech Stack

- **Vue 3** - Composition API with `<script setup>`
- **TypeScript** - Full type safety and IDE support
- **Vite** - Fast build tool and development server
- **Pinia** - State management for provider data
- **Vue Router 4** - Client-side routing
- **Vue I18n** - Internationalization
- **Vitest** - Unit testing framework
- **ESLint + Prettier** - Code quality and formatting

## 🧪 Testing

- **34/34 tests passing** with comprehensive coverage
- **Boston School approach**: Tests focus on user behavior, not implementation
- **Behavior-driven**: Tests survive refactoring and document expected behavior
- **Real i18n integration**: Tests use production translation files (DRY principle)

## 🎯 Development Standards

### Code Quality

- **Clean Code Principles**: SOLID, DRY, YAGNI enforcement
- **ESLint Compliance**: No magic numbers, proper imports, consistent naming
- **i18n First**: No hardcoded strings, all text through translation system
- **Component Patterns**: Consistent prop validation, event emission, slot usage

### Commit Standards

- **Conventional Commits 1.0.0**: Enforced with commitlint
- **Sentence-case subjects**: "Add feature" not "add feature"
- **Imperative mood**: "Fix bug" not "Fixed bug"

## 🚦 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Type checking
npm run type-check

# Lint and format
npm run lint
npm run format
```

## 📁 Project Structure

```
src/
├── components/
│   └── ui/                    # 10 reusable UI components
├── features/
│   └── providers/             # Provider management feature
│       ├── ProvidersView.vue  # Main view (190 lines)
│       └── components/        # Feature-specific components
├── store/                     # Pinia stores
├── router/                    # Vue Router configuration  
├── locales/                   # i18n translations
└── assets/                    # Global styles and assets
```

## 🎨 Component Library

### Base UI Components

- **BaseButton**: Variants (primary, outline, danger), loading states, sizes
- **BaseDialog**: Accessible modals with ESC/click-outside handling
- **BaseForm**: Form wrapper with validation and loading states
- **BaseCard**: Flexible content containers with slots
- **BaseNotice**: Warning/info/error notifications
- **BaseToast**: Auto-hide notifications
- **BaseBadge**: Status indicators
- **BaseSpinner**: Loading indicators
- **BaseInputField**: Unified form inputs
- **BaseEmptyState**: Empty state displays with actions

### Usage Example

```vue
<BaseButton variant="primary" :loading="isSubmitting" @click="handleSubmit">
  {{ $t('common.submit') }}
</BaseButton>

<BaseDialog v-model="showDialog" :title="$t('providers.addProvider')">
  <ProviderForm @submit="addProvider" @cancel="closeDialog" />
</BaseDialog>
```

## 🔧 Configuration

### Environment Variables

```bash
VITE_APP_TITLE=AI Testing Platform
VITE_API_BASE_URL=https://api.example.com
```

### TypeScript

- Strict mode enabled
- Path aliases configured (`@/` → `src/`)
- Component prop validation

### ESLint Rules

- `no-magic-numbers`: Use named constants
- `vue/component-name-in-template-casing`: PascalCase components
- Custom rules for i18n usage

## 📈 Metrics

- **Code Coverage**: 80%+ for new code, 90%+ for critical paths
- **Bundle Size**: Optimized with tree-shaking
- **Performance**: Sub-100ms component render times
- **Accessibility**: WCAG 2.1 AA compliance

## 🤝 Contributing

1. Follow the established component patterns
2. Write behavior-driven tests (Boston School)
3. Use i18n for all user-facing text
4. Maintain TypeScript strict compliance
5. Follow conventional commit format

## 📚 Documentation

- **Component Props**: TypeScript interfaces document all component APIs
- **Testing Patterns**: Boston School behavior-driven examples
- **Architecture Decisions**: Clean code principles and SOLID compliance
- **i18n Guidelines**: Translation key naming and usage patterns
