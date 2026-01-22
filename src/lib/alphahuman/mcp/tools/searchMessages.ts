/**
 * Search Messages tool - Search for messages in a chat by text
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { formatMessage, getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'search_messages',
  description: 'Search for messages in a chat by text',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The chat ID or username',
      },
      query: {
        type: 'string',
        description: 'Search query',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of messages to return',
        default: 20,
      },
    },
    required: ['chat_id', 'query'],
  },
};

export async function searchMessages(
  args: { chat_id: string | number; query: string; limit?: number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const { query, limit = 20 } = args;

    const chat = getChatById(chatId);
    if (!chat) {
      return {
        content: [
          {
            type: 'text',
            text: `Chat ${chatId} not found`,
          },
        ],
        isError: true,
      };
    }

    const result = await callApi('searchMessagesInChat', {
      peer: chat,
      query,
      limit,
      type: 'text',
    });

    if (!result || !result.messages) {
      return {
        content: [
          {
            type: 'text',
            text: 'No messages found',
          },
        ],
      };
    }

    const messages = result.messages.map(formatMessage);
    const lines = messages.map((msg) => {
      const replyInfo = msg.from_id ? ` | From: ${msg.from_id}` : '';
      return `ID: ${msg.id}${replyInfo} | Date: ${msg.date} | Message: ${msg.text}`;
    });

    return {
      content: [
        {
          type: 'text',
          text: lines.join('\n'),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'search_messages',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.SEARCH,
    );
  }
}
