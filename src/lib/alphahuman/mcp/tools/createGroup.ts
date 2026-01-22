/**
 * Create Group tool - Create a new group chat
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getUserById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'create_group',
  description: 'Create a new group chat',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The title of the group',
      },
      user_ids: {
        type: 'array',
        items: {
          type: ['string', 'number'],
        },
        description: 'Array of user IDs to add to the group',
      },
    },
    required: ['title', 'user_ids'],
  },
};

export async function createGroup(
  args: { title: string; user_ids: (string | number)[] },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const { title, user_ids } = args;

    if (!title || typeof title !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: 'Group title is required',
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

    const result = await callApi('createGroupChat', {
      title,
      users,
    });

    if (!result?.chat) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to create group',
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Group "${title}" created successfully with ID: ${result.chat.id}`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'create_group',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.GROUP,
    );
  }
}
