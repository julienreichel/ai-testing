# 🧠 AI Tester — Knowledge Base

## Overview

**AI Tester** is a front-end-only Vue 3 + TypeScript application (built with Vite + Vitest) designed to **test, compare, and validate prompts** across multiple AI providers such as OpenAI, Claude, Mistral, or LeChat.
The app helps users evaluate model responses, measure cost and token usage, define pass/fail rules, and run statistical reliability tests — all locally in the browser.

---

## 🎯 Core Objectives

* Provide a **unified playground** for testing prompts on different AI APIs.
* Enable **plug-and-play providers**: new APIs can be added easily as modules.
* Let users **store their API keys locally**, without any backend.
* Offer **transparent token and cost estimation** for each run.
* Support **custom validation rules** to automatically test AI outputs.
* Allow **batch testing and statistical analysis** of result consistency.
* Later, enable **AI-based evaluation** for subjective or qualitative scoring.

---

## 🧩 Main Features

### Providers

* Modular system for integrating different AI providers.
* Each provider defines its models, pricing, tokenizer, and cost estimation.
* Default modules: OpenAI, Anthropic (Claude), Mistral, LeChat.
* User can select provider/model and enter API key locally.

### Prompt Testing

* Interface for editing **system prompt, user prompt**, and model parameters.
* Displays model response, latency, token usage, and cost estimate.
* Results can be saved as **Test Cases**.

### Rules & Assertions

* Rules verify output quality automatically.
* Supported conditions:

  * exact match
  * contains / starts / ends with text
  * regex match
  * length limits
  * (later) JSON schema validity
* Each test returns **PASS/FAIL** feedback with detailed messages.

### Batch Runs & Statistics

* Execute prompts multiple times to assess reliability.
* Metrics displayed:

  * pass/fail ratio
  * grade distribution (if AI evaluator)
  * average tokens, cost, and latency
* Export results in JSON or CSV.

### AI-Based Evaluation (Phase 2)

* Use another model to grade or validate outputs automatically.
* Modes: **binary judgment**, **numeric grading**, or **rule evaluation**.
* Enforces structured JSON output for safe parsing.

---

## ⚙️ Data & Storage

* **LocalStorage** for keys and preferences.
* **IndexedDB** for projects, test suites, and runs.
* **Import/Export** JSON for backup or sharing.
* All data stays in the browser — no backend or external storage.

---

## 🧭 Application Structure

* **Dashboard** – overview, recent runs, quick actions
* **Providers** – API key management and connectivity checks
* **Editor** – prompt creation, single runs, and output view
* **Test Suites** – grouped test cases, batch runs, statistics
* **Runs** – history, filters, and export tools

---

## 💰 Pricing & Token Estimation

* Each provider defines cost per 1K input/output tokens.
* Token estimation uses either provider usage data or lightweight local approximations.
* Cost displayed per run and aggregated in stats.

---

## 🔒 Security & Privacy

* Keys are stored only locally and used directly from the browser.
* Clear warning about API key exposure and CORS limitations.
* Optional recipe to configure a **personal proxy** (e.g., Cloudflare Worker) if a provider blocks CORS.

---

## 🧪 Testing

* **Unit tests** for rule engine, cost estimation, statistics, and storage.
* **Component tests** for prompt editor and result viewer.
* **Mocked provider tests** to simulate API behavior and rate-limit errors.
* **E2E-style flow**: create → run → assert → analyze.

---

## 🚀 Implementation Roadmap

| Phase                 | Focus                                             | Key Deliverables                         |
| :-------------------- | :------------------------------------------------ | :--------------------------------------- |
| **0. Scaffold**       | Base app setup (Vue, Vite, Pinia, Router, Vitest) | Project skeleton & local storage service |
| **1. MVP Run**        | Single prompt test with OpenAI                    | Response display, token/cost estimate    |
| **2. Rules Engine**   | Add rule-based assertions                         | PASS/FAIL evaluation                     |
| **3. Batch Stats**    | Multiple runs and metrics                         | Pass rate, cost & latency stats          |
| **4. Multi-Provider** | Add Claude, Mistral, LeChat                       | Modular provider registry                |
| **5. AI Evaluator**   | Model-based judgment/grading                      | Structured JSON evaluation               |
| **6. Hardening**      | Retry, pricing updates, proxy support             | Stable release                           |
| **7. Enhancements**   | PWA, reports, theming, i18n                       | Long-term improvements                   |

---

## 🧱 Design Principles

* **Front-end only**: no server dependencies.
* **Modular architecture**: easy provider and rule extension.
* **Transparency first**: show costs, token counts, and pass rates.
* **Local-first**: privacy-respecting, offline-capable data.
* **Learner mindset**: focus on experimentation and understanding model behavior.

---

## 📦 Deliverables

* Cross-provider AI prompt tester (front-end only).
* Local persistence for keys, prompts, and runs.
* Rule-based test automation with detailed statistics.
* Optional AI-based evaluator for qualitative scoring.
* Extensible architecture ready for community or plugin expansion.

