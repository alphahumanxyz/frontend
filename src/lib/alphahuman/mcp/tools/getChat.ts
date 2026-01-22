/**
 * Get Chat tool - Get detailed information about a specific chat
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { formatEntity, getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'get_chat',
  description: 'Get detailed information about a specific chat',
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

export async function getChat(
  args: { chat_id: string | number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  await Promise.resolve(); // Ensure async
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
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

    const entity = formatEntity(chat);
    const result: string[] = [];

    result.push(`ID: ${entity.id}`);
    result.push(`Title: ${entity.name}`);
    result.push(`Type: ${entity.type}`);

    if (entity.username) {
      result.push(`Username: @${entity.username}`);
    }

    if ('membersCount' in chat && chat.membersCount) {
      result.push(`Participants: ${chat.membersCount}`);
    }

    if ('unreadCount' in chat) {
      result.push(`Unread Messages: ${chat.unreadCount || 0}`);
    }

    // Get last message if available
    const lastMessageId = context.global.chats.lastMessageIds?.all?.[chat.id];
    if (lastMessageId) {
      const lastMessage = context.global.messages.byChatId[chat.id]?.byId[lastMessageId];
      if (lastMessage && lastMessage.content.text) {
        const senderName = lastMessage.senderId ? String(lastMessage.senderId) : 'Unknown';
        const messageText = lastMessage.content.text.text || '[Media/No text]';
        result.push(`Last Message: From ${senderName} at ${new Date(lastMessage.date * 1000).toISOString()}`);
        result.push(`Message: ${messageText}`);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: result.join('\n'),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError('get_chat', error instanceof Error ? error : new Error(String(error)), ErrorCategory.CHAT);
  }
}
