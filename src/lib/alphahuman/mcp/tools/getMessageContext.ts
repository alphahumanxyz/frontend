/**
 * Get Message Context tool - Retrieve context around a specific message
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { formatMessage, getChatById, getMessages as getMessagesApi } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'get_message_context',
  description: 'Retrieve context around a specific message',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the chat',
      },
      message_id: {
        type: 'number',
        description: 'The ID of the central message',
      },
      context_size: {
        type: 'number',
        description: 'Number of messages before and after to include',
        default: 3,
      },
    },
    required: ['chat_id', 'message_id'],
  },
};

export async function getMessageContext(
  args: {
    chat_id: string | number;
    message_id: number;
    context_size?: number;
  },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const { message_id, context_size = 3 } = args;

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

    // Get central message
    const centralResult = await callApi('fetchMessage', {
      chat,
      messageId: message_id,
    });

    if (!centralResult || centralResult === 'MESSAGE_DELETED' || !('message' in centralResult)) {
      return {
        content: [
          {
            type: 'text',
            text: `Message with ID ${message_id} not found in chat ${chatId}.`,
          },
        ],
        isError: true,
      };
    }

    // Get messages before and after
    const allMessages = await getMessagesApi(chatId, context_size * 2 + 1, message_id);

    if (!allMessages) {
      return {
        content: [
          {
            type: 'text',
            text: `Could not retrieve messages around ${message_id}`,
          },
        ],
        isError: true,
      };
    }

    // Find the central message and get context
    const centralIndex = allMessages.findIndex((msg) => msg.id === message_id);
    if (centralIndex === -1) {
      return {
        content: [
          {
            type: 'text',
            text: `Message ${message_id} not found in retrieved messages`,
          },
        ],
        isError: true,
      };
    }

    const startIndex = Math.max(0, centralIndex - context_size);
    const endIndex = Math.min(allMessages.length, centralIndex + context_size + 1);
    const contextMessages = allMessages.slice(startIndex, endIndex);

    const results = [`Context for message ${message_id} in chat ${chatId}:`];
    for (const msg of contextMessages) {
      const formatted = formatMessage(msg);
      const senderName = msg.senderId ? String(msg.senderId) : 'Unknown';
      const highlight = msg.id === message_id ? ' [THIS MESSAGE]' : '';
      const replyInfoStr = msg.replyInfo?.type === 'message' && msg.replyInfo.replyToMsgId
        ? ` | reply to ${msg.replyInfo.replyToMsgId}`
        : '';

      results.push(
        `ID: ${formatted.id} | ${senderName} | ${formatted.date}${highlight}${replyInfoStr}\n${formatted.text}\n`,
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: results.join('\n'),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_message_context',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MSG,
    );
  }
}
