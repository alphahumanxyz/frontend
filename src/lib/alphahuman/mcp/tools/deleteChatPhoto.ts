/**
 * Delete Chat Photo tool - Remove chat/group/channel photo
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'delete_chat_photo',
  description: 'Remove chat/group/channel photo',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the chat',
      },
    },
    required: ['chat_id'],
  },
};

export async function deleteChatPhoto(
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
            text: `Chat with ID or username "${chatId}" not found.`,
          },
        ],
        isError: true,
      };
    }

    await callApi('editChatPhoto', {
      chatId: chat.id,
      accessHash: chat.accessHash,
      photo: undefined,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Chat photo deleted successfully.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'delete_chat_photo',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.GROUP,
    );
  }
}
