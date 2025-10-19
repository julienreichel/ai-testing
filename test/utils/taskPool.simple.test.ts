import { describe, it, expect } from "vitest";
import { runPool } from "utils/taskPool";
import type { Task } from "utils/taskPool";

const TINY_DELAY = 1; // ms

describe("Task Pool - Core Functionality", () => {
  it("should execute tasks and return results", async () => {
    const tasks: Task<string>[] = [
      {
        id: "task1",
        execute: async (): Promise<string> => {
          await new Promise((resolve) => setTimeout(resolve, TINY_DELAY));
          return "result1";
        },
      },
      {
        id: "task2",
        execute: async (): Promise<string> => {
          await new Promise((resolve) => setTimeout(resolve, TINY_DELAY));
          return "result2";
        },
      },
    ];

    const results = await runPool(tasks, { concurrency: 2 });

    expect(results).toHaveLength(2);
    expect(results[0]?.status).toBe("completed");
    expect(results[0]?.result).toBe("result1");
    expect(results[1]?.status).toBe("completed");
    expect(results[1]?.result).toBe("result2");
  });

  it("should handle task errors", async () => {
    const tasks: Task<string>[] = [
      {
        id: "good",
        execute: async (): Promise<string> => {
          await new Promise((resolve) => setTimeout(resolve, TINY_DELAY));
          return "success";
        },
      },
      {
        id: "bad",
        execute: async (): Promise<string> => {
          await new Promise((resolve) => setTimeout(resolve, TINY_DELAY));
          throw new Error("failure");
        },
      },
    ];

    const results = await runPool(tasks, { concurrency: 2 });

    expect(results[0]?.status).toBe("completed");
    expect(results[1]?.status).toBe("failed");
    expect(results[1]?.error?.message).toBe("failure");
  });

  it("should handle cancellation", async () => {
    const abortController = new AbortController();
    abortController.abort(); // Cancel immediately

    const tasks: Task<string>[] = [
      {
        id: "task1",
        execute: async (): Promise<string> => {
          await new Promise((resolve) => setTimeout(resolve, TINY_DELAY));
          return "result1";
        },
      },
    ];

    const results = await runPool(tasks, {
      concurrency: 1,
      abortController,
    });

    expect(results[0]?.status).toBe("cancelled");
  });

  it("should handle empty task array", async () => {
    const results = await runPool([], { concurrency: 2 });
    expect(results).toHaveLength(0);
  });
});
