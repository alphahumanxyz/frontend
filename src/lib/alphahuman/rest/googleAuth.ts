import { makeRestRequest } from './restHelpers';

export interface GoogleOAuthResponse {
  success: boolean;
  oauthUrl: string;
  state: string;
}

/**
 * Initiate Google OAuth 2.0 flow
 * @returns Promise that resolves with OAuth URL and state token
 */
export async function connectGoogleRest(): Promise<GoogleOAuthResponse> {
  return makeRestRequest<void, GoogleOAuthResponse>('GET', '/api/auth/google/connect');
}