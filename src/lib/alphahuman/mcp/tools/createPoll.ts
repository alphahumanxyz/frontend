/**
 * Create Poll tool - Create a poll in a chat using Telegram's native poll feature
 */

import type { ApiNewPoll } from '../../../../api/types';
import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'create_poll',
  description: 'Create a poll in a chat using Telegram\'s native poll feature',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID of the chat to send the poll to',
      },
      question: {
        type: 'string',
        description: 'The poll question',
      },
      options: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of answer options (2-10 options)',
      },
      multiple_choice: {
        type: 'boolean',
        description: 'Whether users can select multiple answers',
        default: false,
      },
      quiz_mode: {
        type: 'boolean',
        description: 'Whether this is a quiz (has correct answer)',
        default: false,
      },
      public_votes: {
        type: 'boolean',
        description: 'Whether votes are public',
        default: true,
      },
      close_date: {
        type: 'string',
        description: 'Optional close date in ISO format (YYYY-MM-DD HH:MM:SS)',
      },
    },
    required: ['chat_id', 'question', 'options'],
  },
};

export async function createPoll(
  args: {
    chat_id: string | number;
    question: string;
    options: string[];
    multiple_choice?: boolean;
    quiz_mode?: boolean;
    public_votes?: boolean;
    close_date?: string;
  },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const {
      question, options, multiple_choice = false, quiz_mode = false, public_votes = true, close_date,
    } = args;

    // Validate options
    if (options.length < 2) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Poll must have at least 2 options.',
          },
        ],
        isError: true,
      };
    }
    if (options.length > 10) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Poll can have at most 10 options.',
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
            text: `Chat ${chatId} not found`,
          },
        ],
        isError: true,
      };
    }

    // Parse close date if provided
    let closeDate: number | undefined;
    if (close_date) {
      try {
        const date = new Date(close_date);
        if (isNaN(date.getTime())) {
          return {
            content: [
              {
                type: 'text',
                text: 'Invalid close_date format. Use YYYY-MM-DD HH:MM:SS format.',
              },
            ],
            isError: true,
          };
        }
        closeDate = Math.floor(date.getTime() / 1000);
      } catch {
        return {
          content: [
            {
              type: 'text',
              text: 'Invalid close_date format. Use YYYY-MM-DD HH:MM:SS format.',
            },
          ],
          isError: true,
        };
      }
    }

    const poll: ApiNewPoll = {
      summary: {
        question: {
          text: question,
          entities: [],
        },
        answers: options.map((option, index) => ({
          text: {
            text: option,
            entities: [],
          },
          option: String(index),
        })),
        ...(multiple_choice && { multipleChoice: true }),
        ...(quiz_mode && { quiz: true }),
        ...(public_votes && { isPublic: true }),
        ...(closeDate && { closeDate }),
      },
    };

    await callApi('sendMessage', {
      chat,
      poll,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Poll created successfully in chat ${chatId}.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'create_poll',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MSG,
    );
  }
}
