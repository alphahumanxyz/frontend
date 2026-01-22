/**
 * Get Last Interaction tool - Get the most recent message with a contact
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { selectChat } from '../../../../global/selectors';
import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getUserById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'get_last_interaction',
  description: 'Get the most recent message with a contact.',
  inputSchema: {
    type: 'object',
    properties: {
      contact_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the contact',
      },
    },
    required: ['contact_id'],
  },
};

export async function getLastInteraction(
  args: { contact_id: string | number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const contactId = validateId(args.contact_id, 'contact_id');

    const user = getUserById(contactId);
    if (!user) {
      return {
        content: [
          {
            type: 'text',
            text: `ID ${contactId} is not a user/contact.`,
          },
        ],
        isError: true,
      };
    }

    const contactName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

    // Get or fetch the chat for this user
    let chat = selectChat(context.global, user.id);
    if (!chat) {
      const chatResult = await callApi('fetchChat', {
        type: 'user',
        user,
      });
      if (chatResult?.chatId) {
        chat = selectChat(context.global, chatResult.chatId);
      }
    }

    if (!chat) {
      return {
        content: [
          {
            type: 'text',
            text: `Could not find chat for ${contactName} (ID: ${contactId}).`,
          },
        ],
        isError: true,
      };
    }

    // Get the last few messages
    const result = await callApi('fetchMessages', {
      chat,
      threadId: 0,
      offsetId: undefined,
      isSavedDialog: false,
      addOffset: undefined,
      limit: 5,
    });

    if (!result || !result.messages || result.messages.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No messages found with ${contactName} (ID: ${contactId}).`,
          },
        ],
      };
    }

    const results = [`Last interactions with ${contactName} (ID: ${contactId}):`];

    for (const msg of result.messages) {
      const sender = msg.isOutgoing ? 'You' : contactName;
      const messageText = msg.content.text?.text || '[Media/No text]';
      const date = new Date(msg.date * 1000).toISOString();
      results.push(`Date: ${date}, From: ${sender}, Message: ${messageText}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: results.join('\n'),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_last_interaction',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CONTACT,
    );
  }
}
