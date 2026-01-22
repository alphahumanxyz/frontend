/**
 * Set Profile Photo tool - Set a new profile photo
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';

export const tool: MCPTool = {
  name: 'set_profile_photo',
  description: 'Set a new profile photo. Note: This requires a File object which may not be available in MCP context.',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Path to the photo file (Note: In browser context, this may need to be a blob URL or data URL)',
      },
    },
    required: ['file_path'],
  },
};

export async function setProfilePhoto(
  args: { file_path: string },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const { file_path } = args;

    // In browser context, file_path might be a blob URL or data URL
    // We need to fetch it and convert to File
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

    const result = await callApi('uploadProfilePhoto', {
      file,
      isFallback: false,
      isVideo: false,
    });

    if (!result || !result.photo) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to upload profile photo.',
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Profile photo updated.',
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'set_profile_photo',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.PROFILE,
    );
  }
}
