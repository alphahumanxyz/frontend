/**
 * Import Contacts tool - Import a list of contacts
 */

import type { GlobalState } from '../../../../global/types';
import type { SocketIOMCPTransportImpl } from '../transport';
import type { MCPTool, MCPToolResult } from '../types';

import { callApi } from '../../../../api/gramjs/worker/connector';
import { ErrorCategory, logAndFormatError } from '../errorHandler';

export const tool: MCPTool = {
  name: 'import_contacts',
  description: 'Import a list of contacts. Each contact should be a dict with phone, first_name, last_name.',
  inputSchema: {
    type: 'object',
    properties: {
      contacts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            phone: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
          },
          required: ['phone', 'first_name'],
        },
        description: 'List of contacts to import',
      },
    },
    required: ['contacts'],
  },
};

export async function importContacts(
  args: { contacts: Array<{ phone: string; first_name: string; last_name?: string }> },
  context: { global: GlobalState; transport: SocketIOMCPTransportImpl },
): Promise<MCPToolResult> {
  try {
    const { contacts } = args;

    let importedCount = 0;
    for (const contact of contacts) {
      const result = await callApi('importContact', {
        phone: contact.phone,
        firstName: contact.first_name,
        lastName: contact.last_name || '',
      });

      if (result) {
        importedCount++;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Imported ${importedCount} contacts.`,
        },
      ],
    };
  } catch (error) {
    return logAndFormatError(
      'import_contacts',
      error instanceof Error ? error : new Error(String(error)),
      ErrorCategory.CONTACT,
    );
  }
}
