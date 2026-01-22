import { log } from '../logger';
import { makeRestRequest } from './restHelpers';

export interface GetMeResponse {
  autoDeleteTelegramMessagesAfterDays: number;
  autoDeleteThreadsAfterDays: number;
  hasAccess: boolean;
  magicWord: string;
  telegramId: number;
}

/**
 * Get the current authenticated Telegram user details
 * REST API endpoint: GET /telegram/me
 */
export async function getMeRest(): Promise<GetMeResponse> {
  log('REQUEST', 'Getting user details via REST API');
  const response = await makeRestRequest<undefined, GetMeResponse>('GET', '/telegram/me');
  log('RESPONSE', 'User data:', response);
  return response;
}
