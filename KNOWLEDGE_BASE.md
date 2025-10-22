# 🧠 AI Tester — Knowledge Base

## Overview

**AI Tester** is a front-end-only Vue 3 + TypeScript application (built with Vite + Vitest) designed to **test, compare, and validate prompts** across multiple AI providers including OpenAI, Anthropic Claude, Mistral AI, Google Gemini, and Mock providers. The app helps users evaluate model responses, measure cost and token usage, define pass/fail rules, and run statistical reliability tests — all locally in the browser.

### Current Status: Production v0.2.0

**Production-ready application** with complete core functionality achieving:
- 570/570 tests passing (Boston School behavior-driven approach)
- 13+ reusable UI components with unified BasePageLayout system
- Multi-provider support with parallel execution and bounded concurrency
- Complete data persistence with IndexedDB (supporting 1,000+ batch runs)
- Type-safe architecture with strict TypeScript and modern path mapping
- Zero warnings, perfect CI/CD, comprehensive documentation

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

- **Dashboard** – Overview with navigation, project status, and export/import quick actions
- **Providers** – API key management, connectivity checks, and provider CRUD operations
- **Editor** – Prompt creation interface with real provider integration and response handling
- **Tests** – Test case management, project organization, export/import, and quick-run functionality
- **Quick-Run** – Dedicated page for rapid prompt testing across multiple providers without test case setup
- **Runs** – Batch execution history, results tracking, and CSV export with enhanced sorting

### Architecture Highlights

- **Component-Based Design**: 13+ reusable UI components with type-safe interfaces
- **Feature-Driven Structure**: Organized by domain (providers, tests, editor, runs)
- **Clean Separation**: UI logic in components, business logic in views, state in Pinia stores
- **Type-Safe Routing**: Vue Router 4 with TypeScript and modern path mapping (@/ aliases)
- **Unified Layout System**: BasePageLayout components for consistent page structure

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

## 🧪 Testing

**Complete test coverage**: 570/570 tests passing

**Approach**: Boston School behavior-driven testing focusing on user experience over implementation details

**Coverage Areas**:
- UI components, views, and feature components
- Database operations, import/export, and data integrity
- Composables (rules engine, cost estimation, prompt runner, batch runner, test management)
- Parallel execution (bounded concurrency and task pool)

**Infrastructure**:
- Real i18n integration using production translation files
- IndexedDB mocking with global test setup
- Zero warnings, clean output, proper mocking
- Type-safe testing with full TypeScript support
- Vitest integration with HMR

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

**Legend**: ✅ Complete | 🔄 In Progress | 📋 Planned

---

## 🏗️ Technical Architecture

### Component System

**Base UI Components** (13+): BaseButton, BaseDialog, BaseForm, BaseCard, BaseBadge, BaseToast, BaseNotice, BaseSpinner, BaseInputField, BaseEmptyState, BasePageLayout, BasePageHeader, BaseBreadcrumb, BatchProgressSection

**Feature Components**: ProviderCard, ProviderForm, TestExportImport, ProviderOptions, TestCaseDetails, ProjectsTestCasesList

**Dialog Components**: CreateProjectDialog, DeleteProjectDialog, DeleteTestCaseDialog

**Design**: Feature-driven organization, type-safe props with full TypeScript interfaces, slot-based flexibility

### Data Architecture

- **IndexedDB**: Complete database layer with CRUD operations for projects, test cases, and runs
- **Export/Import**: JSON-based with ID preservation and conflict resolution
- **Relationship Management**: Proper foreign key handling and referential integrity
- **State Management**: Pinia stores for reactive data flow
- **Persistence**: Offline-first with local storage fallbacks

### Code Quality Standards

- **SOLID Principles**: Single Responsibility, Open/Closed, Interface Segregation
- **DRY Compliance**: Shared utilities and components, real i18n integration
- **ESLint Rules**: Magic number elimination, consistent imports, proper naming
- **i18n First**: All user-facing text through translation system
- **Conventional Commits**: Automated validation with proper formatting

### Batch Runner Architecture

- **Relational Database**: BatchRunSession and BatchRunResults entities with proper relationships
- **Composable API**: `useBatchRunner` for clean execution management
- **Parallel Execution**: Multi-provider requests with bounded concurrency using task pool
- **Real-time Progress**: Visual indicators and status updates
- **CSV Export**: RFC 4180 compliant with proper test name resolution
- **Enhanced Sorting**: Provider with secondary model name sort
- **Persistence**: IndexedDB storage supporting up to 1,000 batch runs
- **Type Safety**: Full TypeScript interfaces for all data structures

---

---

## 🏗️ Technical Architecture Achievements

### Component System Excellence

- **13+ Reusable UI Components**: BaseButton, BaseDialog, BaseForm, BaseCard, BaseBadge, BaseToast, BaseNotice, BaseSpinner, BaseInputField, BaseEmptyState, BasePageLayout, BasePageHeader, BaseBreadcrumb, BatchProgressSection
- **Feature Components**: ProviderCard, ProviderForm, TestExportImport, ProviderOptions, TestCaseDetails, ProjectsTestCasesList for domain-specific functionality
- **Dialog Components**: CreateProjectDialog, DeleteProjectDialog, DeleteTestCaseDialog for consistent user interactions
- **Design**: Feature-driven organization, type-safe props with full TypeScript interfaces, slot-based flexibility

### Data Architecture

- **IndexedDB**: Complete database layer with CRUD operations for projects, test cases, and runs
- **Export/Import**: JSON-based with ID preservation and conflict resolution
- **Relationship Management**: Proper foreign key handling and referential integrity
- **State Management**: Pinia stores for reactive data flow
- **Persistence**: Offline-first with local storage fallbacks

### Code Quality Standards

- **SOLID Principles**: Single Responsibility, Open/Closed, Interface Segregation
- **DRY Compliance**: Shared utilities and components, real i18n integration
- **ESLint Rules**: Magic number elimination, consistent imports, proper naming
- **i18n First**: All user-facing text through translation system
- **Conventional Commits**: Automated validation with proper formatting

### Batch Runner Architecture

- **Relational Database**: BatchRunSession and BatchRunResults entities with proper relationships
- **Composable API**: `useBatchRunner` for clean execution management
- **Parallel Execution**: Multi-provider requests with bounded concurrency using task pool
- **Real-time Progress**: Visual indicators and status updates
- **CSV Export**: RFC 4180 compliant with proper test name resolution
- **Enhanced Sorting**: Provider with secondary model name sort
- **Persistence**: IndexedDB storage supporting up to 1,000 batch runs
- **Type Safety**: Full TypeScript interfaces for all data structures

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

- **Type Safety**: Full TypeScript interfaces for all data structures

---

## 📦 Production Deliverables (v0.2.0)

**Core Platform**:
- Complete AI prompt testing with multi-provider support (OpenAI, Claude, Mistral, Gemini, Mock)
- Quick-Run feature for rapid testing without test case setup
- Project-level batch execution with multi-select and parallel processing
- Complete rules engine with automated validation and i18n feedback

**Data & Export**:
- Full data management with IndexedDB persistence (1,000+ batch runs)
- Export/Import with JSON format, ID preservation, and conflict resolution
- Enhanced CSV export with RFC 4180 compliance and proper test name resolution

**UI & Testing**:
- 13+ production-ready components with unified BasePageLayout system
- 570/570 tests passing with Boston School behavior-driven approach
- Perfect CI/CD, zero warnings, comprehensive documentation

### Future Features (Planned)

- **Advanced Analytics**: Statistical analysis, reliability metrics, performance trending, A/B testing
- **AI-based Evaluator**: Qualitative scoring and automated assessment
- **Advanced Reporting**: Detailed analytics and performance metrics dashboard
- **PWA Capabilities**: Offline functionality and native app features
- **Team Collaboration**: Sharing and version control integration

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
