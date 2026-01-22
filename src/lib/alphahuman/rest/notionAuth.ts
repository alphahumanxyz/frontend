import { makeRestRequest } from './restHelpers';

export interface NotionOAuthResponse {
  success: boolean;
  oauthUrl: string;
  state: string;
}

/**
 * Initiate Notion OAuth 2.0 flow
 * @returns Promise that resolves with OAuth URL and state token
 */
export async function connectNotionRest(): Promise<NotionOAuthResponse> {
  return makeRestRequest<void, NotionOAuthResponse>('GET', '/auth/notion/connect');
}
