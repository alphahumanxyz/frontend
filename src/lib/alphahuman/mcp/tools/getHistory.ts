/**
 * Get History tool - Get full chat history
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';
import { MAIN_THREAD_ID } from '../../../../api/types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { formatMessage, getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'get_history',
  description: 'Get full chat history',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the chat',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of messages to retrieve',
        default: 100,
      },
    },
    required: ['chat_id'],
  },
};

export async function getHistory(
  args: { chat_id: string | number; limit?: number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const { limit = 100 } = args;

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

    const result = await callApi('fetchMessages', {
      chat,
      limit,
      threadId: MAIN_THREAD_ID,
    });

    if (!result?.messages || result.messages.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No messages found in chat history.',
          },
        ],
      };
    }

    const contentItems = result.messages.map((msg: any) => {
      const formatted = formatMessage(msg);
      const senderName = msg.senderId ? String(msg.senderId) : 'Unknown';
      const replyInfoStr = msg.replyInfo?.type === 'message' && msg.replyInfo.replyToMsgId
        ? ` | reply to ${msg.replyInfo.replyToMsgId}`
        : '';
      const messageText = formatted.text || '[Media/No text]';
      const text =
        `ID: ${formatted.id} | ${senderName} | Date: ${formatted.date}${replyInfoStr} | Message: ${messageText}`;
      return {
        type: 'text' as const,
        text,
      };
    });

    return {
      content: contentItems,
    };
  } catch (error) {
    return logAndFormatError(
      'get_history',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MSG,
    );
  }
}
