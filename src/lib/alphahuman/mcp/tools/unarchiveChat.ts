/**
 * Unarchive Chat tool - Unarchive a chat
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ALL_FOLDER_ID } from '../../../../config';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'unarchive_chat',
  description: 'Unarchive a chat',
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

export async function unarchiveChat(
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

    await callApi('toggleChatArchived', {
      chat,
      folderId: ALL_FOLDER_ID,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Chat ${chatId} unarchived.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'unarchive_chat',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CHAT,
    );
  }
}
