/**
 * Export Contacts tool - Export all contacts as a JSON string
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';
import { formatEntity } from '../telegramApi';

export const tool: MCPTool = {
  name: 'export_contacts',
  description: 'Export all contacts as a JSON string',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function exportContacts(
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

    const contacts = result.users.map(formatEntity);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(contacts, undefined, 2),
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'export_contacts',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CONTACT,
    );
  }
}
