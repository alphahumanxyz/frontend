/**
 * Unblock User tool - Unblock a user by user ID
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getUserById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'unblock_user',
  description: 'Unblock a user by user ID',
  inputSchema: {
    type: 'object',
    properties: {
      user_id: {
        type: ['string', 'number'],
        description: 'The Telegram user ID or username to unblock',
      },
    },
    required: ['user_id'],
  },
};

export async function unblockUser(
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

    await callApi('unblockUser', {
      user,
    });

    return {
      content: [
        {
          type: 'text',
          text: `User ${userId} unblocked.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'unblock_user',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CONTACT,
    );
  }
}
