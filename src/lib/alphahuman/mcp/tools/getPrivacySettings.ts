/**
 * Get Privacy Settings tool - Get your privacy settings
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';

export const tool: MCPTool = {
  name: 'get_privacy_settings',
  description: 'Get your privacy settings for last seen status and other privacy options',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function getPrivacySettings(
  args: Record<string, never>,
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    // Get privacy settings for last seen (most common)
    const result = await callApi('fetchPrivacySettings', {
      privacyKey: 'lastSeen',
    });

    if (!result) {
      return {
        content: [
          {
            type: 'text',
            text: 'Could not fetch privacy settings.',
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            lastSeen: result.rules,
          }, undefined, 2),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_privacy_settings',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.PROFILE,
    );
  }
}
