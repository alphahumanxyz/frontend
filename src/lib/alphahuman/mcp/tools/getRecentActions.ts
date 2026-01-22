/**
 * Get Recent Actions tool - Get recent admin actions (admin log) in a group or channel
 */

import { Api as GramJs } from '../../../../lib/gramjs';

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { buildInputChannel } from '../../../../api/gramjs/gramjsBuilders';
import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'get_recent_actions',
  description: 'Get recent admin actions (admin log) in a group or channel',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The chat ID or username',
      },
    },
    required: ['chat_id'],
  },
};

export async function getRecentActions(
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

    if (!chat.accessHash) {
      return {
        content: [
          {
            type: 'text',
            text: 'This chat does not support admin log',
          },
        ],
        isError: true,
      };
    }

    const channel = buildInputChannel(chat.id, chat.accessHash);
    const result = await callApi('invokeRequest', new GramJs.channels.GetAdminLog({
      channel,
      q: '',
      eventsFilter: undefined,
      admins: [],
      maxId: BigInt(0),
      minId: BigInt(0),
      limit: 20,
    }));

    if (!result || !('events' in result) || !result.events || result.events.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No recent admin actions found.',
          },
        ],
      };
    }

    const events = result.events.map((event: any) => ({
      id: String(event.id),
      date: event.date,
      userId: String(event.userId),
      action: event.action.className,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ events, count: events.length }, undefined, 2),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_recent_actions',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.ADMIN,
    );
  }
}
