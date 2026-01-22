/**
 * Unban User tool - Unban a user from a chat
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById, getUserById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'unban_user',
  description: 'Unban a user from a chat',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the chat',
      },
      user_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the user to unban',
      },
    },
    required: ['chat_id', 'user_id'],
  },
};

export async function unbanUser(
  args: { chat_id: string | number; user_id: string | number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const userId = validateId(args.user_id, 'user_id');

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

    const user = getUserById(userId);
    if (!user) {
      return {
        content: [
          {
            type: 'text',
            text: `User with ID or username "${userId}" not found.`,
          },
        ],
        isError: true,
      };
    }

    // Remove all banned rights
    const bannedRights = {};

    await callApi('updateChatMemberBannedRights', {
      chat,
      user,
      bannedRights,
    });

    return {
      content: [
        {
          type: 'text',
          text: `User ${userId} unbanned from chat ${chatId}.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'unban_user',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.ADMIN,
    );
  }
}
