/**
 * Leave Chat tool - Leave a group or channel
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'leave_chat',
  description: 'Leave a group or channel',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the chat to leave',
      },
    },
    required: ['chat_id'],
  },
};

export async function leaveChat(
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

    // Check if it's a channel or group
    if (chat.type === 'chatTypeChannel' || chat.type === 'chatTypeSuperGroup') {
      if (!chat.accessHash) {
        return {
          content: [
            {
              type: 'text',
              text: 'Cannot leave channel: access hash not available.',
            },
          ],
          isError: true,
        };
      }
      await callApi('deleteChannel', {
        channelId: chat.id,
        accessHash: chat.accessHash,
      });
    } else {
      await callApi('deleteChat', {
        chatId: chat.id,
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: `Left chat "${chat.title || chatId}" successfully.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'leave_chat',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.GROUP,
    );
  }
}
