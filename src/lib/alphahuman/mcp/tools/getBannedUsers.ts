/**
 * Get Banned Users tool - List all banned users in a chat
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'get_banned_users',
  description: 'List all banned users in a chat',
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

export async function getBannedUsers(
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

    // Only channels/supergroups support banned users
    if (chat.type !== 'chatTypeChannel' && chat.type !== 'chatTypeSuperGroup') {
      return {
        content: [
          {
            type: 'text',
            text: 'Banned users are only available for channels and supergroups.',
          },
        ],
        isError: true,
      };
    }

    const result = await callApi('fetchMembers', {
      chat,
      memberFilter: 'kicked',
    });

    if (!result?.members) {
      return {
        content: [
          {
            type: 'text',
            text: 'No banned users found or unable to fetch banned users.',
          },
        ],
      };
    }

    const lines = result.members.map((member: { userId: string; kickedByUserId?: string; bannedRights?: any }) => {
      const user = context.global.users.byId[member.userId];
      const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
      const kickedBy = member.kickedByUserId ? ` (kicked by ${member.kickedByUserId})` : '';
      return `ID: ${member.userId}, Name: ${name}${kickedBy}`;
    });

    return {
      content: [
        {
          type: 'text',
          text: lines.length > 0 ? lines.join('\n') : 'No banned users found.',
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_banned_users',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.ADMIN,
    );
  }
}
