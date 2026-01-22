/**
 * Create Channel tool - Create a new channel or supergroup
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';

export const tool: MCPTool = {
  name: 'create_channel',
  description: 'Create a new channel or supergroup',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The title of the channel',
      },
      about: {
        type: 'string',
        description: 'Description/about text for the channel',
      },
      megagroup: {
        type: 'boolean',
        description: 'If true, create a supergroup instead of a channel',
        default: false,
      },
    },
    required: ['title'],
  },
};

export async function createChannel(
  args: { title: string; about?: string; megagroup?: boolean },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const { title, about, megagroup = false } = args;

    if (!title || typeof title !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: 'Channel title is required',
          },
        ],
        isError: true,
      };
    }

    const result = await callApi('createChannel', {
      title,
      about: about || '',
      isMegagroup: megagroup ? true : undefined,
      isBroadcast: megagroup ? undefined : true,
    });

    if (!result?.channel) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to create channel',
          },
        ],
        isError: true,
      };
    }

    const channelType = megagroup ? 'supergroup' : 'channel';
    return {
      content: [
        {
          type: 'text',
          text: `${channelType} "${title}" created successfully with ID: ${result.channel.id}`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'create_channel',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.GROUP,
    );
  }
}
