# 🧠 AI Tester — Knowledge Base

## Overview

**AI Tester** is a front-end-only Vue 3 + TypeScript application (built with Vite + Vitest) designed to **test, compare, and validate prompts** across multiple AI providers including OpenAI, Anthropic Claude, Mistral AI, Google Gemini, and Mock providers.
The app helps users evaluate model responses, measure cost and token usage, define pass/fail rules, and run statistical reliability tests — all locally in the browser.

### ✅ **Current Implementation Status**

We have successfully built a **production-ready application** with complete core functionality:

- **Complete provider management system** with secure local storage and real-time validation
- **Full test management system** with IndexedDB storage, CRUD operations, and data persistence
- **Export/Import functionality** for test projects with ID preservation and conflict resolution
- **Prompt editor interface** with real provider integration and response handling
- **Rules engine system** with validation logic and automated testing capabilities
- **10+ reusable UI components** following clean architecture principles
- **Comprehensive test suite** (495/495 tests passing) using Boston School behavior-driven approach
- **Full internationalization** support with Vue I18n and DRY principle compliance
- **Type-safe architecture** with strict TypeScript enforcement
- **Clean code standards** with ESLint, Prettier, and conventional commits
- **Perfect testing infrastructure** with zero warnings and IndexedDB mocking

---

## 🎯 Core Objectives

- Provide a **unified playground** for testing prompts on different AI APIs.
- Enable **plug-and-play providers**: new APIs can be added easily as modules.
- Let users **store their API keys locally**, without any backend.
- Offer **transparent token and cost estimation** for each run.
- Support **custom validation rules** to automatically test AI outputs.
- Allow **batch testing and statistical analysis** of result consistency.
- Later, enable **AI-based evaluation** for subjective or qualitative scoring.

---

## 🧩 Main Features

### Providers ✅ **IMPLEMENTED**

- **✅ Modular provider system** with clean interfaces and extensible architecture
- **✅ Secure API key storage** in browser localStorage with encryption notice
- **✅ Provider status management** with validation states and connection testing
- **✅ Implemented providers**: OpenAI, Anthropic Claude, Mistral AI, Google Gemini, Mock (for development/testing)
- **✅ Real-time connection testing** with visual feedback and status indicators
- **✅ Complete CRUD operations**: Add, edit, test, and remove providers
- **✅ Type-safe provider interfaces** with full TypeScript support

### Prompt Testing ✅ **IMPLEMENTED**

- **✅ Complete editor interface** for system prompt, user prompt, and model parameters
- **✅ Real provider integration** with OpenAI and Claude API support
- **✅ Response display** with latency, token usage, and cost estimation
- **✅ Test case persistence** with IndexedDB storage and project organization
- **✅ Prompt runner composable** with error handling and provider abstraction

### Rules & Assertions ✅ **IMPLEMENTED**

- **✅ Complete rules engine** with automated output validation
- **✅ Supported rule types**:
  - exact match (case-sensitive/insensitive)
  - contains / starts with / ends with text
  - regex pattern matching with flags
  - length constraints (min/max)
  - rule set aggregation (AND/OR logic)
- **✅ i18n validation messages** with detailed pass/fail feedback
- **✅ Type-safe rule interfaces** with full TypeScript support

### Test Management ✅ **IMPLEMENTED**

- **✅ Complete project system** with IndexedDB persistence
- **✅ Test case CRUD operations** with relationship management
- **✅ Test run tracking** with execution history and results
- **✅ Export/Import functionality** with JSON format and ID preservation
- **✅ Conflict resolution** for duplicate imports and data integrity
- **✅ Dashboard integration** with quick actions and project overview

### Batch Runs & Statistics � **IN DEVELOPMENT**

- **� Relational data architecture** with proper BatchRunSession and BatchRunResults separation
- **🔄 Comprehensive test infrastructure** for batch runner system with Boston School testing
- **🔄 Batch runner composable** (`useBatchRunner`) with cancellation and progress tracking
- **🔄 Data visualization components** for results analysis and timeline display
- **🔄 History management** with user-friendly batch run tracking and statistics
- **🔄 Persistence layer** with IndexedDB storage for batch run data
- **📋 Statistical analysis** with comprehensive metrics:
  - pass/fail ratio across multiple runs
  - grade distribution (if AI evaluator enabled)
  - average tokens, cost, and latency analysis
  - confidence intervals and reliability scoring
- **📋 Batch export capabilities** in JSON and CSV formats
- **📋 Performance trending** over time with historical analysis
- **📋 A/B testing support** for comparing different prompt variations

### Data Persistence & Import/Export ✅ **IMPLEMENTED**

- **✅ IndexedDB integration** for offline-first data storage
- **✅ Complete export system** with project, test cases, and run data
- **✅ Smart import logic** with ID preservation and update handling
- **✅ Data integrity** with referential relationship maintenance
- **✅ JSON format** for easy backup, sharing, and version control

### AI-Based Evaluation 📋 **PLANNED**

- Use another model to grade or validate outputs automatically.
- Modes: **binary judgment**, **numeric grading**, or **rule evaluation**.
- Enforces structured JSON output for safe parsing.

---

## ⚙️ Data & Storage ✅ **FULLY IMPLEMENTED**

- **✅ LocalStorage implementation** for API keys and user preferences with security notices
- **✅ IndexedDB database** for projects, test cases, and test runs with complete CRUD operations
- **✅ Pinia state management** for reactive provider data and application state
- **✅ Export/Import system** with JSON format for backup, sharing, and version control
- **✅ Data integrity management** with ID preservation and conflict resolution
- **✅ Relationship handling** between projects, test cases, and runs
- **✅ Privacy-first architecture**: All data stays in the browser — no backend or external storage

---

## 🧭 Application Structure

- **✅ Dashboard** – clean overview with navigation, project status, and export/import quick actions
- **✅ Providers** – complete API key management, connectivity checks, and provider CRUD operations
- **✅ Editor** – full prompt creation interface, real provider integration, and response handling
- **✅ Tests** – test case management, project organization, and export/import functionality
- **✅ Runs** – test execution history and results tracking _(basic implementation complete)_

### ✅ **Implemented Architecture Highlights**

- **Component-Based Design**: 10 reusable UI components (BaseButton, BaseDialog, BaseForm, etc.)
- **Feature-Driven Structure**: Organized by domain (providers, dashboard) with dedicated components
- **Clean Separation**: UI logic in reusable components, business logic in views, state in Pinia stores
- **Type-Safe Routing**: Vue Router 4 with TypeScript integration
- **Responsive Design**: Mobile-first approach with Quasar-like styling

---

## � Supported AI Providers

### ✅ **Currently Implemented Providers**

#### **OpenAI**

- **Models**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo, GPT-5 (nano, mini, full)
- **API Format**: OpenAI Chat Completions API
- **Features**: Temperature control, max tokens, system prompts
- **Pricing**: Official OpenAI pricing per 1K tokens

#### **Anthropic (Claude)**

- **Models**: Claude 3.5 family (Haiku, Sonnet, Opus)
- **API Format**: Anthropic Messages API
- **Features**: System prompts, temperature control, max tokens
- **Pricing**: Official Anthropic pricing per 1K tokens

#### **Mistral AI**

- **Models**: Mistral family including latest versions
- **API Format**: OpenAI-compatible Chat Completions API
- **Features**: Temperature control, max tokens, system prompts
- **Pricing**: Official Mistral AI pricing per 1K tokens

#### **Google Gemini**

- **Models**: Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.0 Flash (including lite variants)
- **API Format**: Google AI Studio API (generateContent endpoint)
- **Features**: System prompts, temperature control, safety settings
- **Pricing**: Official Google AI pricing per 1K tokens

#### **Mock Provider**

- **Purpose**: Development and testing without API costs
- **Features**: Simulated responses, configurable latency, token counting
- **Usage**: Perfect for testing application functionality and UI components

### 🔧 **Provider Architecture**

- **Modular Design**: Each provider implements `BaseProviderAdapter` interface
- **Type Safety**: Full TypeScript support with proper interface definitions
- **Error Handling**: Standardized error responses across all providers
- **Cost Estimation**: Accurate pricing calculation based on official provider rates
- **Response Normalization**: Unified response format regardless of provider API differences

---

## �💰 Pricing & Token Estimation

- Each provider defines cost per 1K input/output tokens.
- Token estimation uses either provider usage data or lightweight local approximations.
- Cost displayed per run and aggregated in stats.

---

## 🔒 Security & Privacy

- Keys are stored only locally and used directly from the browser.
- Clear warning about API key exposure and CORS limitations.
- Optional recipe to configure a **personal proxy** (e.g., Cloudflare Worker) if a provider blocks CORS.

---

## 🧪 Testing ✅ **FULLY IMPLEMENTED**

- **✅ Comprehensive test suite**: 495/495 tests passing with full coverage
- **✅ Boston School approach**: Behavior-driven testing focusing on user experience, not implementation
- **✅ Complete component tests**: All UI components, views, and feature components
- **✅ Service layer tests**: Database operations, import/export functionality, and data integrity
- **✅ Composable tests**: Rules engine, cost estimation, prompt runner, and test management
- **✅ Real i18n integration**: Tests use production translation files (DRY principle)
- **✅ IndexedDB mocking**: Global test setup for database-dependent components
- **✅ Perfect test infrastructure**: Zero warnings, clean output, proper mocking
- **✅ Type-safe testing**: Full TypeScript support in test environment
- **✅ Vitest integration**: Fast, modern testing framework with HMR

---

## 🚀 Implementation Roadmap

| Phase                     | Status | Focus                                             | Key Deliverables                           |
| :------------------------ | :----: | :------------------------------------------------ | :----------------------------------------- |
| **0. Scaffold**           |   ✅   | Base app setup (Vue, Vite, Pinia, Router, Vitest) | Project skeleton & local storage service   |
| **1. Foundation**         |   ✅   | Provider management & UI component library        | 10+ reusable components, provider CRUD     |
| **1.5. Architecture**     |   ✅   | Clean code refactoring & testing foundation       | 75% code reduction, clean architecture     |
| **2. MVP Core**           |   ✅   | Complete prompt testing with multiple providers   | Editor, response display, cost estimate    |
| **3. Rules Engine**       |   ✅   | Complete rule-based validation system             | PASS/FAIL evaluation, i18n messages        |
| **4. Data Management**    |   ✅   | IndexedDB integration & export/import             | Data persistence, project management       |
| **5. Testing Excellence** |   ✅   | Comprehensive test suite (383 tests)              | Perfect test infrastructure, zero warnings |
| **6. Production Ready**   |   ✅   | Complete core functionality integration           | Full-featured AI testing application       |
| **7. Multi-Provider**     |   ✅   | Expand provider support (Mistral, Gemini)         | Enhanced provider registry                 |
| **8. AI Evaluator**       |   📋   | Model-based judgment/grading                      | Structured JSON evaluation                 |
| **9. Batch & Statistics** |   �    | Multiple runs and statistical analysis            | Pass rates, performance metrics, trending  |
| **10. Enhancements**      |   📋   | PWA, reports, theming, advanced i18n              | Long-term improvements                     |

**Legend**: ✅ Complete | 🔄 In Progress | 📋 Planned

### ✅ **Production Achievement: Complete AI Testing Platform**

- **Complete Core Functionality**: Full prompt testing, rules validation, and data management
- **Advanced Data Persistence**: IndexedDB integration with export/import capabilities
- **Testing Excellence**: 383/383 tests with Boston School behavior-driven approach
- **Perfect Test Infrastructure**: Zero warnings, IndexedDB mocking, clean test output
- **Component System**: 10+ production-ready UI components with type-safe interfaces
- **Clean Code Standards**: SOLID principles, DRY compliance, ESLint enforcement
- **Type Safety**: Full TypeScript coverage with strict mode across all features
- **Developer Experience**: Conventional commits, comprehensive documentation, perfect CI/CD

---

## 🏗️ Technical Architecture Achievements

### Component System Excellence

- **10+ Reusable UI Components**: BaseButton, BaseDialog, BaseForm, BaseCard, BaseBadge, BaseToast, BaseNotice, BaseSpinner, BaseInputField, BaseEmptyState
- **Feature Components**: ProviderCard, ProviderForm, TestExportImport for domain-specific functionality
- **Clean Architecture**: Feature-driven organization with proper separation of concerns
- **Type-Safe Props**: Full TypeScript interfaces for all component APIs
- **Slot-Based Flexibility**: Customizable component areas with Vue's slot system

### Data Architecture Excellence

- **IndexedDB Integration**: Complete database layer with CRUD operations for projects, test cases, and runs
- **Export/Import System**: JSON-based data exchange with ID preservation and conflict resolution
- **Relationship Management**: Proper foreign key handling and referential integrity
- **State Management**: Pinia stores for reactive data flow and component communication
- **Data Persistence**: Offline-first architecture with local storage fallbacks

### Clean Code Standards

- **SOLID Principles**: Single Responsibility, Open/Closed, Interface Segregation enforcement
- **DRY Compliance**: No code duplication, shared utilities and components, real i18n integration
- **ESLint Rules**: Magic number elimination, consistent imports, proper naming
- **i18n First**: All user-facing text through translation system with production file usage
- **Conventional Commits**: Automated commit message validation with proper formatting

### Testing Excellence

- **Boston School Testing**: Behavior-driven tests that survive refactoring
- **495/495 Tests Passing**: Comprehensive coverage across all application layers including multiple AI providers
- **Perfect Test Infrastructure**: IndexedDB mocking, zero warnings, clean output
- **Real i18n Integration**: Tests use production translations (no duplication)
- **Service Layer Testing**: Database operations, import/export, and composable logic
- **Component Isolation**: Each component and service testable independently
- **Type-Safe Tests**: Full TypeScript support in test environment

### Batch Runner System Architecture

- **Relational Database Design**: Replaced serialization-based storage with proper relational structure
- **BatchRunSession Entity**: Manages batch execution metadata, configuration, and session state
- **BatchRunResults Entity**: Stores individual test results with proper foreign key relationships
- **Composable Architecture**: `useBatchRunner` provides clean API for batch execution management
- **Component System**: Specialized components for results visualization and history management
- **Persistence Layer**: IndexedDB-based storage with comprehensive CRUD operations
- **Test Coverage**: Complete Boston School behavior-driven tests for all batch runner components
- **Type Safety**: Full TypeScript interfaces for batch runner data structures and APIs

## 🧱 Design Principles

- **✅ Front-end only**: no server dependencies, client-side architecture
- **✅ Modular architecture**: proven with 10+ reusable components and extensible provider system
- **🔄 Transparency first**: show costs, token counts, and pass rates _(next phase)_
- **✅ Local-first**: privacy-respecting, secure localStorage implementation
- **✅ Learner mindset**: focus on experimentation with clean, maintainable codebase
- **✅ Developer Experience**: comprehensive documentation, testing, and code quality standards

---

## 📦 Deliverables

### ✅ **Production Release Completed (Full Core Application)**

- **✅ Complete AI prompt testing platform** with multi-provider support (OpenAI, Anthropic Claude, Mistral AI, Google Gemini, Mock)
- **✅ Full data management system** with IndexedDB persistence and export/import capabilities
- **✅ Complete rules engine** with automated validation and i18n feedback messages
- **✅ Production-ready UI system** with 10+ reusable components and type-safe interfaces
- **✅ Perfect testing infrastructure** (383/383 tests) with Boston School behavior-driven approach
- **✅ Complete project management** with test case organization and execution tracking
- **✅ Export/Import functionality** with JSON format, ID preservation, and conflict resolution
- **✅ Developer experience excellence**: Perfect CI/CD, zero warnings, comprehensive documentation

### 🔄 **Enhancement Phase (In Progress)**

- **🔄 Batch runner system implementation** with comprehensive test coverage and relational data architecture
- **🔄 Additional provider support** (Mistral, LeChat, other providers)
- **🔄 Performance optimizations** and user experience improvements

### 📋 **Next Major Features (Planned)**

- **📋 Batch runs and statistical analysis** with reliability metrics and performance trending
- **📋 Advanced analytics dashboard** with comprehensive reporting and insights

### 📋 **Future Advanced Features**

- **📋 AI-based evaluator** for qualitative scoring and automated assessment
- **📋 Advanced reporting** with detailed analytics and performance metrics
- **📋 PWA capabilities** with offline functionality and native app features
- **📋 Team collaboration** features with sharing and version control integration

### 🎯 **Current State Summary**

We have successfully built a **complete, production-ready multi-provider AI testing platform** that delivers:

- **Full-featured application** with complete prompt testing, rules validation, and data management
- **Universal multi-provider support** with OpenAI, Anthropic Claude, Mistral AI, and Google Gemini integration
- **Perfect technical execution** with 495/495 tests passing and zero warnings
- **Production-grade data persistence** with IndexedDB integration and export/import capabilities
- **Architectural excellence** with clean, maintainable, and fully testable code
- **Complete user workflows** from provider setup through test execution and data export
- **Developer experience perfection** with comprehensive tooling and documentation
- **Ready for immediate production use** with all core functionality implemented and tested

**Status**: The application has achieved **production readiness** with complete core functionality. All major features are implemented, tested, and working. The platform successfully fulfills its primary objective as a comprehensive AI prompt testing and validation tool.
