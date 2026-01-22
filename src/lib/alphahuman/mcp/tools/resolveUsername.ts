/**
 * Resolve Username tool - Resolve a username to a user or chat ID
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { formatEntity } from '../telegramApi';

export const tool: MCPTool = {
  name: 'resolve_username',
  description: 'Resolve a username to a user or chat ID',
  inputSchema: {
    type: 'object',
    properties: {
      username: {
        type: 'string',
        description: 'Username to resolve (without @)',
      },
    },
    required: ['username'],
  },
};

export async function resolveUsername(
  args: { username: string },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const { username } = args;
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

    const result = await callApi('getChatByUsername', {
      username: cleanUsername,
    });

    if (!result || !result.chat) {
      return {
        content: [
          {
            type: 'text',
            text: `Username ${username} not found`,
          },
        ],
        isError: true,
      };
    }

    const entity = formatEntity(result.chat);
    const userEntity = result.user ? formatEntity(result.user) : undefined;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            chat: entity,
            ...(userEntity && { user: userEntity }),
          }, undefined, 2),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'resolve_username',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.SEARCH,
    );
  }
}
