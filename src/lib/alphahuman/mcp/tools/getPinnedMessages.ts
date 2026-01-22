/**
 * Get Pinned Messages tool - List pinned messages in a chat
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { formatMessage, getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'get_pinned_messages',
  description: 'List pinned messages in a chat',
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

export async function getPinnedMessages(
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

    // Get messages and filter for pinned ones
    const result = await callApi('fetchMessages', {
      chat,
      limit: 100,
    });

    if (!result?.messages) {
      return {
        content: [
          {
            type: 'text',
            text: 'No messages found or unable to fetch messages.',
          },
        ],
      };
    }

    const pinnedMessages = result.messages.filter((msg: { isPinned?: boolean }) => msg.isPinned);

    if (pinnedMessages.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No pinned messages found in this chat.',
          },
        ],
      };
    }

    const lines = pinnedMessages.map((msg: any) => {
      const formatted = formatMessage(msg);
      const senderName = msg.senderId ? String(msg.senderId) : 'Unknown';
      return `ID: ${formatted.id} | ${senderName} | Date: ${formatted.date} | Message: ${formatted.text || '[Media/No text]'}`;
    });

    return {
      content: [
        {
          type: 'text',
          text: lines.join('\n'),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_pinned_messages',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MSG,
    );
  }
}
