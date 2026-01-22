/**
 * Invite To Group tool - Invite users to a group or channel
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById, getUserById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'invite_to_group',
  description: 'Invite users to a group or channel',
  inputSchema: {
    type: 'object',
    properties: {
      group_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the group/channel',
      },
      user_ids: {
        type: 'array',
        items: {
          type: ['string', 'number'],
        },
        description: 'Array of user IDs to invite',
      },
    },
    required: ['group_id', 'user_ids'],
  },
};

export async function inviteToGroup(
  args: { group_id: string | number; user_ids: (string | number)[] },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const groupId = validateId(args.group_id, 'group_id');
    const { user_ids } = args;

    const chat = getChatById(groupId);
    if (!chat) {
      return {
        content: [
          {
            type: 'text',
            text: `Group/channel with ID or username "${groupId}" not found.`,
          },
        ],
        isError: true,
      };
    }

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'At least one user ID is required',
          },
        ],
        isError: true,
      };
    }

    // Get user objects
    const users = [];
    for (const userId of user_ids) {
      const validatedId = validateId(userId, 'user_ids');
      const user = getUserById(validatedId);
      if (!user) {
        return {
          content: [
            {
              type: 'text',
              text: `User with ID ${validatedId} not found`,
            },
          ],
          isError: true,
        };
      }
      users.push(user);
    }

    const result = await callApi('addChatMembers', chat, users);

    if (result && result.length > 0) {
      const missingUsers = result.map((u: { id: string }) => u.id).join(', ');
      return {
        content: [
          {
            type: 'text',
            text: `Some users could not be invited: ${missingUsers}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Successfully invited ${users.length} user(s) to the group/channel.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'invite_to_group',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.GROUP,
    );
  }
}
