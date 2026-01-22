/**
 * Send Reaction tool - Add a reaction to a message
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'send_reaction',
  description: 'Add a reaction to a message',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the chat',
      },
      message_id: {
        type: 'number',
        description: 'The message ID to react to',
      },
      emoji: {
        type: 'string',
        description: 'The emoji reaction (e.g., 👍, ❤️, 😂)',
      },
      big: {
        type: 'boolean',
        description: 'Whether to send a big reaction',
        default: false,
      },
    },
    required: ['chat_id', 'message_id', 'emoji'],
  },
};

export async function sendReaction(
  args: { chat_id: string | number; message_id: number; emoji: string; big?: boolean },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const { message_id, emoji, big = false } = args;

    if (!emoji || typeof emoji !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: 'Emoji is required',
          },
        ],
        isError: true,
      };
    }

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

    // Build reaction object
    const reaction = {
      type: 'reactionEmoji' as const,
      emoji: emoji,
    };

    await callApi('sendReaction', {
      chat,
      messageId: message_id,
      reactions: [reaction],
      shouldAddToRecent: true,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Reaction ${emoji} added to message ${message_id}.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'send_reaction',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MSG,
    );
  }
}
