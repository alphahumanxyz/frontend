/**
 * List Chats tool - List available chats with metadata
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { formatEntity, getChats as getChatsApi } from '../telegramApi';
import { toHumanReadableAction } from '../toolActionParser';

export const tool: MCPTool = {
  name: 'list_chats',
  description: 'List available chats with metadata',
  inputSchema: {
    type: 'object',
    properties: {
      chat_type: {
        type: 'string',
        enum: ['user', 'group', 'channel'],
        description: 'Filter by chat type (\'user\', \'group\', \'channel\', or omit for all)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of chats to retrieve',
        default: 20,
      },
    },
  },
  toHumanReadableAction: (args) => toHumanReadableAction('list_chats', args),
};

export async function listChats(
  args: { chat_type?: string; limit?: number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const limit = args.limit || 20;
    const chatType = args.chat_type?.toLowerCase();

    const chats = await getChatsApi(limit);

    const contentItems: Array<{ type: 'text'; text: string }> = [];
    for (const chat of chats) {
      const entity = formatEntity(chat);

      // Filter by type if requested
      if (chatType && entity.type !== chatType) {
        continue;
      }

      let chatInfo = `Chat ID: ${entity.id}`;
      chatInfo += `, Title: ${entity.name}`;
      chatInfo += `, Type: ${entity.type}`;

      if (entity.username) {
        chatInfo += `, Username: @${entity.username}`;
      }

      // Add unread count if available
      if ('unreadCount' in chat && chat.unreadCount) {
        chatInfo += `, Unread: ${chat.unreadCount}`;
      } else {
        chatInfo += ', No unread messages';
      }

      contentItems.push({
        type: 'text',
        text: chatInfo,
      });
    }

    if (contentItems.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No chats found matching the criteria.',
          },
        ],
      };
    }

    return {
      content: contentItems,
    };
  } catch (error) {
    return logAndFormatError(
      'list_chats',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CHAT,
    );
  }
}
