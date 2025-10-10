# 🧠 AI Tester — Knowledge Base

## Overview

**AI Tester** is a front-end-only Vue 3 + TypeScript application (built with Vite + Vitest) designed to **test, compare, and validate prompts** across multiple AI providers such as OpenAI, Claude, and Mock providers.
The app helps users evaluate model responses, measure cost and token usage, define pass/fail rules, and run statistical reliability tests — all locally in the browser.

### ✅ **Current Implementation Status**

We have successfully built a **production-ready foundation** with:
- **Complete provider management system** with secure local storage
- **10 reusable UI components** following clean architecture principles  
- **Comprehensive test suite** (34/34 tests passing) using Boston School behavior-driven approach
- **Full internationalization** support with Vue I18n
- **Type-safe architecture** with strict TypeScript enforcement
- **Clean code standards** with ESLint, Prettier, and conventional commits

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
- **✅ Implemented providers**: OpenAI, Claude, Mock (for development/testing)
- **✅ Real-time connection testing** with visual feedback and status indicators
- **✅ Complete CRUD operations**: Add, edit, test, and remove providers
- **✅ Type-safe provider interfaces** with full TypeScript support

### Prompt Testing

- Interface for editing **system prompt, user prompt**, and model parameters.
- Displays model response, latency, token usage, and cost estimate.
- Results can be saved as **Test Cases**.

### Rules & Assertions

- Rules verify output quality automatically.
- Supported conditions:
  - exact match
  - contains / starts / ends with text
  - regex match
  - length limits
  - (later) JSON schema validity

- Each test returns **PASS/FAIL** feedback with detailed messages.

### Batch Runs & Statistics

- Execute prompts multiple times to assess reliability.
- Metrics displayed:
  - pass/fail ratio
  - grade distribution (if AI evaluator)
  - average tokens, cost, and latency

- Export results in JSON or CSV.

### AI-Based Evaluation (Phase 2)

- Use another model to grade or validate outputs automatically.
- Modes: **binary judgment**, **numeric grading**, or **rule evaluation**.
- Enforces structured JSON output for safe parsing.

---

## ⚙️ Data & Storage

- **✅ LocalStorage implementation** for API keys and user preferences with security notices
- **✅ Pinia state management** for reactive provider data and application state
- **✅ Encrypted storage patterns** with user acknowledgment of security practices
- **🔄 Future**: IndexedDB for projects, test suites, and runs
- **🔄 Future**: Import/Export JSON for backup or sharing
- **✅ Privacy-first**: All data stays in the browser — no backend or external storage

---

## 🧭 Application Structure

- **✅ Dashboard** – clean overview with navigation and project status
- **✅ Providers** – complete API key management, connectivity checks, and provider CRUD operations
- **🔄 Editor** – prompt creation, single runs, and output view *(next phase)*
- **🔄 Test Suites** – grouped test cases, batch runs, statistics *(future)*
- **🔄 Runs** – history, filters, and export tools *(future)*

### ✅ **Implemented Architecture Highlights**

- **Component-Based Design**: 10 reusable UI components (BaseButton, BaseDialog, BaseForm, etc.)
- **Feature-Driven Structure**: Organized by domain (providers, dashboard) with dedicated components
- **Clean Separation**: UI logic in reusable components, business logic in views, state in Pinia stores
- **Type-Safe Routing**: Vue Router 4 with TypeScript integration
- **Responsive Design**: Mobile-first approach with Quasar-like styling

---

## 💰 Pricing & Token Estimation

- Each provider defines cost per 1K input/output tokens.
- Token estimation uses either provider usage data or lightweight local approximations.
- Cost displayed per run and aggregated in stats.

---

## 🔒 Security & Privacy

- Keys are stored only locally and used directly from the browser.
- Clear warning about API key exposure and CORS limitations.
- Optional recipe to configure a **personal proxy** (e.g., Cloudflare Worker) if a provider blocks CORS.

---

## 🧪 Testing ✅ **IMPLEMENTED**

- **✅ Comprehensive test suite**: 34/34 tests passing with full coverage
- **✅ Boston School approach**: Behavior-driven testing focusing on user experience, not implementation
- **✅ Component tests**: ProvidersView, provider system, and UI component testing
- **✅ Real i18n integration**: Tests use production translation files (DRY principle)
- **✅ Mocked provider system**: Complete mock provider implementation for development
- **✅ Type-safe testing**: Full TypeScript support in test environment
- **✅ Vitest integration**: Fast, modern testing framework with HMR
- **🔄 Future**: Rule engine tests, cost estimation tests, E2E flows

---

## 🚀 Implementation Roadmap

| Phase                 | Status | Focus                                             | Key Deliverables                         |
| :-------------------- | :----: | :------------------------------------------------ | :--------------------------------------- |
| **0. Scaffold**       | ✅ | Base app setup (Vue, Vite, Pinia, Router, Vitest) | Project skeleton & local storage service |
| **1. Foundation**     | ✅ | Provider management & UI component library        | 10 reusable components, provider CRUD    |
| **1.5. Architecture** | ✅ | Clean code refactoring & testing foundation       | 75% code reduction, 34 passing tests     |
| **2. MVP Run**        | 🔄 | Single prompt test with OpenAI/Claude             | Response display, token/cost estimate    |
| **3. Rules Engine**   | 📋 | Add rule-based assertions                         | PASS/FAIL evaluation                     |
| **4. Batch Stats**    | 📋 | Multiple runs and metrics                         | Pass rate, cost & latency stats          |
| **5. Multi-Provider** | 🔄 | Expand provider support (Mistral, LeChat)         | Enhanced provider registry               |
| **6. AI Evaluator**   | 📋 | Model-based judgment/grading                      | Structured JSON evaluation               |
| **7. Hardening**      | 📋 | Retry, pricing updates, proxy support             | Stable release                           |
| **8. Enhancements**   | 📋 | PWA, reports, theming, advanced i18n              | Long-term improvements                   |

**Legend**: ✅ Complete | 🔄 In Progress | 📋 Planned

### ✅ **Phase 1.5 Achievement: Architecture Excellence**

- **Component Extraction**: Reduced main view from 762 to 190 lines (75% reduction)
- **Reusable UI Library**: 10 production-ready base components
- **Testing Excellence**: 34/34 tests with Boston School behavior-driven approach
- **Clean Code Standards**: SOLID principles, DRY compliance, ESLint enforcement
- **Type Safety**: Full TypeScript coverage with strict mode
- **Developer Experience**: Conventional commits, i18n integration, comprehensive documentation

---

## 🏗️ Technical Architecture Achievements

### Component System Excellence
- **10 Reusable UI Components**: BaseButton, BaseDialog, BaseForm, BaseCard, BaseBadge, BaseToast, BaseNotice, BaseSpinner, BaseInputField, BaseEmptyState
- **Feature Components**: ProviderCard, ProviderForm for domain-specific functionality
- **75% Code Reduction**: Main view reduced from 762 to 190 lines through component extraction
- **Type-Safe Props**: Full TypeScript interfaces for all component APIs
- **Slot-Based Flexibility**: Customizable component areas with Vue's slot system

### Clean Code Standards
- **SOLID Principles**: Single Responsibility, Open/Closed, Interface Segregation enforcement
- **DRY Compliance**: No code duplication, shared utilities and components
- **ESLint Rules**: Magic number elimination, consistent imports, proper naming
- **i18n First**: All user-facing text through translation system
- **Conventional Commits**: Automated commit message validation

### Testing Excellence  
- **Boston School Testing**: Behavior-driven tests that survive refactoring
- **34/34 Tests Passing**: Comprehensive coverage with realistic scenarios
- **Real i18n Integration**: Tests use production translations (no duplication)
- **Component Isolation**: Each component testable independently
- **Type-Safe Tests**: Full TypeScript support in test environment

## 🧱 Design Principles

- **✅ Front-end only**: no server dependencies, client-side architecture
- **✅ Modular architecture**: proven with 10+ reusable components and extensible provider system
- **🔄 Transparency first**: show costs, token counts, and pass rates *(next phase)*
- **✅ Local-first**: privacy-respecting, secure localStorage implementation
- **✅ Learner mindset**: focus on experimentation with clean, maintainable codebase
- **✅ Developer Experience**: comprehensive documentation, testing, and code quality standards

---

## 📦 Deliverables

### ✅ **Phase 1 Completed (Foundation)**
- **✅ Production-ready provider management system** with secure local storage
- **✅ 10 reusable UI components** with TypeScript interfaces and accessibility features
- **✅ Clean architecture foundation** with 75% code reduction and SOLID principles
- **✅ Comprehensive test suite** (34/34 passing) with behavior-driven approach
- **✅ Full internationalization** support with Vue I18n integration
- **✅ Developer experience excellence**: ESLint, Prettier, conventional commits, documentation

### 🔄 **Phase 2 In Progress (Core Features)**
- **🔄 Cross-provider AI prompt tester** (foundation complete, prompt interface next)
- **🔄 Enhanced provider support** (OpenAI/Claude implemented, more providers planned)

### 📋 **Future Phases**
- **📋 Rule-based test automation** with detailed statistics
- **📋 AI-based evaluator** for qualitative scoring
- **📋 Batch testing and analytics** with export capabilities
- **📋 Advanced features**: PWA support, theming, reporting

### 🎯 **Current State Summary**
We have successfully built a **production-ready foundation** that demonstrates:
- **Architectural excellence** with clean, maintainable, and testable code
- **Component-driven development** with reusable UI patterns
- **Type safety and developer experience** with comprehensive tooling
- **Testing maturity** with behavior-driven approaches and full coverage
- **Ready for rapid feature development** with solid technical foundation
