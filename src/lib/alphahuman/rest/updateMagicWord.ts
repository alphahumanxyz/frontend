import { log } from '../logger';
import { makeRestRequest } from './restHelpers';

export interface UpdateMagicWordRequest {
  magicWord: string;
}

export interface UpdateMagicWordResponse {
  deletedThreadsCount: number;
  deletedAgentMessagesCount: number;
  deletedTelegramMessagesCount: number;
}

/**
 * Update magic word for a Telegram user
 * REST API endpoint: PUT /telegram/magic-word
 */
export async function updateMagicWordRest(
  data: UpdateMagicWordRequest,
): Promise<UpdateMagicWordResponse> {
  log('REQUEST', 'Updating magic word via REST API');
  const response = await makeRestRequest<UpdateMagicWordRequest, UpdateMagicWordResponse>(
    'PUT',
    '/telegram/magic-word',
    data,
  );
  log('RESPONSE', 'Magic word updated:', response);
  return response;
}
