/**
 * Archive Chat tool - Archive a chat
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ARCHIVED_FOLDER_ID } from '../../../../config';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'archive_chat',
  description: 'Archive a chat',
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

export async function archiveChat(
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
      folderId: ARCHIVED_FOLDER_ID,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Chat ${chatId} archived.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'archive_chat',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CHAT,
    );
  }
}
