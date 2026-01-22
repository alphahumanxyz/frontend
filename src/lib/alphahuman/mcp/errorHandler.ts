/**
 * Error handling utilities for MCP server
 */

import type { MCPToolResult } from './types';

import { ValidationError } from './validation';

export enum ErrorCategory {
  CHAT = 'CHAT',
  MSG = 'MSG',
  CONTACT = 'CONTACT',
  GROUP = 'GROUP',
  MEDIA = 'MEDIA',
  PROFILE = 'PROFILE',
  AUTH = 'AUTH',
  ADMIN = 'ADMIN',
  VALIDATION = 'VALIDATION',
  SEARCH = 'SEARCH',
  DRAFT = 'DRAFT',
}

/**
 * Generate error code from function name and category
 */
function generateErrorCode(
  functionName: string,
  category?: ErrorCategory | string,
): string {
  if (category === 'VALIDATION-001' || category === ErrorCategory.VALIDATION) {
    return 'VALIDATION-001';
  }

  const prefix = category
    ? typeof category === 'string' && category.startsWith('VALIDATION')
      ? category
      : category
    : 'GEN';

  const hash = Math.abs(
    functionName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0),
  ) % 1000;

  return `${prefix}-ERR-${hash.toString().padStart(3, '0')}`;
}

/**
 * Log and format error for MCP response
 */
export function logAndFormatError(
  functionName: string,
  error: Error,
  category?: ErrorCategory | string,
  context?: Record<string, unknown>,
): MCPToolResult {
  const errorCode = generateErrorCode(functionName, category);
  const contextStr = context
    ? Object.entries(context)
      .map(([k, v]) => `${k}=${String(v)}`)
      .join(', ')
    : '';

  // Log the full technical error
  // eslint-disable-next-line no-console
  console.error(`[MCP] Error in ${functionName} (${contextStr}) - Code: ${errorCode}`, error);

  // Return user-friendly message
  const userMessage = error instanceof ValidationError
    ? error.message
    : `An error occurred (code: ${errorCode}). Check logs for details.`;

  return {
    content: [
      {
        type: 'text',
        text: userMessage,
      },
    ],
    isError: true,
  };
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<MCPToolResult>>(
  fn: T,
  category?: ErrorCategory,
): T {
  return (async (...args: Parameters<T>): Promise<MCPToolResult> => {
    try {
      return await fn(...args);
    } catch (error) {
      const functionName = fn.name || 'unknown';
      return logAndFormatError(
        functionName,
        error instanceof Error ? error : new Error(String(error)),
        category,
        { args: JSON.stringify(args) },
      );
    }
  }) as T;
}
