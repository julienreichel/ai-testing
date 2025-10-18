# Changelog

All notable changes to the AI Tester platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-10-17

### 🚀 Major Features

#### 📊 Batch Run History Management

- **Column Sorting**: Interactive sorting for all batch run columns (Test Name, Provider, Pass Rate, Cost, Date)
- **Visual Sort Indicators**: Clear up/down arrows showing current sort direction and active column
- **Persistent Sort State**: Sort preferences maintained across interactions
- **Comprehensive Test Coverage**: Full test suite ensuring reliable sorting functionality

#### 💾 Enhanced CSV Export System

- **RFC 4180 Compliance**: Proper CSV formatting with correct escaping for commas, quotes, and newlines
- **Multi-line Response Support**: Handles AI responses with complex formatting and special characters
- **DRY Implementation**: Centralized CSV export functionality in reusable `useCsvExport` composable
- **UTF-8 BOM Support**: Ensures proper character encoding for international text

#### ⚙️ User-Configurable Max Tokens

- **Single Run Configuration**: Adjustable max tokens for individual AI requests
- **Batch Run Support**: Same max token controls available for batch operations
- **Model Configuration Section**: Clean UI organization with temperature and max tokens controls
- **Provider Integration**: Seamless integration with all AI providers

#### 🎯 Rule Editor UX Improvements

- **Consistent Logic**: Both checkboxes follow positive logic pattern (checked = stricter rules)
- **Case Sensitivity Control**: Toggle for case-sensitive text matching
- **Punctuation & Spacing Control**: Option to make punctuation and spacing matter in comparisons
- **Flexible Defaults**: Both options unchecked by default for more flexible matching
- **Improved Labels**: Clear, intuitive checkbox labels for better user experience

### 🐛 Bug Fixes

#### 🔧 Development & Tooling

- **Tooltip Positioning**: Fixed tooltip position and size calculations for better visual placement
- **TypeScript Compliance**: Resolved linter type errors across the codebase
- **i18n Configuration**: Fixed i18n-ally extension warnings and missing translation keys
- **Input Field Validation**: Restored missing form inputs in edit dialogs

#### 📱 UI/UX Improvements

- **Component Consistency**: Enhanced CustomTooltip component with proper positioning
- **Translation Coverage**: Added missing translation keys and improved i18n coverage
- **Form Validation**: Improved input field validation and error handling

### 🔄 Breaking Changes

#### Rule Editor Behavior

- **Default Values**: Rule validation options now default to unchecked (more flexible matching)
- **Property Rename**: `ignorePunctuation` renamed to `respectPunctuation` for clarity
- **Validation Logic**: Inverted punctuation handling logic to match positive checkbox pattern

_Note: Rules created before this update may behave differently due to changed defaults_

### 🛠️ Technical Improvements

#### Testing & Quality

- **Boston School Testing**: Comprehensive behavior-driven test suite focusing on user experience
- **Test Coverage**: Added 6+ new test cases for sorting functionality and rule options
- **Type Safety**: Enhanced TypeScript types throughout the rules system
- **Build Optimization**: Improved build performance and reduced bundle size

#### Code Quality

- **DRY Principles**: Eliminated code duplication in CSV export functionality
- **Clean Architecture**: Consistent component organization and separation of concerns
- **Error Handling**: Improved error states and user feedback mechanisms

## [0.1.0] - 2025-01-13

### 🎉 Initial Public Release

This is the first official release of AI Tester - Multi-Provider AI Testing Platform!

### ✨ Features

#### 🔌 Multi-Provider AI Support

- **OpenAI Integration**: Complete support for GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo, and future GPT-5 models
- **Anthropic Claude Integration**: Full support for Claude 3.5 family (Haiku, Sonnet, Opus) with latest API
- **Mistral AI Integration**: Support for Mistral family including Medium, Small, Codestral, and Ministral variants
- **Google Gemini Integration**: Complete integration with Gemini 2.5 Pro, 2.5 Flash, and 2.0 Flash models
- **Mock Provider**: Development and testing provider for cost-free experimentation

#### 🧪 Prompt Testing & Comparison

- **Multi-Model Testing**: Compare responses across different AI providers and models simultaneously
- **Response Analysis**: Side-by-side comparison of model outputs with quality metrics
- **Cost Analysis**: Real-time token usage and cost estimation for all providers
- **Performance Metrics**: Latency tracking and response time analysis

#### 🎯 Automated Validation

- **Rules Engine**: Create custom validation rules for automated testing
- **Text Matching**: Exact match, contains, and regex pattern validation
- **Length Constraints**: Minimum and maximum response length validation
- **Batch Testing**: Run multiple test cases with automated validation

#### 💾 Data Management

- **Local Storage**: All data stored locally in browser with IndexedDB
- **Export/Import**: JSON-based export and import of test cases and configurations
- **Privacy-First**: No backend servers, all processing happens client-side
- **Persistent State**: Projects, test cases, and provider configurations persist across sessions

#### 🎮 User Interface

- **Vue 3 + TypeScript**: Modern, reactive frontend with full type safety
- **Responsive Design**: Works across desktop and mobile devices (optimized for desktop)
- **Real-time Updates**: Live cost tracking and response streaming
- **Intuitive Navigation**: Clean, organized interface with clear workflow

#### 🔒 Security & Privacy

- **API Key Management**: Secure local storage of provider API keys
- **No Data Transmission**: All processing happens in your browser
- **Configurable Providers**: Enable/disable providers as needed
- **Connection Testing**: Validate API keys before use

### 🏗️ Technical Infrastructure

#### 📋 Testing & Quality

- **495+ Tests**: Comprehensive test suite covering all major functionality
- **29 Test Files**: Unit tests for components, providers, composables, and utilities
- **Coverage Reports**: Detailed code coverage analysis with V8
- **Provider Testing**: Mock providers for development and testing

#### 🎯 Code Quality

- **ESLint Configuration**: Strict linting rules with magic number detection
- **Prettier Formatting**: Consistent code formatting across the codebase
- **TypeScript**: Full type safety with strict configuration
- **Vue 3 Composition API**: Modern Vue.js patterns with `<script setup>`

#### ⚡ Performance

- **Vite Build System**: Fast development and optimized production builds
- **Tree Shaking**: Only include code that's actually used
- **Code Splitting**: Lazy-loaded routes for better initial load times
- **Local Storage**: Fast, offline-capable data persistence

#### 🌐 Deployment

- **GitHub Pages**: Live demo available at https://julienreichel.github.io/ai-testing/
- **SPA Routing**: Proper single-page application routing with GitHub Pages support
- **Static Hosting**: No server requirements, deployable anywhere
- **CDN Ready**: Optimized for content delivery networks

### 📚 Documentation

#### 📖 Comprehensive Guides

- **README.md**: Complete user guide with setup instructions and feature overview
- **KNOWLEDGE_BASE.md**: Technical documentation for developers and advanced users
- **PROVIDER_SYSTEM.md**: Detailed provider architecture and extension guide
- **Live Demo**: Interactive demonstration with sample configurations

#### 🎯 Developer Resources

- **Provider Extension Guide**: How to add new AI providers
- **Testing Documentation**: Guidelines for writing and running tests
- **Architecture Overview**: System design and component relationships
- **API References**: Complete provider adapter interfaces and types

### 🚀 Getting Started

1. **Visit the Live Demo**: [https://julienreichel.github.io/ai-testing/](https://julienreichel.github.io/ai-testing/)
2. **Configure Providers**: Add your API keys for OpenAI, Claude, Mistral, or Gemini
3. **Create Prompts**: Write and test prompts across multiple models
4. **Analyze Results**: Compare responses, costs, and performance
5. **Save & Reuse**: Export successful prompts and test configurations

### 🔮 Future Roadmap

- Additional AI provider integrations (Perplexity, Cohere, etc.)
- Advanced analytics and reporting features
- Collaborative testing and sharing capabilities
- Enhanced rule engine with custom JavaScript validation
- API for programmatic access and CI/CD integration

---

**Full Changelog**: https://github.com/julienreichel/ai-testing/commits/v0.1.0
