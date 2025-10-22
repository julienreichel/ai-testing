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
- **Quick-Run feature** for rapid prompt testing without test case creation
- **Project-level batch execution** with multi-select test runs and parallel processing
- **Rules engine system** with validation logic and automated testing capabilities
- **13+ reusable UI components** following clean architecture principles (including BasePageLayout system)
- **Comprehensive test suite** (570/570 tests passing) using Boston School behavior-driven approach
- **Full internationalization** support with Vue I18n and DRY principle compliance
- **Type-safe architecture** with strict TypeScript enforcement and modern path mapping
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
- **✅ Quick-Run from Tests View**: Launch rapid tests directly from test list without entering editor
- **✅ Dedicated Quick-Run page**: Standalone page for testing prompts across multiple providers
- **✅ Multi-select batch execution**: Run multiple test cases from same project in one operation

### Batch Runs & Statistics ✅ **IMPLEMENTED**

- **✅ Relational data architecture** with proper BatchRunSession and BatchRunResults separation
- **✅ Comprehensive test infrastructure** for batch runner system with Boston School testing
- **✅ Batch runner composable** (`useBatchRunner`) with cancellation and progress tracking
- **✅ Data visualization components** for results analysis and timeline display
- **✅ History management** with user-friendly batch run tracking (up to 1,000 runs)
- **✅ Persistence layer** with IndexedDB storage for batch run data
- **✅ Multi-provider parallel execution** with bounded concurrency for performance
- **✅ Real-time progress tracking** with visual indicators and status updates
- **✅ CSV export functionality** with proper test name resolution and RFC 4180 compliance
- **✅ Enhanced batch sorting** by provider name with secondary model name sorting
- **📋 Statistical analysis** with comprehensive metrics:
  - pass/fail ratio across multiple runs
  - grade distribution (if AI evaluator enabled)
  - average tokens, cost, and latency analysis
  - confidence intervals and reliability scoring
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

### UI/UX System ✅ **IMPLEMENTED**

- **✅ BasePageLayout System**: Reusable page layout components for consistent UI
  - BaseBreadcrumb for navigation hierarchy
  - BasePageHeader for consistent page titles and actions
  - BasePageLayout for unified page structure
- **✅ Dedicated View Routing**: Separate list and detail views with proper navigation
  - TestsListView for browsing test cases
  - TestDetailsView for individual test inspection
  - TestQuickRunView for rapid testing
  - ProjectQuickRunView for project-level batch execution
- **✅ Dialog Component Extraction**: Reusable dialog components for consistent UX
  - CreateProjectDialog for project creation
  - DeleteProjectDialog for project deletion confirmation
  - DeleteTestCaseDialog for test case deletion confirmation
- **✅ Provider Options Components**: Reusable provider configuration UI
  - ProviderOptions composable for shared logic
  - ProviderOptions component for consistent provider settings

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
- **✅ Tests** – test case management, project organization, export/import, and quick-run functionality
- **✅ Quick-Run** – dedicated page for rapid prompt testing across multiple providers without test case setup
- **✅ Runs** – batch execution history, results tracking, and CSV export with enhanced sorting

### ✅ **Implemented Architecture Highlights**

- **Component-Based Design**: 13+ reusable UI components (BaseButton, BaseDialog, BaseForm, BaseCard, BaseBadge, BaseToast, BaseNotice, BaseSpinner, BaseInputField, BaseEmptyState, BasePageLayout, BasePageHeader, BaseBreadcrumb, BatchProgressSection)
- **Feature-Driven Structure**: Organized by domain (providers, tests, editor, runs) with dedicated components
- **Clean Separation**: UI logic in reusable components, business logic in views, state in Pinia stores
- **Type-Safe Routing**: Vue Router 4 with TypeScript integration and modern path mapping (@/ aliases)
- **Responsive Design**: Mobile-first approach with Quasar-like styling
- **Unified Layout System**: BasePageLayout components ensure consistent page structure across all views

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

- **✅ Comprehensive test suite**: 570/570 tests passing with full coverage
- **✅ Boston School approach**: Behavior-driven testing focusing on user experience, not implementation
- **✅ Complete component tests**: All UI components, views, and feature components
- **✅ Service layer tests**: Database operations, import/export functionality, and data integrity
- **✅ Composable tests**: Rules engine, cost estimation, prompt runner, batch runner, and test management
- **✅ Parallel execution tests**: Comprehensive coverage for bounded concurrency and task pool
- **✅ Real i18n integration**: Tests use production translation files (DRY principle)
- **✅ IndexedDB mocking**: Global test setup for database-dependent components
- **✅ Perfect test infrastructure**: Zero warnings, clean output, proper mocking
- **✅ Type-safe testing**: Full TypeScript support in test environment
- **✅ Vitest integration**: Fast, modern testing framework with HMR

---

## 🚀 Implementation Roadmap

| Phase                      | Status | Focus                                             | Key Deliverables                           |
| :------------------------- | :----: | :------------------------------------------------ | :----------------------------------------- | --- | -------------------------------------- | ----------------------------------------- |
| **0. Scaffold**            |   ✅   | Base app setup (Vue, Vite, Pinia, Router, Vitest) | Project skeleton & local storage service   |
| **1. Foundation**          |   ✅   | Provider management & UI component library        | 10+ reusable components, provider CRUD     |
| **1.5. Architecture**      |   ✅   | Clean code refactoring & testing foundation       | 75% code reduction, clean architecture     |
| **2. MVP Core**            |   ✅   | Complete prompt testing with multiple providers   | Editor, response display, cost estimate    |
| **3. Rules Engine**        |   ✅   | Complete rule-based validation system             | PASS/FAIL evaluation, i18n messages        |
| **4. Data Management**     |   ✅   | IndexedDB integration & export/import             | Data persistence, project management       |
| **5. Testing Excellence**  |   ✅   | Comprehensive test suite (383 tests)              | Perfect test infrastructure, zero warnings |
| **6. Production Ready**    |   ✅   | Complete core functionality integration           | Full-featured AI testing application       |
| **7. Multi-Provider**      |   ✅   | Expand provider support (Mistral, Gemini)         | Enhanced provider registry                 |
| **8. Quick-Run & Batch**   |   ✅   | Quick testing and project-level batch execution   | Rapid testing workflow, parallel execution |
| **9. AI Evaluator**        |   📋   | Model-based judgment/grading                      | Structured JSON evaluation                 |
| **10. Advanced Analytics** |   �   | Statistical analysis and performance trending     | Pass rates, performance metrics, A/B tests |
| **11. Enhancements**       |   📋   | PWA, reports, theming, advanced i18n              | Long-term improvements                     |

**Legend**: ✅ Complete | 🔄 In Progress | 📋 Planned

### ✅ **Production Achievement: Complete AI Testing Platform**

- **Complete Core Functionality**: Full prompt testing, rules validation, data management, and batch execution
- **Advanced Data Persistence**: IndexedDB integration with export/import capabilities
- **Testing Excellence**: 570/570 tests with Boston School behavior-driven approach
- **Perfect Test Infrastructure**: Zero warnings, IndexedDB mocking, clean test output
- **Component System**: 13+ production-ready UI components with type-safe interfaces
- **Quick-Run Feature**: Rapid testing workflow without test case setup required
- **Project-Level Batch Execution**: Multi-select test runs with parallel processing
- **Enhanced CSV Export**: RFC 4180 compliant with proper test name resolution
- **Unified Layout System**: Consistent page structure with BasePageLayout components
- **Clean Code Standards**: SOLID principles, DRY compliance, ESLint enforcement
- **Type Safety**: Full TypeScript coverage with strict mode and modern path mapping
- **Developer Experience**: Conventional commits, comprehensive documentation, perfect CI/CD

---

## 🏗️ Technical Architecture Achievements

### Component System Excellence

- **13+ Reusable UI Components**: BaseButton, BaseDialog, BaseForm, BaseCard, BaseBadge, BaseToast, BaseNotice, BaseSpinner, BaseInputField, BaseEmptyState, BasePageLayout, BasePageHeader, BaseBreadcrumb, BatchProgressSection
- **Feature Components**: ProviderCard, ProviderForm, TestExportImport, ProviderOptions, TestCaseDetails, ProjectsTestCasesList for domain-specific functionality
- **Dialog Components**: CreateProjectDialog, DeleteProjectDialog, DeleteTestCaseDialog for consistent user interactions
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
- **570/570 Tests Passing**: Comprehensive coverage across all application layers including multiple AI providers and parallel execution
- **Perfect Test Infrastructure**: IndexedDB mocking, zero warnings, clean output
- **Real i18n Integration**: Tests use production translations (no duplication)
- **Service Layer Testing**: Database operations, import/export, batch execution, and composable logic
- **Component Isolation**: Each component and service testable independently
- **Type-Safe Tests**: Full TypeScript support in test environment
- **Parallel Execution Testing**: Comprehensive coverage for bounded concurrency and task pool

### Batch Runner System Architecture

- **Relational Database Design**: Replaced serialization-based storage with proper relational structure
- **BatchRunSession Entity**: Manages batch execution metadata, configuration, and session state
- **BatchRunResults Entity**: Stores individual test results with proper foreign key relationships
- **Composable Architecture**: `useBatchRunner` provides clean API for batch execution management
- **Component System**: Specialized components for results visualization and history management (BatchProgressSection)
- **Persistence Layer**: IndexedDB-based storage with comprehensive CRUD operations supporting up to 1,000 batch runs
- **Parallel Execution**: Multi-provider requests execute in parallel with bounded concurrency using task pool
- **Real-time Progress**: Visual progress indicators and status updates during batch execution
- **CSV Export System**: Centralized export functionality with RFC 4180 compliance and proper test name resolution
- **Enhanced Sorting**: Provider sorting with secondary model name sort for better organization
- **Test Coverage**: Complete Boston School behavior-driven tests for all batch runner components
- **Type Safety**: Full TypeScript interfaces for batch runner data structures and APIs

## 🧱 Design Principles

- **✅ Front-end only**: no server dependencies, client-side architecture
- **✅ Modular architecture**: proven with 13+ reusable components and extensible provider system
- **✅ Transparency first**: show costs, token counts, pass rates, and execution progress
- **✅ Local-first**: privacy-respecting, secure localStorage implementation
- **✅ Learner mindset**: focus on experimentation with clean, maintainable codebase
- **✅ Developer Experience**: comprehensive documentation, testing, and code quality standards
- **✅ Performance**: parallel execution with bounded concurrency for optimal resource utilization

---

## 📦 Deliverables

### ✅ **Production Release Completed (Full Core Application)**

- **✅ Complete AI prompt testing platform** with multi-provider support (OpenAI, Anthropic Claude, Mistral AI, Google Gemini, Mock)
- **✅ Full data management system** with IndexedDB persistence and export/import capabilities
- **✅ Complete rules engine** with automated validation and i18n feedback messages
- **✅ Quick-Run feature** for rapid testing without test case setup
- **✅ Project-level batch execution** with multi-select test runs and parallel processing
- **✅ Production-ready UI system** with 13+ reusable components and unified layout system
- **✅ Perfect testing infrastructure** (570/570 tests) with Boston School behavior-driven approach
- **✅ Complete project management** with test case organization and execution tracking
- **✅ Enhanced CSV export** with RFC 4180 compliance and proper test name resolution
- **✅ Batch run history** supporting up to 1,000 runs with advanced sorting capabilities
- **✅ Developer experience excellence**: Perfect CI/CD, zero warnings, comprehensive documentation

### 🔄 **Enhancement Phase (In Progress)**

### 📋 **Next Major Features (Planned)**

- **📋 Advanced statistical analysis** with reliability metrics and performance trending
- **📋 AI-based evaluator** for qualitative scoring and automated assessment
- **📋 Advanced analytics dashboard** with comprehensive reporting and insights
- **📋 A/B testing capabilities** for comparing prompt variations

### 📋 **Future Advanced Features**

- **📋 AI-based evaluator** for qualitative scoring and automated assessment
- **📋 Advanced reporting** with detailed analytics and performance metrics
- **📋 PWA capabilities** with offline functionality and native app features
- **📋 Team collaboration** features with sharing and version control integration

### 🎯 **Current State Summary**

We have successfully built a **complete, production-ready multi-provider AI testing platform** that delivers:

- **Full-featured application** with complete prompt testing, rules validation, batch execution, and data management
- **Quick-Run workflow** for rapid testing without formal test case creation
- **Project-level batch execution** with multi-select test runs and parallel processing
- **Universal multi-provider support** with OpenAI, Anthropic Claude, Mistral AI, and Google Gemini integration
- **Perfect technical execution** with 570/570 tests passing and zero warnings
- **Production-grade data persistence** with IndexedDB integration supporting 1,000+ batch runs
- **Enhanced CSV export** with RFC 4180 compliance and proper test name resolution
- **Unified UI system** with BasePageLayout components for consistent user experience
- **Architectural excellence** with clean, maintainable, and fully testable code
- **Complete user workflows** from provider setup through quick testing, batch execution, and data export
- **Developer experience perfection** with comprehensive tooling, modern path mapping, and documentation
- **Ready for immediate production use** with all core functionality implemented and tested

**Status**: The application has achieved **production readiness v0.2.0** with complete core functionality and enhanced testing workflows. All major features are implemented, tested, and working. The platform successfully fulfills its primary objective as a comprehensive AI prompt testing and validation tool with rapid testing capabilities.
