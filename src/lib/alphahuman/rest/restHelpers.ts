import { BACKEND_API_URL } from '../../../config';
import getAlpahHumanSocketManager from '../index';
import { log } from '../logger';

export interface RestContext {
  backendUrl: string;
}

/**
 * Get JWT token from global state (preferred) or sessionStorage (fallback)
 */
function getJwtToken(): string | undefined {
  try {
    // Try global state first (via alphahuman service)
    const socketManager = getAlpahHumanSocketManager();
    return socketManager.getJwtToken();
  } catch (error) {
    log('AUTH ERROR', 'Error loading JWT token:', error);
    return undefined;
  }
}

/**
 * Delete JWT token from state and storage
 */
function deleteJwtToken(): void {
  try {
    // Clear token from global state via alphahuman service
    const socketManager = getAlpahHumanSocketManager();
    socketManager.saveJwtTokenToSession(undefined);
  } catch (error) {
    log('AUTH ERROR', 'Error deleting JWT token:', error);
  }
}

/**
 * Make an authenticated REST API request
 * @param method - HTTP method (GET, POST, PUT, etc.)
 * @param path - API path (e.g., '/telegram/me')
 * @param data - Request body data (for POST/PUT requests)
 * @param queryParams - Query parameters (for GET requests)
 * @returns Promise that resolves with the response data
 */
export async function makeRestRequest<ReqBody = unknown, Response = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: ReqBody,
  queryParams?: Record<string, string>,
): Promise<Response> {
  const jwtToken = getJwtToken();
  if (!jwtToken) {
    throw new Error('JWT token not found. Please authenticate first.');
  }

  const backendUrl = BACKEND_API_URL || '';
  if (!backendUrl) {
    throw new Error('Backend API URL not configured');
  }

  // Build URL with query parameters
  const url = new URL(path, backendUrl);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  // Prepare request options
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwtToken}`,
  };

  const options: RequestInit = {
    method,
    headers,
  };

  // Add body for POST/PUT requests
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  log('REQUEST', `${method} ${url.pathname}${url.search}`);

  try {
    const response = await fetch(url.toString(), options);

    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        // If JSON parsing fails, use the raw text
        if (errorText) {
          errorMessage = errorText;
        }
      }

      if (response.status === 401) {
        log('AUTH ERROR', 'Authentication failed (401):', errorMessage);
        // Delete JWT token from storage on 401 error
        deleteJwtToken();
        throw new Error(`Authentication failed: ${errorMessage}`);
      }

      if (response.status === 403) {
        log('AUTH ERROR', 'Authentication failed (403):', errorMessage);
        throw new Error(`Authentication failed: ${errorMessage}`);
      }

      log('BACKEND ERROR', errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    log('RESPONSE', `Response from ${method} ${path}:`, result);

    // Backend returns { success: true, data: ... }
    if (result.success && result.data !== undefined) {
      return result.data as Response;
    }

    // If response doesn't follow the standard format, return as-is
    return result as Response;
  } catch (error) {
    log('BACKEND ERROR', `Failed to make ${method} request to ${path}:`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to make ${method} request to ${path}`);
  }
}
