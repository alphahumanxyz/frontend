/**
 * Get Sticker Sets tool - Get all sticker sets
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';

export const tool: MCPTool = {
  name: 'get_sticker_sets',
  description: 'Get all sticker sets',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function getStickerSets(
  args: Record<string, never>,
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const result = await callApi('fetchStickerSets', {});

    if (!result || !result.sets) {
      return {
        content: [
          {
            type: 'text',
            text: 'No sticker sets found.',
          },
        ],
      };
    }

    const stickerSets = result.sets.map((set) => ({
      id: set.id,
      title: set.title,
      shortName: set.shortName,
      count: set.count,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stickerSets, undefined, 2),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_sticker_sets',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MEDIA,
    );
  }
}
