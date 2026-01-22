/**
 * Delete Profile Photo tool - Delete your current profile photo
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getCurrentUser } from '../telegramApi';

export const tool: MCPTool = {
  name: 'delete_profile_photo',
  description: 'Delete your current profile photo',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function deleteProfilePhoto(
  args: Record<string, never>,
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const user = getCurrentUser();
    if (!user) {
      return {
        content: [
          {
            type: 'text',
            text: 'User information not available',
          },
        ],
        isError: true,
      };
    }

    // Get user photos to find the current profile photo
    const photos = await callApi('fetchProfilePhotos', {
      peer: user,
      offset: 0,
      limit: 1,
    });

    if (!photos || !photos.photos || photos.photos.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No profile photo to delete.',
          },
        ],
      };
    }

    // Delete the first (current) profile photo
    const result = await callApi('deleteProfilePhotos', [photos.photos[0]]);

    if (!result) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to delete profile photo.',
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Profile photo deleted.',
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'delete_profile_photo',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.PROFILE,
    );
  }
}
