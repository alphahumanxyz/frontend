import { makeRestRequest } from './restHelpers';

export interface AlphahumanThread {
  id: string;
  title: string;
  isActive: boolean;
  messageCount: number;
  lastMessageAt: string; // ISO date-time string
  createdAt: string; // ISO date-time string
  chatId: string;
}

export interface GetThreadsResponse {
  threads: AlphahumanThread[];
  count: number;
}

/**
 * Get threads for a Telegram user
 * REST API endpoint: GET /telegram/threads
 */
export async function getThreadsRest(): Promise<GetThreadsResponse> {
  const response = await makeRestRequest<undefined, { threads: AlphahumanThread[]; count: number }>(
    'GET',
    '/telegram/threads',
  );
  return {
    threads: response.threads || [],
    count: response.count || 0,
  };
}
