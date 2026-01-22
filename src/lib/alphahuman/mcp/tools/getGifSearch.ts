/**
 * Get GIF Search tool - Search for GIFs by query
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';

export const tool: MCPTool = {
  name: 'get_gif_search',
  description: 'Search for GIFs by query. Returns a list of Telegram document IDs (not file paths).',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search term for GIFs',
      },
      limit: {
        type: 'number',
        description: 'Max number of GIFs to return',
        default: 10,
      },
    },
    required: ['query'],
  },
};

export async function getGifSearch(
  args: { query: string; limit?: number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const { query, limit = 10 } = args;

    const result = await callApi('searchGifs', {
      query,
      offset: '',
      username: 'gif',
    });

    if (!result || !result.gifs) {
      return {
        content: [
          {
            type: 'text',
            text: '[]',
          },
        ],
      };
    }

    const gifIds = result.gifs.slice(0, limit).map((gif) => gif.id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(gifIds, undefined, 2),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_gif_search',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MEDIA,
    );
  }
}
