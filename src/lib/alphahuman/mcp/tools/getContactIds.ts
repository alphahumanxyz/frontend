/**
 * Get Contact IDs tool - List all contact IDs
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';

export const tool: MCPTool = {
  name: 'get_contact_ids',
  description: 'List all contact IDs',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function getContactIds(
  args: Record<string, never>,
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const result = await callApi('fetchContactList');

    if (!result || !result.users) {
      return {
        content: [
          {
            type: 'text',
            text: '[]',
          },
        ],
      };
    }

    const contactIds = result.users.map((user) => user.id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(contactIds, undefined, 2),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'get_contact_ids',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CONTACT,
    );
  }
}
