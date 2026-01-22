/**
 * Clear Draft tool - Clear/delete a draft from a specific chat
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'clear_draft',
  description: 'Clear/delete a draft from a specific chat',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The chat ID or username to clear the draft from',
      },
    },
    required: ['chat_id'],
  },
};

export async function clearDraft(
  args: { chat_id: string | number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');

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

    // Saving an empty draft clears it
    await callApi('saveDraft', {
      chat,
      draft: undefined,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Draft cleared from chat ${chatId}.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'clear_draft',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MSG,
    );
  }
}
