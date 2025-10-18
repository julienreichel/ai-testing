/**
 * Task Pool Utility - Manages bounded parallel execution with cancellation support
 * Implements a task pool pattern to limit concurrent executions while maintaining ordering
 */

export interface TaskPoolOptions {
  concurrency: number;
  abortController?: AbortController;
}

export interface Task<T> {
  id: string;
  execute: () => Promise<T>;
}

export interface TaskResult<T> {
  id: string;
  result?: T;
  error?: Error;
  status: 'completed' | 'failed' | 'cancelled';
}

/**
 * Execute tasks in parallel with bounded concurrency
 * @param tasks Array of tasks to execute
 * @param options Configuration for concurrency and cancellation
 * @returns Promise that resolves when all tasks are complete or cancelled
 */
export async function runPool<T>(
  tasks: Task<T>[],
  options: TaskPoolOptions
): Promise<TaskResult<T>[]> {
  const { concurrency, abortController } = options;
  const results: TaskResult<T>[] = [];

  // Initialize results array
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task) {
      results[i] = {
        id: task.id,
        status: 'cancelled'
      };
    }
  }

  if (tasks.length === 0) {
    return results;
  }

  // Simple approach: use Promise.allSettled with chunking for concurrency
  const chunks: Task<T>[][] = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    chunks.push(tasks.slice(i, i + concurrency));
  }

  let taskIndex = 0;

  for (const chunk of chunks) {
    if (abortController?.signal.aborted) {
      break;
    }

    // Execute chunk in parallel
    const chunkPromises = chunk.map(async (task, chunkIndex): Promise<void> => {
      const currentIndex = taskIndex + chunkIndex;

      try {
        if (abortController?.signal.aborted) {
          results[currentIndex] = {
            id: task.id,
            status: 'cancelled'
          };
          return;
        }

        const result = await task.execute();

        if (abortController?.signal.aborted) {
          results[currentIndex] = {
            id: task.id,
            status: 'cancelled'
          };
          return;
        }

        results[currentIndex] = {
          id: task.id,
          result,
          status: 'completed'
        };
      } catch (error) {
        const taskError = error instanceof Error ? error : new Error(String(error));

        if (taskError.name === 'AbortError' || abortController?.signal.aborted) {
          results[currentIndex] = {
            id: task.id,
            status: 'cancelled'
          };
        } else {
          results[currentIndex] = {
            id: task.id,
            error: taskError,
            status: 'failed'
          };
        }
      }
    });

    await Promise.allSettled(chunkPromises);
    taskIndex += chunk.length;
  }

  return results;
}

/**
 * Create a sleep function that respects cancellation
 * @param ms Milliseconds to sleep
 * @param abortController Optional abort controller for cancellation
 * @returns Promise that resolves after delay or rejects if cancelled
 */
export function sleep(ms: number, abortController?: AbortController): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, ms);

    if (abortController) {
      const onAbort = (): void => {
        clearTimeout(timeoutId);
        reject(new Error('Sleep was aborted'));
      };

      if (abortController.signal.aborted) {
        clearTimeout(timeoutId);
        reject(new Error('Sleep was aborted'));
        return;
      }

      abortController.signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}
