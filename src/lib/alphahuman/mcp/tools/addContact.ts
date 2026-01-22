/**
 * Add Contact tool - Add a new contact to your Telegram account
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';

export const tool: MCPTool = {
  name: 'add_contact',
  description: 'Add a new contact to your Telegram account',
  inputSchema: {
    type: 'object',
    properties: {
      phone: {
        type: 'string',
        description: 'The phone number of the contact (with country code)',
      },
      first_name: {
        type: 'string',
        description: 'The contact\'s first name',
      },
      last_name: {
        type: 'string',
        description: 'The contact\'s last name (optional)',
      },
    },
    required: ['phone', 'first_name'],
  },
};

export async function addContact(
  args: { phone: string; first_name: string; last_name?: string },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const { phone, first_name, last_name = '' } = args;

    if (!phone || typeof phone !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: 'Phone number is required',
          },
        ],
        isError: true,
      };
    }

    if (!first_name || typeof first_name !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: 'First name is required',
          },
        ],
        isError: true,
      };
    }

    const result = await callApi('importContact', {
      phone,
      firstName: first_name,
      lastName: last_name || '',
    });

    if (!result) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to add contact.',
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Contact ${first_name} ${last_name}`.trim() + ' added successfully.',
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'add_contact',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CONTACT,
    );
  }
}
