/**
 * Forward Message tool - Forward a message from one chat to another
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { toHumanReadableAction } from '../toolActionParser';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'forward_message',
  description: 'Forward a message from one chat to another',
  inputSchema: {
    type: 'object',
    properties: {
      from_chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the source chat',
      },
      message_id: {
        type: 'number',
        description: 'The message ID to forward',
      },
      to_chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the destination chat',
      },
    },
    required: ['from_chat_id', 'message_id', 'to_chat_id'],
  },
  toHumanReadableAction: (args) => toHumanReadableAction('forward_message', args),
};

export async function forwardMessage(
  args: {
    from_chat_id: string | number;
    message_id: number;
    to_chat_id: string | number;
  },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const fromChatId = validateId(args.from_chat_id, 'from_chat_id');
    const toChatId = validateId(args.to_chat_id, 'to_chat_id');
    const { message_id } = args;

    const fromChat = getChatById(fromChatId);
    if (!fromChat) {
      return {
        content: [
          {
            type: 'text',
            text: `Source chat not found: ${fromChatId}`,
          },
        ],
        isError: true,
      };
    }

    const toChat = getChatById(toChatId);
    if (!toChat) {
      return {
        content: [
          {
            type: 'text',
            text: `Destination chat not found: ${toChatId}`,
          },
        ],
        isError: true,
      };
    }

    // Get the message first
    const messageResult = await callApi('fetchMessage', {
      chat: fromChat,
      messageId: message_id,
    });

    if (!messageResult || messageResult === 'MESSAGE_DELETED' || !('message' in messageResult)) {
      return {
        content: [
          {
            type: 'text',
            text: `Message ${message_id} not found in source chat ${fromChatId}`,
          },
        ],
        isError: true,
      };
    }

    await callApi('forwardMessages', {
      fromChat,
      toChat,
      messages: [messageResult.message],
    });

    return {
      content: [
        {
          type: 'text',
          text: `Message ${message_id} forwarded from ${fromChatId} to ${toChatId}.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'forward_message',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MSG,
    );
  }
}
