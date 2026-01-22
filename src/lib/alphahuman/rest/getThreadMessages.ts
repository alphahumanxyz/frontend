import type { AlphahumanThreadMessage } from '../types';

import { log } from '../logger';
import { makeRestRequest } from './restHelpers';

export interface GetThreadMessagesResponse {
  messages: AlphahumanThreadMessage[];
  count: number;
}

/**
 * Get messages for a specific thread
 * REST API endpoint: GET /telegram/threads/{threadId}/messages
 */
export async function getThreadMessagesRest(
  threadId: string,
): Promise<GetThreadMessagesResponse> {
  log('REQUEST', `Getting thread messages via REST API: threadId=${threadId}`);
  const response = await makeRestRequest<undefined, { messages: AlphahumanThreadMessage[]; count: number }>(
    'GET',
    `/telegram/threads/${encodeURIComponent(threadId)}/messages`,
  );
  log('RESPONSE', 'Thread messages:', response);
  return {
    messages: response.messages || [],
    count: response.count || 0,
  };
}
