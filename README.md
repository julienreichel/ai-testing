# 🧠 AI Tester - Multi-Provider AI Testing Platform

> **🚀 [Try the Live Demo](https://julienreichel.github.io/ai-testing/)**

A comprehensive Vue 3 + TypeScript platform for testing, comparing, and validating prompts across multiple AI providers. Test your prompts with OpenAI, Anthropic Claude, Mistral AI, Google Gemini, and more - all in one unified interface.

## ✨ Key Features

- **🔌 Multi-Provider Support**: OpenAI, Anthropic Claude, Mistral AI, Google Gemini
- **⚡ Quick-Run Testing**: Test prompts instantly without creating test cases
- **🧪 Prompt Comparison**: Compare responses across different models and providers
- **🚀 Batch Execution**: Run multiple tests in parallel with project-level execution
- **📊 Cost Analysis**: Real-time token usage and cost estimation
- **🎯 Rules Engine**: Automated validation with custom pass/fail criteria
- **💾 Data Management**: Local storage with CSV export capabilities (RFC 4180 compliant)
- **🔒 Privacy-First**: All data stays in your browser - no backend required
- **📱 Responsive Design**: Works best on desktop

## 🎮 How to Use the Platform

### 1. **🚀 [Open the Live Demo](https://julienreichel.github.io/ai-testing/)**

No installation required! The platform runs entirely in your browser.

### 2. **Configure AI Providers**

1. Navigate to **Providers** section
2. Add your preferred AI providers:
   - **OpenAI**: Requires API key from [OpenAI Platform](https://platform.openai.com/)
   - **Anthropic**: Get API key from [Anthropic Console](https://console.anthropic.com/)
   - **Mistral**: Sign up at [Mistral AI Platform](https://console.mistral.ai/)
   - **Google Gemini**: Get API key from [Google AI Studio](https://aistudio.google.com/)
3. Test connections to verify your API keys work

### 3. **Create and Test Prompts**

#### Option A: Quick-Run (No Test Case Needed)

1. Go to **Quick-Run** section
2. Enter your prompt
3. Select multiple providers/models to compare
4. Run in parallel and see results instantly
5. No test case creation required!

#### Option B: Traditional Editor Approach

1. Go to **Editor** section
2. Write your user message
3. Select models from different providers
4. Compare responses, costs, and performance
5. Save successful prompts for future use

### 4. **Set Up Validation Rules**

1. Create rules to automatically validate AI responses:
   - Text matching (exact, contains, regex)
   - Length constraints
   - Custom validation logic
2. Run batch tests to ensure consistency

### 5. **Manage Tests and Projects**

1. Go to **Tests** section
2. Browse your saved test cases
3. Select tests and run them individually or in batch
4. Launch Quick-Run directly from test list
5. Export/Import test projects for backup or sharing

### 6. **Analyze Results**

1. Check **Runs** section for execution history (up to 1,000 runs)
2. View cost breakdowns and token usage
3. Export batch results to CSV with proper test names
4. Sort results by provider and model
5. Track performance trends over time

## 🔒 Privacy & Security

- **Local Storage Only**: All data stays in your browser
- **No Backend**: Direct API calls to providers
- **API Key Security**: Keys stored locally, never transmitted to our servers
- **CORS Limitations**: Some providers may require a proxy for browser access

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Git**

### Quick Start

```bash
# Clone the repository
git clone https://github.com/julienreichel/ai-testing.git
cd ai-testing

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Development Commands

```bash
# Development
npm run dev              # Start dev server with HMR
npm run dev:host         # Expose dev server to network

# Testing
npm test                 # Run all tests (495+ tests)
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # ESLint code analysis
npm run format           # Prettier code formatting
npm run type-check       # TypeScript type checking

# Build
npm run build            # Production build
npm run preview          # Preview production build
```

## 🏗️ Architecture

### Tech Stack

- **Vue 3** - Composition API with `<script setup>`
- **TypeScript** - Full type safety (strict mode)
- **Vite** - Lightning-fast build tool
- **Pinia** - Vue state management
- **Vue Router 4** - Client-side routing
- **Vue I18n** - Internationalization
- **Vitest** - Modern testing framework
- **IndexedDB** - Client-side database

### Project Structure

```
src/
├── components/
│   └── ui/                     # 13+ reusable UI components
├── features/
│   ├── providers/              # Provider management
│   ├── editor/                 # Prompt testing interface
│   ├── tests/                  # Test case management & Quick-Run
│   └── runs/                   # Execution history & batch results
├── store/                      # Pinia state stores
├── composables/                # Reusable Vue logic
├── types/                      # TypeScript definitions
├── utils/                      # Utilities (taskPool, generateId, etc.)
└── locales/                    # i18n translations
```

## 🧪 Testing

**570+ Tests with 100% Pass Rate**

- **Boston School Testing**: Behavior-driven, user-focused tests
- **Comprehensive Coverage**: Components, composables, services, features
- **Real i18n Integration**: Tests use production translations
- **IndexedDB Mocking**: Full database testing capabilities
- **Parallel Execution Tests**: Task pool and bounded concurrency
- **Type-Safe Testing**: Full TypeScript in test environment

```bash
# Test execution examples
npm test                    # All tests
npm test providers          # Provider-specific tests
npm test components         # UI component tests
npm run test:coverage       # Coverage report
```

## 🔌 Adding New AI Providers

### 1. Create Provider Adapter

```typescript
// src/providers/YourProviderAdapter.ts
import { BaseProviderAdapter } from "types/providers";

export class YourProviderAdapter extends BaseProviderAdapter {
  async call(request: ProviderRequest): Promise<ProviderResponse> {
    // Implement API call logic
  }

  getModels(): ProviderModel[] {
    // Return supported models
  }

  getPricing(model: string): ProviderPricing | null {
    // Return pricing information
  }

  validateConfig(): boolean {
    // Validate API key/configuration
  }
}
```

### 2. Register Provider

```typescript
// src/providers/index.ts
import { YourProviderAdapter } from "./YourProviderAdapter";

export type ProviderType =
  | "openai"
  | "anthropic"
  | "mistral"
  | "gemini"
  | "yourprovider"
  | "mock";

const PROVIDER_CONSTRUCTORS = {
  // ... existing providers
  yourprovider: YourProviderAdapter,
};
```

### 3. Add Tests

```typescript
// test/providers/YourProviderAdapter.test.ts
describe("YourProviderAdapter - User Behavior", () => {
  it("should successfully process chat completions", async () => {
    // Test user-visible behavior
  });
});
```

### 4. Update Documentation

- Add provider details to `KNOWLEDGE_BASE.md`
- Update README with new provider information
- Document API requirements and setup

## 📊 Performance Metrics

- **Bundle Size**: Optimized with tree-shaking
- **Test Coverage**: 570+ tests, 100% pass rate
- **Build Time**: ~900ms production build
- **Performance**: <100ms component render times
- **Parallel Execution**: Bounded concurrency for optimal resource usage
- **Browser Support**: Modern browsers (ES2020+)

## 🎯 Code Quality Standards

### Clean Code Principles

- **SOLID Principles**: Single Responsibility, Open/Closed, etc.
- **DRY Compliance**: No code duplication
- **Magic Numbers**: Use named constants (ESLint enforced)
- **i18n First**: All user text through translation system

### Commit Standards

```bash
# Conventional Commits 1.0.0
feat(providers): Add Google Gemini provider support
fix(ui): Resolve dialog closing issue on mobile
docs(readme): Update installation instructions
test(providers): Add comprehensive OpenAI tests
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/new-provider`
3. **Follow code standards**: ESLint, Prettier, TypeScript strict
4. **Write behavior-driven tests**: Focus on user experience
5. **Use conventional commits**: Proper commit message format
6. **Submit PR**: Include tests and documentation updates

### Development Guidelines

- **Component Design**: Follow existing UI component patterns
- **Testing**: Boston School behavior-driven approach
- **Internationalization**: Use `$t()` for all user-facing text
- **Type Safety**: Maintain strict TypeScript compliance
- **Performance**: Consider bundle size and render performance

## 📚 Resources

- **🚀 [Live Demo](https://julienreichel.github.io/ai-testing/)** - Try the platform
- **📖 [Knowledge Base](./KNOWLEDGE_BASE.md)** - Detailed technical documentation

## 🌟 Show Your Support

If this project helps you test and improve your AI prompts, please consider:

- ⭐ **Star the repository**
- 🐛 **Report issues**
- 💡 **Suggest new features**
- 🔌 **Contribute new providers**
- 📖 **Improve documentation**

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with ❤️ using Copilot, Vue 3, TypeScript, and modern web technologies.**

🚀 **[Start Testing Your AI Prompts Now](https://julienreichel.github.io/ai-testing/)**
