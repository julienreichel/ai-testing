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

---

## 🏗️ Technical Stack

**Frontend**: Vue 3 Composition API, TypeScript (strict mode), Vite, Vue Router 4, Pinia, Vue I18n

**UI Components** (13+): BaseButton, BaseDialog, BaseForm, BaseCard, BaseBadge, BaseToast, BaseNotice, BaseSpinner, BaseInputField, BaseEmptyState, BasePageLayout, BasePageHeader, BaseBreadcrumb, BatchProgressSection. Feature: ProviderCard, ProviderForm, TestExportImport, ProviderOptions, TestCaseDetails, ProjectsTestCasesList. Dialogs: CreateProject, DeleteProject, DeleteTestCase.

**Data Layer**: IndexedDB (projects/tests/runs CRUD, relationships, referential integrity), localStorage (API keys/preferences), Pinia (reactive state), export/import (JSON, ID preservation, conflict resolution).

**Code Quality**: SOLID principles, DRY compliance, ESLint enforcement, i18n-first, conventional commits.

**Batch Runner**: Relational entities (BatchRunSession, BatchRunResults), `useBatchRunner` composable, parallel execution (task pool, bounded concurrency), real-time progress, CSV export (RFC 4180), 1,000 run capacity.

---

## 🧱 Design Principles

Front-end only • Modular architecture • Transparency (costs, tokens, progress) • Local-first privacy • Learner mindset • Performance (parallel execution)

---

## 📦 Future Features

Advanced analytics • AI-based evaluator • Advanced reporting dashboard • PWA capabilities • Team collaboration

---
