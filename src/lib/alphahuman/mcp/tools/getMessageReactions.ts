/**
 * Get Message Reactions tool - Get all reactions on a message
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'get_message_reactions',
  description: 'Get all reactions on a message',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the chat',
      },
      message_id: {
        type: 'number',
        description: 'The message ID to get reactions for',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of reactions to retrieve',
        default: 50,
      },
    },
    required: ['chat_id', 'message_id'],
  },
};

export async function getMessageReactions(
  args: { chat_id: string | number; message_id: number; limit?: number },
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

    // Get message first to check reactions
    const messageResult = await callApi('fetchMessage', {
      chat,
      messageId: message_id,
    });

    if (!messageResult || messageResult === 'MESSAGE_DELETED' || !('message' in messageResult)) {
      return {
        content: [
          {
            type: 'text',
            text: `Message with ID ${message_id} not found.`,
          },
        ],
        isError: true,
      };
    }

    const message = messageResult.message;
    if (!message.reactions) {
      return {
        content: [
          {
            type: 'text',
            text: 'No reactions found on this message.',
          },
        ],
      };
    }

    const lines: string[] = [];
    if (message.reactions.results) {
      for (const reaction of message.reactions.results) {
        const emoji = reaction.reaction.type === 'emoji' ? reaction.reaction.emoticon : 'Custom';
        lines.push(`${emoji}: ${reaction.count} reaction(s)`);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: lines.length > 0 ? lines.join('\n') : 'No reactions found on this message.',
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_message_reactions',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MSG,
    );
  }
}
