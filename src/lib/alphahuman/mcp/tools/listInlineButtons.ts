/**
 * List Inline Buttons tool - Inspect inline keyboards to discover button text/index
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { selectChatMessage } from '../../../../global/selectors';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'list_inline_buttons',
  description: 'Inspect inline keyboards to discover button text/index',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The chat ID or username',
      },
      message_id: {
        type: 'number',
        description: 'The message ID to inspect',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of buttons to return',
        default: 50,
      },
    },
    required: ['chat_id', 'message_id'],
  },
};

export async function listInlineButtons(
  args: { chat_id: string | number; message_id: number; limit?: number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  await Promise.resolve(); // Ensure async
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const { message_id, limit = 50 } = args;

    const { global } = context;
    const message = selectChatMessage(global, String(chatId), message_id);

    if (!message) {
      return {
        content: [
          {
            type: 'text',
            text: `Message ${message_id} not found in chat ${chatId}`,
          },
        ],
        isError: true,
      };
    }

    const buttons: Array<{
      row: number;
      column: number;
      text: string;
      type: string;
      data?: string;
      url?: string;
    }> = [];

    if (message.inlineButtons) {
      message.inlineButtons.forEach((row, rowIndex) => {
        row.forEach((button, colIndex) => {
          if (buttons.length < limit) {
            buttons.push({
              row: rowIndex,
              column: colIndex,
              text: button.text,
              type: button.type,
              ...(button.type === 'callback' && { data: button.data }),
              ...(button.type === 'url' && { url: button.url }),
            });
          }
        });
      });
    }

    if (buttons.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No inline buttons found in message ${message_id}`,
          },
        ],
      };
    }

    const contentItems = buttons.map((button) => {
      const parts = [
        `Row: ${button.row}`,
        `Column: ${button.column}`,
        `Text: ${button.text}`,
        `Type: ${button.type}`,
      ];

      if (button.data) {
        parts.push(`Data: ${button.data}`);
      }

      if (button.url) {
        parts.push(`URL: ${button.url}`);
      }

      return {
        type: 'text' as const,
        text: parts.join(' | '),
      };
    });

    return {
      content: contentItems,
    };
  } catch (error) {
    return logAndFormatError(
      'list_inline_buttons',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MSG,
    );
  }
}
