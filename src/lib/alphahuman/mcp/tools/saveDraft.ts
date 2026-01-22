/**
 * Save Draft tool - Save a draft message to a chat
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'save_draft',
  description: 'Save a draft message to a chat or channel',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The chat ID or username to save the draft to',
      },
      message: {
        type: 'string',
        description: 'The draft message text',
      },
      reply_to_msg_id: {
        type: 'number',
        description: 'Optional message ID to reply to',
      },
      no_webpage: {
        type: 'boolean',
        description: 'If true, disable link preview in the draft',
      },
    },
    required: ['chat_id', 'message'],
  },
};

export async function saveDraft(
  args: {
    chat_id: string | number;
    message: string;
    reply_to_msg_id?: number;
    no_webpage?: boolean;
  },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const { message, reply_to_msg_id, no_webpage } = args;

    const chat = getChatById(chatId);
    if (!chat) {
      return {
        content: [
          {
            type: 'text',
            text: `Chat ${chatId} not found`,
          },
        ],
        isError: true,
      };
    }

    const draft = {
      text: {
        text: message,
        entities: [],
      },
      ...(reply_to_msg_id && {
        replyInfo: {
          type: 'message' as const,
          replyToMsgId: reply_to_msg_id,
        },
      }),
    };

    await callApi('saveDraft', {
      chat,
      draft,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Draft saved to chat ${chatId}. Open the chat in Telegram to see and send it.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'save_draft',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MSG,
    );
  }
}
