/**
 * Get Participants tool - List all participants in a chat
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'get_participants',
  description: 'List all participants in a chat',
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

export async function getParticipants(
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

    // For channels/supergroups, use fetchMembers
    if (chat.type === 'chatTypeChannel' || chat.type === 'chatTypeSuperGroup') {
      const result = await callApi('fetchMembers', {
        chat,
        memberFilter: 'recent',
      });

      if (!result?.members) {
        return {
          content: [
            {
              type: 'text',
              text: 'No participants found or unable to fetch participants.',
            },
          ],
        };
      }

      const lines = result.members.map((member: { userId: string; isAdmin?: boolean; isOwner?: boolean }) => {
        const user = context.global.users.byId[member.userId];
        const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
        const role = member.isOwner ? 'Owner' : member.isAdmin ? 'Admin' : 'Member';
        return `ID: ${member.userId}, Name: ${name}, Role: ${role}`;
      });

      return {
        content: [
          {
            type: 'text',
            text: lines.length > 0 ? lines.join('\n') : 'No participants found.',
          },
        ],
      };
    }

    // For basic groups, we need to get full chat info
    const fullInfo = await callApi('fetchFullChat', chat);
    if (!fullInfo?.fullInfo?.members) {
      return {
        content: [
          {
            type: 'text',
            text: 'No participants found or unable to fetch participants.',
          },
        ],
      };
    }

    const lines = fullInfo.fullInfo.members.map((member: { userId: string; isAdmin?: boolean; isOwner?: boolean }) => {
      const user = context.global.users.byId[member.userId];
      const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
      const role = member.isOwner ? 'Owner' : member.isAdmin ? 'Admin' : 'Member';
      return `ID: ${member.userId}, Name: ${name}, Role: ${role}`;
    });

    return {
      content: [
        {
          type: 'text',
          text: lines.length > 0 ? lines.join('\n') : 'No participants found.',
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_participants',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.GROUP,
    );
  }
}
