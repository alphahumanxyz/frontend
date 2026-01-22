/**
 * Get Contact Chats tool - List all chats involving a specific contact
 */

import { getGlobal } from '../../../../global';

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { selectChat } from '../../../../global/selectors';
import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getUserById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'get_contact_chats',
  description: 'List all chats involving a specific contact.',
  inputSchema: {
    type: 'object',
    properties: {
      contact_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the contact',
      },
    },
    required: ['contact_id'],
  },
};

export async function getContactChats(
  args: { contact_id: string | number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const contactId = validateId(args.contact_id, 'contact_id');

    const user = getUserById(contactId);
    if (!user) {
      return {
        content: [
          {
            type: 'text',
            text: `ID ${contactId} is not a user/contact.`,
          },
        ],
        isError: true,
      };
    }

    const contactName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    let global = getGlobal();
    const results: string[] = [];

    // Find direct chat
    const directChat = selectChat(global, contactId.toString());
    if (directChat) {
      let chatInfo = `Direct Chat ID: ${contactId}, Type: Private`;
      const unreadCount = global.chats.byId[contactId.toString()]?.unreadCount;
      if (unreadCount) {
        chatInfo += `, Unread: ${unreadCount}`;
      }
      results.push(chatInfo);
    }

    // Look for common groups/channels
    try {
      const common = await callApi('fetchCommonChats', {
        user,
        maxId: undefined,
      });

      // Update global state after await as it may have been updated
      global = getGlobal();

      if (common && common.chatIds) {
        for (const chat of common.chatIds) {
          const chatType = global.chats.byId[chat]?.type;
          const chatInfo = `Chat ID: ${chat}, Title: ${global.chats.byId[chat]?.title || 'Unknown'}, Type: ${chatType}`;
          results.push(chatInfo);
        }
      }
    } catch {
      results.push('Could not retrieve common groups.');
    }

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No chats found with ${contactName} (ID: ${contactId}).`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Chats with ${contactName} (ID: ${contactId}):\n${results.join('\n')}`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_contact_chats',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CONTACT,
    );
  }
}
