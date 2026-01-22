import { log } from '../logger';
import { makeRestRequest } from './restHelpers';

export interface CreateThreadResponse {
  id: string;
}

/**
 * Create a new thread for a Telegram user
 * REST API endpoint: POST /telegram/threads
 */
export async function createThreadRest(chatId?: string): Promise<CreateThreadResponse> {
  log('REQUEST', 'Creating new thread via REST API');
  const response = await makeRestRequest<{ chatId: string }, { id: string }>(
    'POST',
    '/telegram/threads',
    { chatId: chatId || '' },
  );
  log('RESPONSE', 'Thread created:', response);
  return {
    id: response.id,
  };
}
