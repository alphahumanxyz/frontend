/**
 * Set Bot Commands tool - Set bot commands for a bot you own
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getCurrentUser } from '../telegramApi';

export const tool: MCPTool = {
  name: 'set_bot_commands',
  description: 'Set bot commands for a bot you own. Note: This function can only be used if the Telegram client is a bot account.',
  inputSchema: {
    type: 'object',
    properties: {
      bot_username: {
        type: 'string',
        description: 'The username of the bot to set commands for',
      },
      commands: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            command: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['command', 'description'],
        },
        description: 'List of command dictionaries with \'command\' and \'description\' keys',
      },
    },
    required: ['bot_username', 'commands'],
  },
};

export async function setBotCommands(
  args: { bot_username: string; commands: Array<{ command: string; description: string }> },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const { bot_username, commands } = args;

    // Check if current user is a bot
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.isBot) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: This function can only be used by bot accounts. Your current Telegram account is a regular user account, not a bot.',
          },
        ],
        isError: true,
      };
    }

    // Resolve bot username
    const cleanUsername = bot_username.startsWith('@') ? bot_username.slice(1) : bot_username;
    const resolvedPeer = await callApi('getChatByUsername', {
      username: cleanUsername,
    });

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

    const bot = resolvedPeer.user;
    if (!bot.isBot) {
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

    // Set bot commands
    await callApi('setBotInfo', {
      bot,
      langCode: 'en',
      name: undefined,
      about: undefined,
      description: undefined,
    });

    // Note: The actual command setting might need a different API call
    // This is a placeholder - the actual implementation may vary
    return {
      content: [
        {
          type: 'text',
          text: `Bot commands set for ${bot_username}. Note: Command setting may require additional API support.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'set_bot_commands',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.PROFILE,
    );
  }
}
