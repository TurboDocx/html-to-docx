import { nanoid } from 'nanoid';

/**
 * Generates a unique ID for media files.
 * This function can be mocked in tests for deterministic output.
 *
 * @returns {string} A unique ID
 */
export function generateMediaId() {
  return nanoid();
}

/**
 * Creates a deterministic ID generator for testing purposes.
 * Returns a function that generates sequential numeric IDs.
 *
 * @returns {function(): string} A function that generates deterministic IDs
 */
export function createDeterministicIdGenerator() {
  let counter = 0;
  return () => {
    const id = counter.toString();
    counter += 1;
    return id;
  };
}
