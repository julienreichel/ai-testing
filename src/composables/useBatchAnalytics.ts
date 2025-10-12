/**
 * Batch Statistics Analysis Composable
 * Provides enhanced statistical analysis for batch runs
 */

import { computed, type ComputedRef } from "vue";
import type { BatchRunResult } from "./useBatchRunner";

// Constants to avoid magic numbers
const PERCENTAGE_MULTIPLIER = 100;
const HALF_DIVISOR = 2;
const POWER_OF_TWO = 2;
const P25_PERCENTILE = 0.25;
const P50_PERCENTILE = 0.5;
const P75_PERCENTILE = 0.75;
const P90_PERCENTILE = 0.9;
const P95_PERCENTILE = 0.95;
const P99_PERCENTILE = 0.99;
const LOW_CONSISTENCY_THRESHOLD = 70;
const HIGH_LATENCY_THRESHOLD = 2000;

export interface LatencyPercentiles {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface BatchAnalytics {
  latencyPercentiles: LatencyPercentiles;
  costEfficiency: {
    costPerSuccess: number;
    costPerToken: number;
  };
  reliability: {
    consistency: number;
    stabilityScore: number;
  };
  recommendations: string[];
}

const calculatePercentiles = (values: number[]): LatencyPercentiles => {
  if (values.length === 0) {
    return { p25: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const getPercentile = (p: number): number => {
    const index = Math.floor(sorted.length * p);
    return sorted[Math.min(index, sorted.length - 1)] || 0;
  };

  return {
    p25: getPercentile(P25_PERCENTILE),
    p50: getPercentile(P50_PERCENTILE),
    p75: getPercentile(P75_PERCENTILE),
    p90: getPercentile(P90_PERCENTILE),
    p95: getPercentile(P95_PERCENTILE),
    p99: getPercentile(P99_PERCENTILE),
  };
};

const calculateConsistency = (results: BatchRunResult[]): number => {
  const passResults = results.map(r => r.passed ? 1 : 0);
  if (passResults.length === 0) return 0;

  const passCount = passResults.reduce((sum: number, val) => sum + val, 0);
  const passRate = passCount / passResults.length;
  
  const variance = passResults.reduce((sum: number, val) => {
    return sum + Math.pow(val - passRate, POWER_OF_TWO);
  }, 0) / passResults.length;
  
  const consistencyScore = Math.max(0, (1 - variance) * PERCENTAGE_MULTIPLIER);
  return Math.round(consistencyScore);
};

export function useBatchAnalytics(results: BatchRunResult[]): {
  analytics: ComputedRef<BatchAnalytics>;
} {
  const analytics = computed((): BatchAnalytics => {
    const completed = results.filter(r => r.status === "completed");
    const successful = completed.filter(r => r.passed);

    const durations = completed
      .map(r => r.duration)
      .filter((d): d is number => d !== undefined);
    
    const costs = completed
      .map(r => r.cost)
      .filter((c): c is number => c !== undefined);

    const latencyPercentiles = calculatePercentiles(durations);

    const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
    const successfulRuns = successful.length;
    const costPerSuccess = successfulRuns > 0 ? totalCost / successfulRuns : 0;
    const totalTokens = completed.reduce((sum, r) => sum + (r.tokenUsage?.totalTokens || 0), 0);
    const costPerToken = totalTokens > 0 ? totalCost / totalTokens : 0;

    const consistency = calculateConsistency(completed);
    const stabilityScore = Math.round(consistency / HALF_DIVISOR);

    const recommendations: string[] = [];
    if (consistency < LOW_CONSISTENCY_THRESHOLD) {
      recommendations.push("Consider reviewing test consistency");
    }
    if (latencyPercentiles.p90 > HIGH_LATENCY_THRESHOLD) {
      recommendations.push("High latency detected - optimize prompts");
    }
    if (recommendations.length === 0) {
      recommendations.push("Batch execution performing well");
    }

    return {
      latencyPercentiles,
      costEfficiency: {
        costPerSuccess,
        costPerToken,
      },
      reliability: {
        consistency,
        stabilityScore,
      },
      recommendations,
    };
  });

  return {
    analytics,
  };
}