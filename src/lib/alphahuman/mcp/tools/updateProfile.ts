/**
 * Update Profile tool - Update your profile information
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';

export const tool: MCPTool = {
  name: 'update_profile',
  description: 'Update your profile information (name, bio)',
  inputSchema: {
    type: 'object',
    properties: {
      first_name: {
        type: 'string',
        description: 'First name',
      },
      last_name: {
        type: 'string',
        description: 'Last name',
      },
      about: {
        type: 'string',
        description: 'Bio/about text',
      },
    },
  },
};

export async function updateProfile(
  args: { first_name?: string; last_name?: string; about?: string },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const { first_name, last_name, about } = args;

    await callApi('updateProfile', {
      firstName: first_name,
      lastName: last_name,
      about,
    });

    return {
      content: [
        {
          type: 'text',
          text: 'Profile updated successfully.',
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'update_profile',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.PROFILE,
    );
  }
}
