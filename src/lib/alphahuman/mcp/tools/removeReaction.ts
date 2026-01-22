/**
 * Remove Reaction tool - Remove a reaction from a message
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'remove_reaction',
  description: 'Remove a reaction from a message',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the chat',
      },
      message_id: {
        type: 'number',
        description: 'The message ID to remove reaction from',
      },
    },
    required: ['chat_id', 'message_id'],
  },
};

export async function removeReaction(
  args: { chat_id: string | number; message_id: number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const { message_id } = args;

    const chat = getChatById(chatId);
    if (!chat) {
      return {
        content: [
          {
            type: 'text',
            text: `Chat with ID or username "${chatId}" not found.`,
          },
        ],
        isError: true,
      };
    }

    // Remove all reactions by passing empty array
    await callApi('sendReaction', {
      chat,
      messageId: message_id,
      reactions: [],
    });

    return {
      content: [
        {
          type: 'text',
          text: `Reaction removed from message ${message_id}.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'remove_reaction',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MSG,
    );
  }
}
