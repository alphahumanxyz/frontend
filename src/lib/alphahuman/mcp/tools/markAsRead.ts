/**
 * Mark As Read tool - Mark all messages as read in a chat
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'mark_as_read',
  description: 'Mark all messages as read in a chat',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the chat',
      },
    },
    required: ['chat_id'],
  },
};

export async function markAsRead(
  args: { chat_id: string | number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');

    const chat = getChatById(chatId);
    if (!chat) {
      return {
        content: [
          {
            type: 'text',
            text: `Chat with ID or username "${chatId}" not found.`,
          },
        ],
        isError: true,
      };
    }

    await callApi('markMessageListRead', {
      chat,
      threadId: 0, // Main thread
      maxId: 0, // Mark all as read
    });

    return {
      content: [
        {
          type: 'text',
          text: `All messages marked as read in chat ${chatId}.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'mark_as_read',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MSG,
    );
  }
}
