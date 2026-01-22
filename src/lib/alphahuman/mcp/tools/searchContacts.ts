/**
 * Search Contacts tool - Search for contacts by name, username, or phone number
 */

import type { ApiChat, ApiUser } from '../../../../api/types';
import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';

export const tool: MCPTool = {
  name: 'search_contacts',
  description: 'Search for contacts by name, username, or phone number',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search term to look for in contact names, usernames, or phone numbers',
      },
    },
    required: ['query'],
  },
};

export async function searchContacts(
  args: { query: string },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const { query } = args;

    // Use callApi to search contacts
    const result = await callApi('searchChats', { query });

    if (!result) {
      return {
        content: [
          {
            type: 'text',
            text: `No contacts found matching '${query}'.`,
          },
        ],
      };
    }

    // Get all result IDs (both account and global)
    const allResultIds = [...result.accountResultIds, ...result.globalResultIds];
    if (allResultIds.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No contacts found matching '${query}'.`,
          },
        ],
      };
    }

    // Get chats from global state and filter to only users (contacts)
    const global = context.global;
    const entities = allResultIds
      .map((id: string) => {
        const chat = global.chats.byId[id];
        const user = global.users.byId[id];
        return (chat || user) as ApiChat | ApiUser | undefined;
      })
      .filter((entity): entity is ApiChat | ApiUser => {
        if (!entity) return false;
        if ('type' in entity) {
          return entity.type === 'chatTypePrivate';
        }
        return 'firstName' in entity;
      });

    if (entities.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No contacts found matching '${query}'.`,
          },
        ],
      };
    }

    const lines = entities.map((entity: ApiChat | ApiUser) => {
      let name = 'Unknown';
      if ('title' in entity) {
        name = entity.title;
      } else if ('firstName' in entity) {
        const firstName = entity.firstName || '';
        const lastName = entity.lastName || '';
        name = `${firstName} ${lastName}`.trim() || 'Unknown';
      }
      const username = entity.usernames?.[0]?.username;
      const phone = 'phoneNumber' in entity ? entity.phoneNumber : undefined;

      let contactInfo = `ID: ${entity.id}, Name: ${name}`;
      if (username) {
        contactInfo += `, Username: @${username}`;
      }
      if (phone && typeof phone === 'string') {
        contactInfo += `, Phone: ${phone}`;
      }
      return contactInfo;
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
      'search_contacts',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CONTACT,
    );
  }
}
