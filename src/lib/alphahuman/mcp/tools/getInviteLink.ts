/**
 * Get Invite Link tool - Get invite link for a chat
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'get_invite_link',
  description: 'Get invite link for a chat',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the chat',
      },
    },
    required: ['chat_id'],
  },
};

export async function getInviteLink(
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
            text: `Chat with ID or username "${chatId}" not found.`,
          },
        ],
        isError: true,
      };
    }

    // Get full chat info to access invite link
    const fullInfo = await callApi('loadFullChat', { chatId: chat.id });
    const inviteLink = fullInfo?.fullInfo?.inviteLink;

    if (!inviteLink) {
      // Try to export a new invite link
      const newLink = await callApi('exportChatInvite', {
        peer: chat,
      });

      if (!newLink?.link) {
        return {
          content: [
            {
              type: 'text',
              text: 'Unable to get or create invite link for this chat.',
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `Invite link: ${newLink.link}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Invite link: ${inviteLink}`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_invite_link',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.GROUP,
    );
  }
}
