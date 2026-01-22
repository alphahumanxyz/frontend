import { log } from '../logger';
import { makeRestRequest } from './restHelpers';

export type HighlightsTimeframe = 'daily' | 'weekly';

export interface HighlightPeriod {
  start: string; // ISO date string
  end: string; // ISO date string
}

export interface Highlight {
  chatHash: string;
  chatType: string;
  timeframe: HighlightsTimeframe;
  summaryText: string;
  highlights: string[];
  period: HighlightPeriod;
  generatedAt: string; // ISO date-time string
}

export type GetHighlightsResponse = Highlight[];

/**
 * Get precomputed highlights for user's Telegram chats
 * REST API endpoint: GET /telegram/highlights?timeframe=daily|weekly
 */
export async function getHighlightsRest(
  timeframe: HighlightsTimeframe,
): Promise<GetHighlightsResponse> {
  log('REQUEST', `Getting highlights via REST API: timeframe=${timeframe}`);
  const response = await makeRestRequest<undefined, Highlight[]>(
    'GET',
    '/telegram/highlights',
    undefined,
    { timeframe },
  );
  log('RESPONSE', 'Highlights:', response);
  return response || [];
}
