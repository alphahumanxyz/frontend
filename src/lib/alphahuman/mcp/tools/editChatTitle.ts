/**
 * Edit Chat Title tool - Change chat/group/channel title
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'edit_chat_title',
  description: 'Change chat/group/channel title',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the chat',
      },
      title: {
        type: 'string',
        description: 'The new title',
      },
    },
    required: ['chat_id', 'title'],
  },
};

export async function editChatTitle(
  args: { chat_id: string | number; title: string },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const { title } = args;

    if (!title || typeof title !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: 'Title is required',
          },
        ],
        isError: true,
      };
    }

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

    await callApi('updateChatTitle', chat, title);

    return {
      content: [
        {
          type: 'text',
          text: `Chat title updated to "${title}".`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'edit_chat_title',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.GROUP,
    );
  }
}
