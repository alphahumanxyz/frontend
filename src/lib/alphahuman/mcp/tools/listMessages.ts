/**
 * List Messages tool - Retrieve messages with optional filters
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { formatMessage, getChatById, getMessages as getMessagesApi } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'list_messages',
  description: 'Retrieve messages with optional filters',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the chat to get messages from',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of messages to retrieve',
        default: 20,
      },
      search_query: {
        type: 'string',
        description: 'Filter messages containing this text',
      },
      from_date: {
        type: 'string',
        description: 'Filter messages starting from this date (format: YYYY-MM-DD)',
      },
      to_date: {
        type: 'string',
        description: 'Filter messages until this date (format: YYYY-MM-DD)',
      },
    },
    required: ['chat_id'],
  },
};

export async function listMessages(
  args: {
    chat_id: string | number;
    limit?: number;
    search_query?: string;
    from_date?: string;
    to_date?: string;
  },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const limit = args.limit || 20;

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

    // For now, we'll get messages and filter client-side
    // In a full implementation, we'd use search parameter in fetchMessages
    const messages = await getMessagesApi(chatId, limit * 2); // Get more to filter

    if (!messages || messages.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No messages found matching the criteria.',
          },
        ],
      };
    }

    // Apply filters
    let filteredMessages = messages;

    if (args.search_query) {
      const query = args.search_query.toLowerCase();
      filteredMessages = filteredMessages.filter((msg) => {
        if (msg.content && 'text' in msg.content) {
          return msg.content.text?.text?.toLowerCase().includes(query);
        }
        return false;
      });
    }

    if (args.from_date || args.to_date) {
      filteredMessages = filteredMessages.filter((msg) => {
        const msgDate = new Date(msg.date * 1000);
        if (args.from_date) {
          const fromDate = new Date(args.from_date);
          if (msgDate < fromDate) return false;
        }
        if (args.to_date) {
          const toDate = new Date(args.to_date);
          toDate.setHours(23, 59, 59, 999); // End of day
          if (msgDate > toDate) return false;
        }
        return true;
      });
    }

    // Limit results
    filteredMessages = filteredMessages.slice(0, limit);

    const contentItems = filteredMessages.map((msg) => {
      const formatted = formatMessage(msg);
      const senderName = msg.senderId ? String(msg.senderId) : 'Unknown';
      const replyInfoStr = msg.replyInfo?.type === 'message' && msg.replyInfo.replyToMsgId
        ? ` | reply to ${msg.replyInfo.replyToMsgId}`
        : '';
      const engagementInfo = ''; // TODO: Add views, forwards, reactions

      const msgText = formatted.text || '[Media/No text]';
      const dateStr = formatted.date;
      const text =
        `ID: ${formatted.id} | ${senderName} | Date: ${dateStr}${replyInfoStr}${engagementInfo} | Message: ${msgText}`;
      return {
        type: 'text' as const,
        text,
      };
    });

    return {
      content: contentItems,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return logAndFormatError('list_messages', err, ErrorCategory.MSG);
  }
}
