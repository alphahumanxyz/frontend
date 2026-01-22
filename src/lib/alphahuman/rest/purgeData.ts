import { log } from '../logger';
import { makeRestRequest } from './restHelpers';

export interface PurgeDataRequest {
  messages: boolean;
  agentThreads: boolean;
  deleteEverything: boolean;
  deleteFrom?: string; // ISO date-time string
  deleteTo?: string; // ISO date-time string
}

export interface PurgeDataResponse {
  messagesDeleted: number;
  agentThreadsDeleted: number;
  agentMessagesDeleted: number;
}

/**
 * Purge data for a Telegram user
 * REST API endpoint: POST /telegram/purge
 */
export async function purgeDataRest(
  data: PurgeDataRequest,
): Promise<PurgeDataResponse> {
  log('REQUEST', 'Purging data via REST API');
  const response = await makeRestRequest<PurgeDataRequest, PurgeDataResponse>(
    'POST',
    '/telegram/purge',
    data,
  );
  log('RESPONSE', 'Data purged:', response);
  return response;
}
