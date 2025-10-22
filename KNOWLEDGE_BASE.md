# 🧠 AI Tester — Knowledge Base

## Overview

**AI Tester** is a front-end-only Vue 3 + TypeScript application designed to test, compare, and validate prompts across multiple AI providers (OpenAI, Anthropic Claude, Mistral AI, Google Gemini, Mock). Built with Vite + Vitest, it evaluates model responses, measures cost and token usage, defines pass/fail rules, and runs statistical reliability tests — all locally in the browser.

**Current Status**: Production v0.2.0 - 570/570 tests passing, 13+ UI components, complete data persistence (1,000+ batch runs), zero warnings.

---

## 🎯 Core Objectives

- Unified playground for testing prompts across different AI APIs
- Plug-and-play provider architecture for easy API integration
- Local API key storage without backend dependencies
- Transparent token and cost estimation
- Custom validation rules for automated output testing
- Batch testing and statistical analysis
- Future: AI-based evaluation for qualitative scoring

---

## 🧩 Implemented Features

**Providers**: Modular system with OpenAI, Anthropic Claude, Mistral AI, Google Gemini, Mock. Secure localStorage API keys, real-time connection testing, complete CRUD operations.

**Prompt Testing**: Editor interface with system/user prompts, model parameters, response display (latency, tokens, cost), IndexedDB persistence.

**Rules Engine**: Automated validation with exact match, contains/starts/ends with, regex patterns, length constraints, AND/OR logic. i18n feedback messages.

**Test Management**: Project system with CRUD operations, execution history, export/import (JSON with ID preservation), conflict resolution, Quick-Run from test list, multi-select batch execution.

**Batch Runs**: Relational architecture (BatchRunSession/BatchRunResults), parallel execution (bounded concurrency), real-time progress, CSV export (RFC 4180), history (1,000 runs), enhanced sorting. _Planned: Statistical analysis, performance trending, A/B testing._

**Data & Storage**: IndexedDB for projects/tests/runs, localStorage for API keys/preferences, Pinia state management, export/import system, privacy-first (no backend).

**UI/UX**: BasePageLayout system (13+ components), dedicated views (TestsListView, TestDetailsView, TestQuickRunView, ProjectQuickRunView), reusable dialogs, responsive design.

---

## 🧭 Application Pages

- **Dashboard**: Project overview, navigation, export/import actions
- **Providers**: API key management, connectivity testing, CRUD operations
- **Editor**: Prompt creation, provider integration, response handling
- **Tests**: Test case management, project organization, quick-run launcher
- **Quick-Run**: Rapid testing across multiple providers without test case setup
- **Runs**: Batch execution history, results tracking, CSV export

---

## 🔌 Supported AI Providers

**OpenAI**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo, GPT-5 (nano/mini/full). Chat Completions API.

**Anthropic (Claude)**: Claude 3.5 (Haiku, Sonnet, Opus). Messages API.

**Mistral AI**: Mistral family. OpenAI-compatible Chat Completions API.

**Google Gemini**: Gemini 2.5 Pro/Flash, 2.0 Flash (including lite variants). generateContent endpoint.

**Mock Provider**: Development/testing without API costs. Simulated responses, configurable latency.

**Provider Architecture**: Modular design with `BaseProviderAdapter` interface, full TypeScript support, standardized error handling, accurate cost estimation, unified response format.

---

## � Security & Privacy

- API keys stored locally in browser localStorage
- Direct API calls from browser to providers (no backend)
- Clear warnings about API key exposure and CORS limitations
- Optional personal proxy setup (e.g., Cloudflare Worker) for CORS issues

---

## 🧪 Testing

**570/570 tests passing** - Boston School behavior-driven approach focusing on user experience

**Coverage**: UI components, views, database operations, import/export, composables (rules engine, cost estimation, prompt/batch runner, test management), parallel execution (task pool, bounded concurrency)

**Infrastructure**: Real i18n integration (production translations), IndexedDB mocking, zero warnings, type-safe with full TypeScript, Vitest with HMR

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

## 🏗️ Technical Stack

**Frontend**: Vue 3 Composition API, TypeScript (strict mode), Vite, Vue Router 4, Pinia, Vue I18n

**UI**: 13+ components (BaseButton, BaseDialog, BaseForm, BaseCard, BaseBadge, BaseToast, BaseNotice, BaseSpinner, BaseInputField, BaseEmptyState, BasePageLayout, BasePageHeader, BaseBreadcrumb, BatchProgressSection), feature components (ProviderCard, ProviderForm, TestExportImport, ProviderOptions, TestCaseDetails, ProjectsTestCasesList), dialog components (CreateProject, DeleteProject, DeleteTestCase)

**Data**: IndexedDB (projects/tests/runs with CRUD), localStorage (API keys/preferences), Pinia (reactive state), export/import (JSON with ID preservation, conflict resolution)

**Code Quality**: SOLID principles, DRY compliance, ESLint (magic number elimination, consistent imports), i18n-first, conventional commits

**Batch Runner**: Relational entities (BatchRunSession, BatchRunResults), composable API (`useBatchRunner`), parallel execution (task pool, bounded concurrency), real-time progress, CSV export (RFC 4180), enhanced sorting, 1,000 run capacity

---

## 🧱 Design Principles

- Front-end only (no server dependencies)
- Modular architecture (extensible provider system)
- Transparency (show costs, tokens, pass rates, progress)
- Local-first (privacy-respecting)
- Learner mindset (experimentation-focused)
- Performance (parallel execution, bounded concurrency)

---

## 📦 Future Features

- Advanced analytics (statistical analysis, reliability metrics, performance trending, A/B testing)
- AI-based evaluator (qualitative scoring, automated assessment)
- Advanced reporting dashboard
- PWA capabilities (offline functionality)
- Team collaboration (sharing, version control)

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
