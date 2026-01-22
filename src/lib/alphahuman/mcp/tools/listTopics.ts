/**
 * List Topics tool - List forum topics in a supergroup
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'list_topics',
  description: 'List forum topics in a supergroup with forum feature enabled',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The ID or username of the forum-enabled chat (supergroup)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of topics to retrieve',
        default: 200,
      },
      offset_topic: {
        type: 'number',
        description: 'Topic ID offset for pagination',
        default: 0,
      },
      search_query: {
        type: 'string',
        description: 'Optional query to filter topics by title',
      },
    },
    required: ['chat_id'],
  },
};

export async function listTopics(
  args: {
    chat_id: string | number;
    limit?: number;
    offset_topic?: number;
    search_query?: string;
  },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const { limit = 200, offset_topic: offsetTopic = 0, search_query: searchQuery } = args;

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

    if (chat.type !== 'chatTypeSuperGroup') {
      return {
        content: [
          {
            type: 'text',
            text: 'The specified chat is not a supergroup.',
          },
        ],
        isError: true,
      };
    }

    if (!chat.isForum) {
      return {
        content: [
          {
            type: 'text',
            text: 'The specified supergroup does not have forum topics enabled.',
          },
        ],
        isError: true,
      };
    }

    const result = await callApi('fetchTopics', {
      chat,
      limit,
      offsetTopicId: offsetTopic,
      query: searchQuery,
    });

    if (!result?.topics || result.topics.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No topics found for this chat.',
          },
        ],
      };
    }

    const contentItems = result.topics.map((topic: {
      id: number;
      title?: string;
      messageCount?: number;
      unreadCount?: number;
      isClosed?: boolean;
      isHidden?: boolean;
      lastMessageId?: number;
    }) => {
      const parts = [`Topic ID: ${topic.id}`];
      parts.push(`Title: ${topic.title || '(no title)'}`);

      if (topic.messageCount !== undefined) {
        parts.push(`Messages: ${topic.messageCount}`);
      }

      if (topic.unreadCount) {
        parts.push(`Unread: ${topic.unreadCount}`);
      }

      if (topic.isClosed) {
        parts.push('Closed: Yes');
      }

      if (topic.isHidden) {
        parts.push('Hidden: Yes');
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
      'list_topics',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.GROUP,
    );
  }
}
