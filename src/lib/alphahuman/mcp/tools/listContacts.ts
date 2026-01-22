/**
 * List Contacts tool - List all contacts in your Telegram account
 */

import type { ApiChat } from '../../../../api/types';
import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';

export const tool: MCPTool = {
  name: 'list_contacts',
  description: 'List all contacts in your Telegram account',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function listContacts(
  args: Record<string, never>,
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    // Get all chats and filter to contacts (private chats)
    const chatsResult = await callApi('fetchChats', { limit: 1000 });

    if (!chatsResult) {
      return {
        content: [
          {
            type: 'text',
            text: 'No contacts found.',
          },
        ],
      };
    }

    // Filter to only users (contacts) - private chats
    const global = context.global;
    const chatIds = chatsResult.chatIds || [];
    const contactChats = chatIds
      .map((chatId: string) => global.chats.byId[chatId])
      .filter((chat: ApiChat | undefined): chat is ApiChat => chat?.type === 'chatTypePrivate');

    if (contactChats.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No contacts found.',
          },
        ],
      };
    }

    const contentItems = contactChats.map((chat: ApiChat) => {
      const name = chat.title || 'Unknown';
      const username = chat.usernames?.[0]?.username;
      // Get user from global state to access phone number
      const user = context.global.users.byId[chat.id];
      const phone = user?.phoneNumber;

      let contactInfo = `ID: ${chat.id}, Name: ${name}`;
      if (username) {
        contactInfo += `, Username: @${username}`;
      }
      if (phone && typeof phone === 'string') {
        contactInfo += `, Phone: ${phone}`;
      }
      return {
        type: 'text' as const,
        text: contactInfo,
      };
    });

    return {
      content: contentItems,
    };
  } catch (error) {
    return logAndFormatError(
      'list_contacts',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CONTACT,
    );
  }
}
