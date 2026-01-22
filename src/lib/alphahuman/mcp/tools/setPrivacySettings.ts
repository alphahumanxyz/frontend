/**
 * Set Privacy Settings tool - Set privacy settings (e.g., last seen, phone, etc.)
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById, getUserById } from '../telegramApi';

export const tool: MCPTool = {
  name: 'set_privacy_settings',
  description: 'Set privacy settings (e.g., last seen, phone, etc.)',
  inputSchema: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
        description: 'The privacy setting to modify (\'lastSeen\' for last seen, \'phoneNumber\' for phone, \'profilePhoto\' for profile photo, etc.)',
      },
      allow_users: {
        type: 'array',
        items: { type: ['string', 'number'] },
        description: 'List of user IDs or usernames to allow',
      },
      disallow_users: {
        type: 'array',
        items: { type: ['string', 'number'] },
        description: 'List of user IDs or usernames to disallow',
      },
    },
    required: ['key'],
  },
};

export async function setPrivacySettings(
  args: {
    key: string;
    allow_users?: Array<string | number>;
    disallow_users?: Array<string | number>;
  },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const { key, allow_users, disallow_users } = args;

    // Map the simplified keys to their corresponding API keys
    const keyMapping: Record<string, 'lastSeen' | 'phoneNumber' | 'profilePhoto'> = {
      status: 'lastSeen',
      phone: 'phoneNumber',
      profile_photo: 'profilePhoto',
    };

    const apiKey = keyMapping[key] || key as 'lastSeen' | 'phoneNumber' | 'profilePhoto';
    if (!['lastSeen', 'phoneNumber', 'profilePhoto', 'forwards', 'chatInvite'].includes(apiKey)) {
      return {
        content: [
          {
            type: 'text',
            text: `Unsupported privacy key '${key}'. Supported keys: status, phone, profile_photo, forwards, chatInvite`,
          },
        ],
        isError: true,
      };
    }

    // Build allow/disallow lists
    const allowUserIds: string[] = [];
    const allowChatIds: string[] = [];
    const blockUserIds: string[] = [];
    const blockChatIds: string[] = [];

    if (allow_users && allow_users.length > 0) {
      for (const userId of allow_users) {
        const user = getUserById(userId);
        if (user) {
          allowUserIds.push(user.id);
        } else {
          const chat = getChatById(userId);
          if (chat) {
            allowChatIds.push(chat.id);
          }
        }
      }
    }

    if (disallow_users && disallow_users.length > 0) {
      for (const userId of disallow_users) {
        const user = getUserById(userId);
        if (user) {
          blockUserIds.push(user.id);
        } else {
          const chat = getChatById(userId);
          if (chat) {
            blockChatIds.push(chat.id);
          }
        }
      }
    }

    // Determine visibility based on allow/disallow lists
    let visibility: 'everybody' | 'contacts' | 'nobody' = 'everybody';
    if (allow_users && allow_users.length > 0) {
      visibility = 'contacts';
    } else if (disallow_users && disallow_users.length > 0) {
      visibility = 'contacts';
    }

    const rules = {
      visibility,
      allowUserIds,
      allowChatIds,
      blockUserIds,
      blockChatIds,
    };

    await callApi('setPrivacySettings', {
      privacyKey: apiKey,
      rules,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Privacy settings for ${key} updated successfully.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'set_privacy_settings',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.PROFILE,
    );
  }
}
