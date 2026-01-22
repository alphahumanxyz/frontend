/**
 * Get Direct Chat By Contact tool - Find a direct chat with a specific contact
 */

import { getGlobal } from '../../../../global';

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { selectChat } from '../../../../global/selectors';
import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';

export const tool: MCPTool = {
  name: 'get_direct_chat_by_contact',
  description: 'Find a direct chat with a specific contact by name, username, or phone.',
  inputSchema: {
    type: 'object',
    properties: {
      contact_query: {
        type: 'string',
        description: 'Name, username, or phone number to search for',
      },
    },
    required: ['contact_query'],
  },
};

export async function getDirectChatByContact(
  args: { contact_query: string },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const { contact_query } = args;

    // Fetch all contacts
    const result = await callApi('fetchContactList');
    if (!result || !result.users) {
      return {
        content: [
          {
            type: 'text',
            text: `No contacts found matching '${contact_query}'.`,
          },
        ],
      };
    }

    const global = getGlobal();
    const queryLower = contact_query.toLowerCase();

    // Find matching contacts
    const foundContacts = result.users.filter((user) => {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
      const username = user.usernames?.[0]?.username?.toLowerCase() || '';
      const phone = typeof user.phoneNumber === 'string' ? user.phoneNumber : '';

      return (
        name.includes(queryLower)
        || (username && username.includes(queryLower))
        || (phone && phone.includes(contact_query))
      );
    });

    if (foundContacts.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No contacts found matching '${contact_query}'.`,
          },
        ],
      };
    }

    // Find direct chats with these contacts
    const results: string[] = [];
    for (const contact of foundContacts) {
      const contactName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
      const chat = selectChat(global, contact.id);
      if (chat) {
        let chatInfo = `Chat ID: ${contact.id}, Contact: ${contactName}`;
        if (contact.usernames?.[0]?.username) {
          chatInfo += `, Username: @${contact.usernames[0].username}`;
        }
        const unreadCount = global.chats.byId[contact.id]?.unreadCount;
        if (unreadCount) {
          chatInfo += `, Unread: ${unreadCount}`;
        }
        results.push(chatInfo);
      }
    }

    if (results.length === 0) {
      const foundNames = foundContacts.map((c) => `${c.firstName || ''} ${c.lastName || ''}`.trim()).join(', ');
      return {
        content: [
          {
            type: 'text',
            text: `Found contacts: ${foundNames}, but no direct chats were found with them.`,
          },
        ],
      };
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
      'get_direct_chat_by_contact',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CONTACT,
    );
  }
}
