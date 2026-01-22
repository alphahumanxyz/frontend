/**
 * Edit Chat Photo tool - Edit the photo of a chat, group, or channel
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { getChatById } from '../telegramApi';
import { validateId } from '../validation';

export const tool: MCPTool = {
  name: 'edit_chat_photo',
  description: 'Edit the photo of a chat, group, or channel. Requires a file path to an image.',
  inputSchema: {
    type: 'object',
    properties: {
      chat_id: {
        type: ['string', 'number'],
        description: 'The chat ID or username',
      },
      file_path: {
        type: 'string',
        description: 'Path to the photo file (Note: In browser context, this may need to be a blob URL or data URL)',
      },
    },
    required: ['chat_id', 'file_path'],
  },
};

export async function editChatPhoto(
  args: { chat_id: string | number; file_path: string },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const chatId = validateId(args.chat_id, 'chat_id');
    const { file_path } = args;

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

    // In browser context, file_path might be a blob URL or data URL
    let file: File;
    try {
      const response = await fetch(file_path);
      const blob = await response.blob();
      const fileName = file_path.split('/').pop() || 'photo.jpg';
      file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
    } catch (fetchError) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to load file from ${file_path}. Error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
          },
        ],
        isError: true,
      };
    }

    const result = await callApi('editChatPhoto', {
      chatId: chat.id,
      accessHash: chat.accessHash,
      photo: file,
    });

    if (!result) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to update chat photo.',
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Chat ${chatId} photo updated.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'edit_chat_photo',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CHAT,
    );
  }
}
