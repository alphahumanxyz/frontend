/**
 * Get User Status tool - Get a user's online status
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getUserById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'get_user_status',
  description: 'Get a user\'s online status',
  inputSchema: {
    type: 'object',
    properties: {
      user_id: {
        type: ['string', 'number'],
        description: 'The user ID or username',
      },
    },
    required: ['user_id'],
  },
};

export async function getUserStatus(
  args: { user_id: string | number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const userId = validateId(args.user_id, 'user_id');

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

    // Get full user info to access status
    const fullInfo = await callApi('fetchFullUser', {
      id: user.id,
      accessHash: user.accessHash,
    });

    if (!fullInfo?.fullInfo) {
      return {
        content: [
          {
            type: 'text',
            text: 'Unable to fetch user status.',
          },
        ],
        isError: true,
      };
    }

    const status = fullInfo.fullInfo.status;
    let statusText = 'Unknown';

    if (!status) {
      statusText = 'No status available';
    } else if (status.type === 'userStatusOnline') {
      statusText = 'Online';
    } else if (status.type === 'userStatusOffline') {
      const wasOnline = status.wasOnline ? new Date(status.wasOnline * 1000).toISOString() : 'Unknown';
      statusText = `Last seen: ${wasOnline}`;
    } else if (status.type === 'userStatusRecently') {
      statusText = 'Recently online';
    } else if (status.type === 'userStatusLastWeek') {
      statusText = 'Last seen within a week';
    } else if (status.type === 'userStatusLastMonth') {
      statusText = 'Last seen within a month';
    } else if (status.type === 'userStatusLongTimeAgo') {
      statusText = 'Last seen a long time ago';
    }

    return {
      content: [
        {
          type: 'text',
          text: `User ${userId} status: ${statusText}`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_user_status',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.PROFILE,
    );
  }
}
