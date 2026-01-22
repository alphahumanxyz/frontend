import { BACKEND_API_URL } from '../../../config';
import { log } from '../logger';

export interface CreateLoginTokenResponse {
  token: string;
  expiresAt: string; // ISO date string
}

export interface ConsumeLoginTokenResponse {
  jwtToken: string;
}

/**
 * Make an unauthenticated REST API request (for login token endpoints)
 */
async function makeUnauthenticatedRequest<ReqBody = unknown, Response = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: ReqBody,
): Promise<Response> {
  const backendUrl = BACKEND_API_URL || '';
  if (!backendUrl) {
    throw new Error('Backend API URL not configured');
  }

  const url = new URL(path, backendUrl);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  // Add body for POST/PUT requests
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  log('REQUEST', `${method} ${url.pathname} (unauthenticated)`);

  try {
    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        if (errorText) {
          errorMessage = errorText;
        }
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

    return result as Response;
  } catch (error) {
    log('BACKEND ERROR', `Failed to make ${method} request to ${path}:`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to make ${method} request to ${path}`);
  }
}

/**
 * Create a login token
 * REST API endpoint: POST /telegram/login-tokens
 * Anonymous endpoint - no authentication required
 */
export async function createLoginTokenRest(): Promise<CreateLoginTokenResponse> {
  log('REQUEST', 'Creating login token via REST API');
  const response = await makeUnauthenticatedRequest<undefined, CreateLoginTokenResponse>(
    'POST',
    '/telegram/login-tokens',
  );
  log('RESPONSE', 'Login token created:', response);
  return response;
}

/**
 * Consume a verified login token and get JWT
 * REST API endpoint: POST /telegram/login-tokens/:token/consume
 * Anonymous endpoint - no authentication required
 */
export async function consumeLoginTokenRest(token: string): Promise<ConsumeLoginTokenResponse> {
  log('REQUEST', `Consuming login token via REST API: token=${token.substring(0, 8)}...`);
  const response = await makeUnauthenticatedRequest<undefined, ConsumeLoginTokenResponse>(
    'POST',
    `/telegram/login-tokens/${encodeURIComponent(token)}/consume`,
  );
  log('RESPONSE', 'Login token consumed, JWT received');
  return response;
}
