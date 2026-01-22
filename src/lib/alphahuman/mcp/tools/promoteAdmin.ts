/**
 * Promote Admin tool - Promote a user to admin
 */

import type { ApiChatAdminRights } from '../../../../api/types';
import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById, getUserById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'promote_admin',
  description: 'Promote a user to admin in a chat',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the chat',
      },
      user_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the user to promote',
      },
    },
    required: ['chat_id', 'user_id'],
  },
};

export async function promoteAdmin(
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

    // Basic admin rights - can be customized
    const adminRights: ApiChatAdminRights = {
      changeInfo: true,
      postMessages: true,
      editMessages: true,
      deleteMessages: true,
      banUsers: true,
      inviteUsers: true,
      pinMessages: true,
      // addAdmins: false, // Don't allow adding admins by default
    };

    await callApi('updateChatAdmin', {
      chat,
      user,
      adminRights,
    });

    return {
      content: [
        {
          type: 'text',
          text: `User ${userId} promoted to admin in chat ${chatId}.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'promote_admin',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.ADMIN,
    );
  }
}
