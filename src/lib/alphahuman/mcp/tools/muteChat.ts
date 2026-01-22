/**
 * Mute Chat tool - Mute notifications for a chat
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'mute_chat',
  description: 'Mute notifications for a chat',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The chat ID or username',
      },
    },
    required: ['chat_id'],
  },
};

export async function muteChat(
  args: { chat_id: string | number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');

    const chat = getChatById(chatId);
    if (!chat) {
      return {
        content: [
          {
            type: 'text',
            text: `Chat ${chatId} not found`,
          },
        ],
        isError: true,
      };
    }

    // Mute indefinitely (far future timestamp)
    await callApi('updateChatNotifySettings', {
      chat,
      settings: {
        mutedUntil: 2147483647, // Max 32-bit integer (year 2038)
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `Chat ${chatId} muted.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'mute_chat',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CHAT,
    );
  }
}
