/**
 * Edit Message tool - Edit a message you sent
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'edit_message',
  description: 'Edit a message you sent',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the chat',
      },
      message_id: {
        type: 'number',
        description: 'The message ID to edit',
      },
      new_text: {
        type: 'string',
        description: 'The new message text',
      },
    },
    required: ['chat_id', 'message_id', 'new_text'],
  },
};

export async function editMessage(
  args: { chat_id: string | number; message_id: number; new_text: string },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const { message_id, new_text } = args;

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

    // Get the message first
    const messageResult = await callApi('fetchMessage', {
      chat,
      messageId: message_id,
    });

    if (!messageResult || messageResult === 'MESSAGE_DELETED' || !('message' in messageResult)) {
      return {
        content: [
          {
            type: 'text',
            text: `Message ${message_id} not found in chat ${chatId}`,
          },
        ],
        isError: true,
      };
    }

    await callApi('editMessage', {
      chat,
      message: messageResult.message,
      text: new_text,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Message ${message_id} edited.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'edit_message',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MSG,
    );
  }
}
