/**
 * Provider System Usage Examples
 *
 * This file demonstrates how to use the provider adapter system
 * for integrating with different AI providers.
 */

import { ProviderFactory, ProviderRegistry } from '../providers'
import type { ProviderConfig, ProviderRequest } from '../types/providers'

// Example 1: Basic Provider Setup
export async function setupBasicProvider(): Promise<void> {
  // Create a mock provider for testing
  const mockConfig: ProviderConfig = {
    id: 'mock_demo',
    name: 'Demo Mock Provider',
    isActive: true,
  }

  const mockProvider = ProviderFactory.createProvider('mock', mockConfig)

  console.log('Mock Provider Models:', mockProvider.getModels())
  console.log('Mock Provider Pricing:', mockProvider.getPricing('mock-fast'))

  // Test a simple request
  const request: ProviderRequest = {
    model: 'mock-fast',
    messages: [
      { role: 'user', content: 'Hello, how are you?' }
    ],
    temperature: 0.7,
    maxTokens: 100,
  }

  try {
    const response = await mockProvider.call(request)
    console.log('Mock Response:', response)
  } catch (error) {
    console.error('Mock Provider Error:', error)
  }
}

// Example 2: OpenAI Provider Setup
export async function setupOpenAIProvider(): Promise<void> {
  // Note: You would get this from user input/settings
  const openAIConfig: ProviderConfig = {
    id: 'openai_demo',
    name: 'Demo OpenAI Provider',
    apiKey: 'your-openai-api-key-here', // Replace with actual key
    isActive: true,
  }

  const openAIProvider = ProviderFactory.createProvider('openai', openAIConfig)

  console.log('OpenAI Models:', openAIProvider.getModels())
  console.log('GPT-4o-mini Pricing:', openAIProvider.getPricing('gpt-4o-mini'))

  // Only attempt API call if we have a real API key
  if (openAIConfig.apiKey && openAIConfig.apiKey !== 'your-openai-api-key-here') {
    const request: ProviderRequest = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Explain what a REST API is in one sentence.' }
      ],
      temperature: 0.3,
      maxTokens: 50,
    }

    try {
      const response = await openAIProvider.call(request)
      console.log('OpenAI Response:', response.content)
      console.log('Cost:', `$${response.cost.totalCost.toFixed(4)}`)
      console.log('Tokens Used:', response.usage.totalTokens)
    } catch (error) {
      console.error('OpenAI Provider Error:', error)
    }
  }
}

// Example 3: Using Provider Registry
export function useProviderRegistry(): void {
  const registry = new ProviderRegistry()

  // Add multiple providers
  const mockConfig: ProviderConfig = {
    id: 'mock_1',
    name: 'Mock Provider 1',
    isActive: true,
  }

  const openAIConfig: ProviderConfig = {
    id: 'openai_1',
    name: 'OpenAI Provider 1',
    apiKey: 'sk-fake-key-for-demo',
    isActive: false, // Inactive for demo
  }

  registry.addProvider('mock', mockConfig)
  registry.addProvider('openai', openAIConfig)

  console.log('All Providers:', registry.getAllProviders().length)
  console.log('Active Providers:', registry.getActiveProviders().length)

  // Get specific provider
  const mockProvider = registry.getProvider('mock_1')
  if (mockProvider) {
    console.log('Found mock provider:', mockProvider.getName())
  }

  // Update provider config
  registry.updateProviderConfig('openai_1', { isActive: true })
  console.log('Active Providers after update:', registry.getActiveProviders().length)
}

// Example 4: Cost Estimation
export function demonstrateCostEstimation(): void {
  const mockProvider = ProviderFactory.createProvider('mock', {
    id: 'cost_demo',
    name: 'Cost Demo Provider',
    isActive: true,
  })

  const text = 'This is a sample text for token estimation. It should be counted accurately.'
  const estimatedTokens = mockProvider.estimateTokens(text)
  console.log(`Text: "${text}"`)
  console.log(`Estimated tokens: ${estimatedTokens}`)

  const TOKENS_1000 = 1000
  const TOKENS_500 = 500
  const estimatedCost = mockProvider.estimateCost(TOKENS_1000, TOKENS_500, 'mock-fast')
  console.log(`Cost for 1000 input + 500 output tokens: $${estimatedCost.toFixed(6)}`)
}

// Example 5: Error Handling
export async function demonstrateErrorHandling(): Promise<void> {
  // Test with invalid configuration
  const invalidProvider = ProviderFactory.createProvider('openai', {
    id: 'invalid_openai',
    name: 'Invalid OpenAI',
    // No API key provided
    isActive: true,
  })

  const request: ProviderRequest = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Test message' }],
  }

  try {
    await invalidProvider.call(request)
  } catch (error) {
    console.log('Expected error for invalid provider:', error)
  }
}

// Run examples
if (import.meta.env.MODE === 'development') {
  console.log('=== Provider System Examples ===')

  setupBasicProvider()
    .then(() => setupOpenAIProvider())
    .then(() => useProviderRegistry())
    .then(() => {
      demonstrateCostEstimation()
      return demonstrateErrorHandling()
    })
    .then(() => console.log('=== Examples Complete ==='))
    .catch(console.error)
}
