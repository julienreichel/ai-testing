// Core application types
export interface User {
  id: string
  name: string
  email: string
}

export interface Provider {
  id: string
  name: string
  type: 'openai' | 'anthropic' | 'google' | 'custom'
  apiKey?: string
  baseUrl?: string
  isActive: boolean
}

export interface TestCase {
  id: string
  name: string
  description: string
  prompt: string
  expectedOutput?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface TestRun {
  id: string
  testCaseId: string
  providerId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  input: string
  output?: string
  metrics?: {
    responseTime: number
    tokens: number
    cost?: number
  }
  createdAt: Date
  completedAt?: Date
}

export interface NavigationItem {
  name: string
  path: string
  icon?: string
}
