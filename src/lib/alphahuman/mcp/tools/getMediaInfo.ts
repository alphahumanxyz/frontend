/**
 * Get Media Info tool - Get info about media in a message
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';
import { MESSAGE_DELETED } from '../../../../api/types/messages';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'get_media_info',
  description: 'Get info about media in a message',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The chat ID or username',
      },
      message_id: {
        type: 'number',
        description: 'The message ID',
      },
    },
    required: ['chat_id', 'message_id'],
  },
};

export async function getMediaInfo(
  args: { chat_id: string | number; message_id: number },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const { message_id } = args;

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

    const messageResult = await callApi('fetchMessage', {
      chat,
      messageId: message_id,
    });

    if (!messageResult || messageResult === MESSAGE_DELETED) {
      return {
        content: [
          {
            type: 'text',
            text: `Message ${message_id} not found or has been deleted`,
          },
        ],
        isError: true,
      };
    }

    const message = messageResult.message;

    const hasMedia = message.content
      && ('photo' in message.content || 'video' in message.content || 'document' in message.content
        || 'audio' in message.content || 'voice' in message.content);

    if (!hasMedia) {
      return {
        content: [
          {
            type: 'text',
            text: 'No media found in the specified message.',
          },
        ],
      };
    }

    const mediaInfo: Record<string, any> = {
      message_id: message.id,
      chat_id: chatId,
    };

    if ('photo' in message.content && message.content.photo) {
      mediaInfo.media_type = 'photo';
      mediaInfo.photo = {
        id: message.content.photo.id,
        sizes: message.content.photo.sizes?.length || 0,
      };
    } else if ('video' in message.content && message.content.video) {
      mediaInfo.media_type = 'video';
      mediaInfo.video = {
        id: message.content.video.id,
        duration: message.content.video.duration,
        width: message.content.video.width,
        height: message.content.video.height,
        mimeType: message.content.video.mimeType,
      };
    } else if ('document' in message.content && message.content.document) {
      mediaInfo.media_type = 'document';
      mediaInfo.document = {
        id: message.content.document.id,
        fileName: message.content.document.fileName,
        mimeType: message.content.document.mimeType,
        size: message.content.document.size,
      };
    } else if ('audio' in message.content && message.content.audio) {
      mediaInfo.media_type = 'audio';
      mediaInfo.audio = {
        id: message.content.audio.id,
        duration: message.content.audio.duration,
        title: message.content.audio.title,
        performer: message.content.audio.performer,
      };
    } else if ('voice' in message.content && message.content.voice) {
      mediaInfo.media_type = 'voice';
      mediaInfo.voice = {
        id: message.content.voice.id,
        duration: message.content.voice.duration,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mediaInfo, undefined, 2),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_media_info',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.MEDIA,
    );
  }
}
