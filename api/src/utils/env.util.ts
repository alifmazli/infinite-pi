/**
 * Utility functions for parsing environment variables
 */

/**
 * Get a number from environment variables with a default value
 * @param key - The environment variable key
 * @param defaultValue - The default value if the key is not set
 * @returns The parsed number or default value
 * @throws Error if the value is set but cannot be parsed as a number
 */
export function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for ${key}: ${value}`);
  }
  return parsed;
}

/**
 * Get a boolean from environment variables with a default value
 * @param key - The environment variable key
 * @param defaultValue - The default value if the key is not set
 * @returns The parsed boolean or default value
 */
export function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true' || value === '1';
}
