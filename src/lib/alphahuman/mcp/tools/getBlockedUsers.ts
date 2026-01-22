/**
 * Get Blocked Users tool - Get a list of blocked users
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { selectUser } from '../../../../global/selectors';
import { ErrorCategory, logAndFormatError } from '../errorHandler';

export const tool: MCPTool = {
  name: 'get_blocked_users',
  description: 'Get a list of blocked users',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function getBlockedUsers(
  args: Record<string, never>,
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const result = await callApi('fetchBlockedUsers', {});

    if (!result?.blockedIds || result.blockedIds.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No blocked users found.',
          },
        ],
      };
    }

    // Get user details from global state
    const users = result.blockedIds
      .map((userId: string) => selectUser(context.global, userId))
      .filter((user): user is NonNullable<typeof user> => user !== undefined);

    if (users.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No blocked users found.',
          },
        ],
      };
    }

    const lines = users.map((user) => {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
      const username = user.usernames?.[0]?.username ? ` (@${user.usernames[0].username})` : '';
      return `ID: ${user.id}, Name: ${name}${username}`;
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
      'get_blocked_users',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CONTACT,
    );
  }
}
