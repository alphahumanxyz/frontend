/**
 * Join Chat By Link tool - Join chat by invite link
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';

export const tool: MCPTool = {
  name: 'join_chat_by_link',
  description: 'Join chat by invite link',
  inputSchema: {
    type: 'object',
    properties: {
      link: {
        type: 'string',
        description: 'The invite link (e.g., https://t.me/joinchat/...)',
      },
    },
    required: ['link'],
  },
};

export async function joinChatByLink(
  args: { link: string },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const { link } = args;

    if (!link || typeof link !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: 'Invite link is required',
          },
        ],
        isError: true,
      };
    }

    // Extract hash from link
    // Links can be: https://t.me/joinchat/HASH or https://t.me/+HASH
    let hash = '';
    if (link.includes('/joinchat/')) {
      hash = link.split('/joinchat/')[1]?.split('?')[0] || '';
    } else if (link.includes('t.me/+')) {
      hash = link.split('t.me/+')[1]?.split('?')[0] || '';
    } else if (link.startsWith('+')) {
      hash = link.split('?')[0].substring(1);
    } else {
      // Assume it's just the hash
      hash = link.split('?')[0];
    }

    if (!hash) {
      return {
        content: [
          {
            type: 'text',
            text: 'Invalid invite link format. Expected format: https://t.me/joinchat/HASH or https://t.me/+HASH',
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
            text: 'Failed to join chat with the provided invite link.',
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
      'join_chat_by_link',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.GROUP,
    );
  }
}
