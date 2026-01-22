/**
 * Unmute Chat tool - Unmute notifications for a chat
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'unmute_chat',
  description: 'Unmute notifications for a chat',
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

export async function unmuteChat(
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

    // Unmute (set to 0 or current time)
    await callApi('updateChatNotifySettings', {
      chat,
      settings: {
        mutedUntil: 0,
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `Chat ${chatId} unmuted.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'unmute_chat',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CHAT,
    );
  }
}
