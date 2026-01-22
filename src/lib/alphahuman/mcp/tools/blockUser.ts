/**
 * Block User tool - Block a user by user ID
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getUserById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'block_user',
  description: 'Block a user by user ID',
  inputSchema: {
    type: 'object',
    properties: {
      user_id: {
        type: ['string', 'number'],
        description: 'The Telegram user ID or username to block',
      },
    },
    required: ['user_id'],
  },
};

export async function blockUser(
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

    await callApi('blockUser', {
      user,
    });

    return {
      content: [
        {
          type: 'text',
          text: `User ${userId} blocked.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'block_user',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CONTACT,
    );
  }
}
