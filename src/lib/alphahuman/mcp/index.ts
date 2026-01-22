/**
 * MCP Server for Telegram
 * Main entry point for MCP server integration
 */

import type { Socket } from 'socket.io-client';
import { getGlobal } from '../../../global';

import { MCPServer } from './server';

let mcpServerInstance: MCPServer | undefined;

/**
 * Initialize MCP server
 */
export function initMCPServer(socket: Socket | null | undefined): MCPServer {
  const global = getGlobal();
  mcpServerInstance = new MCPServer(socket, global);
  // eslint-disable-next-line no-console
  console.log('[MCP] MCP server initialized');
  return mcpServerInstance;
}

/**
 * Get MCP server instance
 */
export function getMCPServer(): MCPServer | undefined {
  return mcpServerInstance;
}

/**
 * Update MCP server socket (e.g., on reconnection)
 */
export function updateMCPServerSocket(socket: Socket | null | undefined): void {
  if (mcpServerInstance) {
    mcpServerInstance.updateSocket(socket);
    // eslint-disable-next-line no-console
    console.log('[MCP] MCP server socket updated');
  }
}

/**
 * Update MCP server global state
 */
export function updateMCPServerGlobal(): void {
  if (mcpServerInstance) {
    const global = getGlobal();
    mcpServerInstance.updateGlobal(global);
  }
}
