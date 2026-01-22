/**
 * Import Chat Invite tool - Join chat by invite hash
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';

export const tool: MCPTool = {
  name: 'import_chat_invite',
  description: 'Join chat by invite hash',
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The invite hash from the invite link',
      },
    },
    required: ['hash'],
  },
};

export async function importChatInvite(
  args: { hash: string },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const { hash } = args;

    if (!hash || typeof hash !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: 'Invite hash is required',
          },
        ],
        isError: true,
      };
    }

    const result = await callApi('importChatInvite', {
      hash,
    });

    if (!result) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to join chat with the provided invite hash.',
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Successfully joined chat with ID: ${result.id}`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'import_chat_invite',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.GROUP,
    );
  }
}
