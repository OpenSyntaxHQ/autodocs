/**
 * A user object
 */
export interface User {
  /** Unique ID */
  id: string;

  /** User name */
  name: string;

  /** Email address */
  email?: string;
}

/**
 * Format a date
 *
 * @param {Date} date - The date to format
 * @returns Formatted date string
 * @deprecated Use formatDateV2 instead.
 *
 * @example
 * ```typescript
 * const formatted = formatDate(new Date());
 * console.log(formatted);
 * ```
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}
