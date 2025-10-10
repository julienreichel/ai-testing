# AI Provider Adapter System

A comprehensive, plug-and-play system for integrating with multiple AI providers (OpenAI, Claude, Mistral, LeChat) with a unified interface.

## 🏗️ Architecture Overview

The provider system follows a **plug-and-play architecture** where every provider implements the same interface, making them completely interchangeable from the application's perspective.

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│                  Provider Registry                          │
├─────────────────────────────────────────────────────────────┤
│                  Provider Factory                           │
├─────────────────────────────────────────────────────────────┤
│               BaseProviderAdapter (Interface)               │
├────────────┬────────────┬────────────┬────────────┬─────────┤
│   OpenAI   │   Claude   │   Mistral  │   LeChat   │  Mock   │
│  Adapter   │   Adapter  │   Adapter  │   Adapter  │ Adapter │
└────────────┴────────────┴────────────┴────────────┴─────────┘
```

## 🔧 Core Components

### 1. **BaseProviderAdapter** (Abstract Class)
The foundation interface that all providers must implement:

```typescript
abstract class BaseProviderAdapter {
  // Required implementations
  abstract getModels(): ProviderModel[]
  abstract getPricing(model: string): ProviderPricing | null
  abstract call(request: ProviderRequest): Promise<ProviderResponse>
  abstract validateConfig(): boolean

  // Shared utilities
  estimateTokens(text: string): number
  estimateCost(inputTokens: number, outputTokens: number, model: string): number
}
```

### 2. **Provider Types**
Comprehensive TypeScript interfaces for type safety:

```typescript
interface ProviderRequest {
  model: string
  messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

interface ProviderResponse {
  content: string
  model: string
  usage: { inputTokens: number, outputTokens: number, totalTokens: number }
  cost: { inputCost: number, outputCost: number, totalCost: number }
  metadata: { latency: number, requestId: string, provider: string, timestamp: Date }
}
```

### 3. **Provider Factory**
Creates provider instances with type safety:

```typescript
const provider = ProviderFactory.createProvider('openai', {
  id: 'my-openai',
  name: 'My OpenAI Provider',
  apiKey: 'sk-...',
  isActive: true
})
```

### 4. **Provider Registry**
Manages multiple provider instances:

```typescript
const registry = new ProviderRegistry()
registry.addProvider('openai', openAIConfig)
registry.addProvider('mock', mockConfig)

const activeProviders = registry.getActiveProviders()
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { ProviderFactory } from './providers'

// Create a provider
const provider = ProviderFactory.createProvider('openai', {
  id: 'my-openai',
  name: 'My OpenAI Provider',
  apiKey: 'your-api-key-here',
  isActive: true
})

// Make a request
const response = await provider.call({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'user', content: 'Hello, how are you?' }
  ],
  temperature: 0.7,
  maxTokens: 100
})

console.log('Response:', response.content)
console.log('Cost:', `$${response.cost.totalCost}`)
console.log('Tokens:', response.usage.totalTokens)
```

### Using with Vue Store

```typescript
// In your component
import { useProvidersStore } from '@/store/providers'

const providersStore = useProvidersStore()

// Add a provider
providersStore.addProvider('openai', {
  name: 'My OpenAI',
  apiKey: 'sk-...',
  isActive: true
})

// Get active providers
const activeProviders = providersStore.activeProviders
```

## 🔌 Supported Providers

### ✅ **OpenAI** (Fully Implemented)
- **Models**: `gpt-4o-mini`, `gpt-4-turbo`
- **Features**: Full API integration, rate limiting, error handling
- **Pricing**: Current 2024 pricing included
- **Auth**: Bearer token authentication

```typescript
const openAI = ProviderFactory.createProvider('openai', {
  id: 'openai-main',
  name: 'OpenAI GPT',
  apiKey: 'sk-your-api-key',
  isActive: true
})
```

### 🔧 **Mock Provider** (For Testing)
- **Models**: `mock-fast`, `mock-smart`
- **Features**: Simulated responses, latency, token counting
- **Cost**: Test pricing for development
- **Auth**: No authentication required

```typescript
const mock = ProviderFactory.createProvider('mock', {
  id: 'mock-test',
  name: 'Test Provider',
  isActive: true
})
```

### 🚧 **Coming Soon**
- **Claude** (Anthropic)
- **Mistral AI**
- **LeChat**

## 💰 Pricing & Cost Estimation

The system includes built-in cost calculation and estimation:

```typescript
// Get pricing for a model
const pricing = provider.getPricing('gpt-4o-mini')
// Returns: { inputTokensPer1K: 0.00015, outputTokensPer1K: 0.0006 }

// Estimate tokens in text
const tokens = provider.estimateTokens('Your text here')

// Estimate cost before making request
const estimatedCost = provider.estimateCost(1000, 500, 'gpt-4o-mini')
console.log(`Estimated cost: $${estimatedCost}`)
```

## 🛡️ Error Handling

Comprehensive error handling with typed error responses:

```typescript
try {
  const response = await provider.call(request)
} catch (error) {
  const providerError = JSON.parse(error.message)
  
  switch (providerError.type) {
    case 'auth':
      console.log('Authentication failed')
      break
    case 'rate_limit':
      console.log('Rate limit exceeded')
      break
    case 'invalid_request':
      console.log('Invalid request:', providerError.message)
      break
    case 'server_error':
      console.log('Server error:', providerError.message)
      break
    case 'network_error':
      console.log('Network error:', providerError.message)
      break
  }
}
```

## 🧪 Testing

The system includes comprehensive tests using Vitest:

```bash
# Run all provider tests
npm test

# Run specific provider tests
npx vitest test/providers.test.ts
```

### Test Coverage
- ✅ Mock provider functionality
- ✅ OpenAI provider setup and validation
- ✅ Provider factory creation
- ✅ Provider registry management
- ✅ Error handling scenarios
- ✅ Cost estimation accuracy

## 🔧 Adding New Providers

To add a new provider (e.g., Claude):

1. **Create the adapter class**:
```typescript
export class ClaudeProviderAdapter extends BaseProviderAdapter {
  getModels(): ProviderModel[] {
    return [
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        contextWindow: 200000,
        maxOutputTokens: 4096,
      }
    ]
  }

  getPricing(model: string): ProviderPricing | null {
    return {
      inputTokensPer1K: 0.00025,
      outputTokensPer1K: 0.00125,
    }
  }

  async call(request: ProviderRequest): Promise<ProviderResponse> {
    // Implement Claude API integration
  }

  validateConfig(): boolean {
    return Boolean(this.config.apiKey)
  }
}
```

2. **Register in the factory**:
```typescript
// In ProviderFactory
private static readonly PROVIDER_CONSTRUCTORS = {
  openai: OpenAIProviderAdapter,
  claude: ClaudeProviderAdapter, // Add here
  mock: MockProviderAdapter,
}
```

3. **Add to types**:
```typescript
export type ProviderType = 'openai' | 'claude' | 'mock'
```

## 📱 Integration Examples

### Dashboard Integration
```typescript
// Display provider stats
const stats = {
  totalProviders: registry.getAllProviders().length,
  activeProviders: registry.getActiveProviders().length,
  totalCost: calculateTotalCost(),
}
```

### Test Runner Integration
```typescript
// Run tests across multiple providers
const testResults = await Promise.all(
  activeProviders.map(async provider => {
    const response = await provider.call(testRequest)
    return {
      provider: provider.getName(),
      response: response.content,
      cost: response.cost.totalCost,
      latency: response.metadata.latency,
    }
  })
)
```

## 🎯 Key Benefits

1. **🔄 Plug-and-Play**: Add new providers without changing application code
2. **🛡️ Type Safety**: Full TypeScript support throughout
3. **💰 Cost Tracking**: Built-in cost estimation and tracking
4. **🧪 Testable**: Mock provider for testing and development
5. **⚡ Performance**: Efficient registry and factory patterns
6. **🔍 Observable**: Comprehensive logging and metadata
7. **🛠️ Configurable**: Flexible configuration per provider

## 🚀 Next Steps

The provider system is ready for:
- Adding more AI providers (Claude, Mistral, LeChat)
- Integration with the test runner
- Cost analytics and reporting
- Provider performance monitoring
- Batch request handling

This architecture ensures that the AI Testing Platform can support any AI provider with minimal integration work! 🎉