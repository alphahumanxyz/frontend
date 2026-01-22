/**
 * Delete Message tool - Delete a message by ID
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'delete_message',
  description: 'Delete a message by ID',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the chat',
      },
      message_id: {
        type: 'number',
        description: 'The message ID to delete',
      },
    },
    required: ['chat_id', 'message_id'],
  },
};

export async function deleteMessage(
  args: { chat_id: string | number; message_id: number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const { message_id } = args;

    const chat = getChatById(chatId);
    if (!chat) {
      return {
        content: [
          {
            type: 'text',
            text: `Chat not found: ${chatId}`,
          },
        ],
        isError: true,
      };
    }

    await callApi('deleteMessages', {
      chat,
      messageIds: [message_id],
    });

    return {
      content: [
        {
          type: 'text',
          text: `Message ${message_id} deleted.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'delete_message',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MSG,
    );
  }
}
