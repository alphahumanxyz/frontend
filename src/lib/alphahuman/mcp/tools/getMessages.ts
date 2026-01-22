/**
 * Get Messages tool - Get paginated messages from a specific chat
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { formatMessage, getChatById, getMessages as getMessagesApi } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'get_messages',
  description: 'Get paginated messages from a specific chat',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the chat',
      },
      page: {
        type: 'number',
        description: 'Page number (1-indexed)',
        default: 1,
      },
      page_size: {
        type: 'number',
        description: 'Number of messages per page',
        default: 20,
      },
    },
    required: ['chat_id'],
  },
};

export async function getMessages(
  args: { chat_id: string | number; page?: number; page_size?: number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const page = args.page || 1;
    const pageSize = args.page_size || 20;
    const offset = (page - 1) * pageSize;

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

    const messages = await getMessagesApi(chatId, pageSize, offset);
    if (!messages || messages.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No messages found for this page.',
          },
        ],
      };
    }

    const lines = messages.map((msg) => {
      const formatted = formatMessage(msg);
      const senderName = msg.senderId ? String(msg.senderId) : 'Unknown';
      const replyInfoStr = msg.replyInfo?.type === 'message' && msg.replyInfo.replyToMsgId
        ? ` | reply to ${msg.replyInfo.replyToMsgId}`
        : '';
      const engagementInfo = ''; // TODO: Add views, forwards, reactions

      const msgText = formatted.text || '[Media/No text]';
      const dateStr = formatted.date;
      const line =
        `ID: ${formatted.id} | ${senderName} | Date: ${dateStr}${replyInfoStr}${engagementInfo} | Message: ${msgText}`;
      return line;
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
    const err = error instanceof Error ? error : new Error(String(error));
    return logAndFormatError('get_messages', err, ErrorCategory.MSG);
  }
}
