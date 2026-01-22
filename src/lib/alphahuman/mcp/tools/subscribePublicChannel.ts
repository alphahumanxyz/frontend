/**
 * Subscribe Public Channel tool - Subscribe to a public channel or supergroup
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'subscribe_public_channel',
  description: 'Subscribe to a public channel or supergroup by username or ID',
  inputSchema: {
    type: 'object',
    properties: {
      channel: {
        type: ['string', 'number'],
        description: 'The username (e.g., @channel) or ID of the channel',
      },
    },
    required: ['channel'],
  },
};

export async function subscribePublicChannel(
  args: { channel: string | number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const channelId = validateId(args.channel, 'channel');

    // Try to get the channel first
    let chat = getChatById(channelId);

    // If not found, try to resolve username
    if (!chat && typeof channelId === 'string' && channelId.startsWith('@')) {
      // Search for the channel
      const searchResult = await callApi('searchChats', {
        query: channelId.substring(1),
      });

      if (searchResult && Array.isArray(searchResult)) {
        chat = searchResult.find((c: { usernames?: Array<{ username: string }> }) =>
          c.usernames?.some((u) => u.username === channelId.substring(1)),
        );
      }
    }

    if (!chat) {
      return {
        content: [
          {
            type: 'text',
            text: `Channel with ID or username "${channelId}" not found.`,
          },
        ],
        isError: true,
      };
    }

    // Join the channel
    if (chat.accessHash) {
      await callApi('joinChannel', {
        channelId: chat.id,
        accessHash: chat.accessHash,
      });
    } else {
      return {
        content: [
          {
            type: 'text',
            text: 'Unable to join channel. Access hash not available.',
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Successfully subscribed to channel "${chat.title || channelId}".`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'subscribe_public_channel',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.GROUP,
    );
  }
}
