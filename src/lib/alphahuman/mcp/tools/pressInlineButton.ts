/**
 * Press Inline Button tool - Trigger inline keyboard callbacks by label or index
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { selectChatMessage } from '../../../../global/selectors';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'press_inline_button',
  description: 'Trigger inline keyboard callbacks by label or index',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The chat ID or username',
      },
      message_id: {
        type: 'number',
        description: 'The message ID containing the inline keyboard',
      },
      button_text: {
        type: 'string',
        description: 'The button text to press (optional if button_index is provided)',
      },
      button_index: {
        type: 'number',
        description: 'The button index (row,column format as single number) (optional if button_text is provided)',
      },
    },
    required: ['chat_id', 'message_id'],
  },
};

export async function pressInlineButton(
  args: {
    chat_id: string | number;
    message_id: number;
    button_text?: string;
    button_index?: number;
  },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const { message_id, button_text, button_index } = args;

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

    if (!message.inlineButtons || message.inlineButtons.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No inline buttons found in message ${message_id}`,
          },
        ],
        isError: true,
      };
    }

    let targetButton;
    if (button_index !== undefined) {
      // Find button by index (flattened)
      let currentIndex = 0;
      for (const row of message.inlineButtons) {
        for (const button of row) {
          if (currentIndex === button_index) {
            targetButton = button;
            break;
          }
          currentIndex++;
        }
        if (targetButton) break;
      }
    } else if (button_text) {
      // Find button by text
      for (const row of message.inlineButtons) {
        for (const button of row) {
          if (button.text === button_text) {
            targetButton = button;
            break;
          }
        }
        if (targetButton) break;
      }
    } else {
      return {
        content: [
          {
            type: 'text',
            text: 'Either button_text or button_index must be provided',
          },
        ],
        isError: true,
      };
    }

    if (!targetButton) {
      return {
        content: [
          {
            type: 'text',
            text: `Button not found${button_text ? ` with text "${button_text}"` : ` at index ${button_index}`}`,
          },
        ],
        isError: true,
      };
    }

    // Handle different button types
    if (targetButton.type === 'callback') {
      await callApi('answerCallbackButton', {
        chatId: String(chatId),
        accessHash: chat.accessHash,
        messageId: message_id,
        data: targetButton.data,
      });
    } else if (targetButton.type === 'url') {
      // URL buttons can't be "pressed" programmatically, they just open URLs
      return {
        content: [
          {
            type: 'text',
            text: `Button "${targetButton.text}" is a URL button. URL: ${targetButton.url}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `Button type "${targetButton.type}" is not supported for programmatic pressing`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Button "${targetButton.text}" pressed successfully.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'press_inline_button',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MSG,
    );
  }
}
