// Core application types
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Provider {
  id: string;
  name: string;
  type: "openai" | "anthropic" | "google" | "custom";
  apiKey?: string;
  baseUrl?: string;
  isActive: boolean;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  prompt: string;
  expectedOutput?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TestRunResult {
  id: string;
  testCaseId: string;
  executedAt: Date;
  success: boolean;
  output?: string;
  error?: string;
  metrics?: {
    responseTime: number;
    tokensUsed: number;
    cost?: number;
  };
}

// Re-export domain-specific types
export * from "./rules";
export * from "./testManagement";

export interface NavigationItem {
  name: string;
  path: string;
  icon?: string;
}
