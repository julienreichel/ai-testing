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

### Providers
- Modular system with OpenAI, Anthropic Claude, Mistral AI, Google Gemini, Mock
- Secure localStorage API keys with real-time connection testing
- Complete CRUD operations

### Prompt Testing
- Editor interface with system/user prompts and model parameters
- Response display showing latency, tokens, and cost estimation
- IndexedDB persistence for test cases

### Rules Engine
- Automated validation with multiple rule types:
  - Exact match, contains, starts/ends with
  - Regex patterns with flags
  - Length constraints (min/max)
  - AND/OR logic for rule sets
- i18n feedback messages

### Test Management
- Project system with complete CRUD operations
- Execution history and results tracking
- Export/Import with JSON format and ID preservation
- Conflict resolution for duplicate imports
- Quick-Run launcher from test list
- Multi-select batch execution

### Batch Runs
- Relational architecture (BatchRunSession/BatchRunResults entities)
- Parallel execution with bounded concurrency
- Real-time progress tracking
- CSV export (RFC 4180 compliant)
- History supporting up to 1,000 runs
- Enhanced sorting by provider and model
- _Planned: Statistical analysis, performance trending, A/B testing_

### Data & Storage
- IndexedDB for projects, tests, and runs
- localStorage for API keys and user preferences
- Pinia state management
- Export/Import system with data integrity
- Privacy-first architecture (no backend)

### UI/UX
- BasePageLayout system with 13+ reusable components
- Dedicated views: TestsListView, TestDetailsView, TestQuickRunView, ProjectQuickRunView
- Reusable dialog components
- Responsive design

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

### OpenAI
- **Models**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo, GPT-5 (nano/mini/full)
- **API**: Chat Completions API

### Anthropic (Claude)
- **Models**: Claude 3.5 (Haiku, Sonnet, Opus)
- **API**: Messages API

### Mistral AI
- **Models**: Mistral family
- **API**: OpenAI-compatible Chat Completions API

### Google Gemini
- **Models**: Gemini 2.5 Pro/Flash, 2.0 Flash (including lite variants)
- **API**: generateContent endpoint

### Mock Provider
- Development and testing without API costs
- Simulated responses with configurable latency

### Provider Architecture
- Modular design with `BaseProviderAdapter` interface
- Full TypeScript support
- Standardized error handling
- Accurate cost estimation
- Unified response format

---

## � Security & Privacy

- API keys stored locally in browser localStorage
- Direct API calls from browser to providers (no backend)
- Clear warnings about API key exposure and CORS limitations
- Optional personal proxy setup (e.g., Cloudflare Worker) for CORS issues

---

## 🧪 Testing

**570/570 tests passing** - Boston School behavior-driven approach

### Coverage
- UI components and views
- Database operations and import/export
- Composables: rules engine, cost estimation, prompt/batch runner, test management
- Parallel execution: task pool and bounded concurrency

### Infrastructure
- Real i18n integration using production translations
- IndexedDB mocking with global test setup
- Zero warnings and clean output
- Type-safe with full TypeScript support
- Vitest with HMR

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

---

## 🏗️ Technical Stack

### Frontend
- Vue 3 Composition API
- TypeScript (strict mode)
- Vite build tool
- Vue Router 4
- Pinia state management
- Vue I18n

### UI Components (13+)
**Base Components**: BaseButton, BaseDialog, BaseForm, BaseCard, BaseBadge, BaseToast, BaseNotice, BaseSpinner, BaseInputField, BaseEmptyState, BasePageLayout, BasePageHeader, BaseBreadcrumb, BatchProgressSection

**Feature Components**: ProviderCard, ProviderForm, TestExportImport, ProviderOptions, TestCaseDetails, ProjectsTestCasesList

**Dialog Components**: CreateProject, DeleteProject, DeleteTestCase

### Data Layer
- **IndexedDB**: Projects, tests, and runs with full CRUD operations
- **localStorage**: API keys and user preferences
- **Pinia**: Reactive state management
- **Export/Import**: JSON format with ID preservation and conflict resolution

### Code Quality
- SOLID principles
- DRY compliance
- ESLint enforcement
- i18n-first approach
- Conventional commits

### Batch Runner
- Relational entities: BatchRunSession, BatchRunResults
- `useBatchRunner` composable for clean API
- Parallel execution with task pool and bounded concurrency
- Real-time progress tracking
- CSV export (RFC 4180 compliant)
- Supports up to 1,000 batch runs

---

## 🧱 Design Principles

- **Front-end only**: No server dependencies
- **Modular architecture**: Extensible provider system
- **Transparency**: Show costs, tokens, progress
- **Local-first**: Privacy-respecting storage
- **Learner mindset**: Experimentation-focused
- **Performance**: Parallel execution with bounded concurrency

---

## 📦 Future Features

- **Advanced Analytics**: Statistical analysis, reliability metrics, performance trending, A/B testing
- **AI-based Evaluator**: Qualitative scoring and automated assessment
- **Advanced Reporting**: Detailed analytics dashboard
- **PWA Capabilities**: Offline functionality
- **Team Collaboration**: Sharing and version control integration

---
