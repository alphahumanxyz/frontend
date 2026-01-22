/**
 * Get User Photos tool - Get a user's profile photos
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getUserById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'get_user_photos',
  description: 'Get a user\'s profile photos',
  inputSchema: {
    type: 'object',
    properties: {
      user_id: {
        type: ['string', 'number'],
        description: 'The user ID or username',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of photos to retrieve',
        default: 20,
      },
    },
    required: ['user_id'],
  },
};

export async function getUserPhotos(
  args: { user_id: string | number; limit?: number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const userId = validateId(args.user_id, 'user_id');
    const { limit = 20 } = args;

    const user = getUserById(userId);
    if (!user) {
      return {
        content: [
          {
            type: 'text',
            text: `User with ID or username "${userId}" not found.`,
          },
        ],
        isError: true,
      };
    }

    const result = await callApi('fetchProfilePhotos', {
      peer: user,
      limit,
    });

    if (!result?.photos || result.photos.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No profile photos found for this user.',
          },
        ],
      };
    }

    const lines = result.photos.map((photo: { id: string; date?: number }) => {
      const dateStr = photo.date ? new Date(photo.date * 1000).toISOString() : 'Unknown date';
      return `Photo ID: ${photo.id}, Date: ${dateStr}`;
    });

    return {
      content: [
        {
          type: 'text',
          text: `Found ${result.photos.length} profile photo(s):\n${lines.join('\n')}`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_user_photos',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.PROFILE,
    );
  }
}
