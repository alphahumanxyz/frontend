/**
 * Get Bot Info tool - Get information about a bot by username
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';

export const tool: MCPTool = {
  name: 'get_bot_info',
  description: 'Get information about a bot by username',
  inputSchema: {
    type: 'object',
    properties: {
      bot_username: {
        type: 'string',
        description: 'The username of the bot (without @)',
      },
    },
    required: ['bot_username'],
  },
};

export async function getBotInfo(
  args: { bot_username: string },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const { bot_username } = args;
    const cleanUsername = bot_username.startsWith('@') ? bot_username.slice(1) : bot_username;

    // First resolve the username to get the user
    const resolvedPeer = await callApi('getChatByUsername', cleanUsername);

    if (!resolvedPeer || !resolvedPeer.user) {
      return {
        content: [
          {
            type: 'text',
            text: `Bot with username ${bot_username} not found.`,
          },
        ],
        isError: true,
      };
    }

    const user = resolvedPeer.user;
    if (user.type !== 'userTypeBot') {
      return {
        content: [
          {
            type: 'text',
            text: `User ${bot_username} is not a bot.`,
          },
        ],
        isError: true,
      };
    }

    // Fetch full user info to get bot info
    const fullUser = await callApi('fetchFullUser', {
      id: user.id,
      accessHash: user.accessHash,
    });

    const botInfo: Record<string, any> = {
      id: user.id,
      username: user.usernames?.[0]?.username,
      firstName: user.firstName,
      lastName: user.lastName,
      isBot: true,
      isVerified: user.isVerified,
    };

    if (fullUser?.fullInfo) {
      if (fullUser.fullInfo.botInfo) {
        botInfo.description = fullUser.fullInfo.botInfo.description;
        botInfo.commands = fullUser.fullInfo.botInfo.commands;
      }
      if (fullUser.fullInfo.bio) botInfo.bio = fullUser.fullInfo.bio;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ bot_info: botInfo }, undefined, 2),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_bot_info',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.PROFILE,
    );
  }
}
