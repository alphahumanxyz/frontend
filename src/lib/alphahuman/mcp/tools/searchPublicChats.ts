/**
 * Search Public Chats tool - Search for public chats, channels, or bots
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { formatEntity, searchChats } from '../telegramApi';

export const tool: MCPTool = {
  name: 'search_public_chats',
  description: 'Search for public chats, channels, or bots by username or title',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
    },
    required: ['query'],
  },
};

export async function searchPublicChats(
  args: { query: string },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const { query } = args;

    const chats = await searchChats(query);
    const results = chats.map(formatEntity);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, undefined, 2),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'search_public_chats',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.SEARCH,
    );
  }
}
