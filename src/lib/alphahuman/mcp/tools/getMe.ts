/**
 * Get Me tool - Get your own user information
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { formatEntity, getCurrentUser } from '../telegramApi';

export const tool: MCPTool = {
  name: 'get_me',
  description: 'Get your own user information',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function getMe(
  args: Record<string, never>,
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  await Promise.resolve(); // Ensure async
  try {
    const user = getCurrentUser();
    if (!user) {
      return {
        content: [
          {
            type: 'text',
            text: 'User information not available',
          },
        ],
        isError: true,
      };
    }

    const entity = formatEntity(user);
    const result = {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      ...(entity.username && { username: entity.username }),
      ...(entity.phone && { phone: entity.phone }),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, undefined, 2),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_me',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.PROFILE,
    );
  }
}
