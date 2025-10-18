/**
 * Utility functions for ID generation
 */

/**
 * Generates a unique identifier using crypto.randomUUID()
 * @returns A unique UUID string
 */
export const generateId = (): string => {
  return crypto.randomUUID();
};

/**
 * Generates a prefixed ID for specific entity types
 * @param prefix - The prefix to add to the ID
 * @returns A prefixed unique ID
 */
export const generatePrefixedId = (prefix: string): string => {
  return `${prefix}-${crypto.randomUUID()}`;
};

// Constants for ID generation
const BASE_36 = 36;
const RANDOM_SUBSTRING_START = 2;

/**
 * Generates a timestamp-based ID for ordering purposes
 * @param prefix - Optional prefix for the ID
 * @returns A timestamp-based ID
 */
export const generateTimestampId = (prefix?: string): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(BASE_36).substring(RANDOM_SUBSTRING_START);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
};
