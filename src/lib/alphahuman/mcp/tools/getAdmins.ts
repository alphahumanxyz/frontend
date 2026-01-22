/**
 * Get Admins tool - List all admins in a chat
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'get_admins',
  description: 'List all admins in a chat',
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

export async function getAdmins(
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

    // For channels/supergroups, use fetchMembers with admin filter
    if (chat.type === 'chatTypeChannel' || chat.type === 'chatTypeSuperGroup') {
      const result = await callApi('fetchMembers', {
        chat,
        memberFilter: 'admin',
      });

      if (!result?.members) {
        return {
          content: [
            {
              type: 'text',
              text: 'No admins found or unable to fetch admins.',
            },
          ],
        };
      }

      const lines = result.members.map((member: { userId: string; isOwner?: boolean; customTitle?: string }) => {
        const user = context.global.users.byId[member.userId];
        const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
        const role = member.isOwner ? 'Owner' : 'Admin';
        const title = member.customTitle ? ` (${member.customTitle})` : '';
        return `ID: ${member.userId}, Name: ${name}, Role: ${role}${title}`;
      });

      return {
        content: [
          {
            type: 'text',
            text: lines.length > 0 ? lines.join('\n') : 'No admins found.',
          },
        ],
      };
    }

    // For basic groups, get full chat info and filter admins
    const fullInfo = await callApi('fetchFullChat', chat);
    if (!fullInfo?.fullInfo?.members) {
      return {
        content: [
          {
            type: 'text',
            text: 'No admins found or unable to fetch admins.',
          },
        ],
      };
    }

    const adminMembers = fullInfo.fullInfo.members.filter(
      (member: { isAdmin?: boolean; isOwner?: boolean }) => member.isAdmin || member.isOwner,
    );

    const lines = adminMembers.map((member: { userId: string; isOwner?: boolean }) => {
      const user = context.global.users.byId[member.userId];
      const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
      const role = member.isOwner ? 'Owner' : 'Admin';
      return `ID: ${member.userId}, Name: ${name}, Role: ${role}`;
    });

    return {
      content: [
        {
          type: 'text',
          text: lines.length > 0 ? lines.join('\n') : 'No admins found.',
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_admins',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.ADMIN,
    );
  }
}
