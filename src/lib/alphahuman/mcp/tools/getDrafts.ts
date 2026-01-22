/**
 * Get Drafts tool - Get all draft messages across all chats
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { selectDraft } from '../../../../global/selectors';
import { MAIN_THREAD_ID } from '../../../../api/types';

export const tool: MCPTool = {
  name: 'get_drafts',
  description: 'Get all draft messages across all chats',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function getDrafts(
  args: Record<string, never>,
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  await Promise.resolve(); // Ensure async
  try {
    const { global } = context;
    const drafts: Array<{
      chat_id: string;
      message?: string;
      date?: number;
      reply_to_msg_id?: number;
    }> = [];

    // Iterate through all chats in global state
    const chatIds = Object.keys(global.chats.byId);
    for (const chatId of chatIds) {
      const draft = selectDraft(global, chatId, MAIN_THREAD_ID);
      if (draft && draft.text) {
        drafts.push({
          chat_id: chatId,
          message: draft.text.text,
          date: draft.date,
          reply_to_msg_id: draft.replyInfo?.replyToMsgId,
        });
      }
    }

    if (drafts.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No drafts found.',
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ drafts, count: drafts.length }, undefined, 2),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_drafts',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MSG,
    );
  }
}
