/**
 * Socket.IO transport for MCP server
 * Handles communication between frontend MCP server and backend MCP client
 */

import type { Socket } from 'socket.io-client';

import type { MCPRequest, MCPResponse, SocketIOMCPTransport } from './types';

import { log } from '../logger';

export class SocketIOMCPTransportImpl implements SocketIOMCPTransport {
  private socket: Socket | null | undefined;
  private requestHandlers = new Map<string | number, (response: MCPResponse) => void>();
  private eventPrefix = 'mcp:';

  constructor(socket: Socket | null | undefined) {
    this.socket = socket ?? undefined;
    this.setupEventHandlers();
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Listen for MCP responses from backend
    this.socket.on(`${this.eventPrefix}response`, (response: MCPResponse) => {
      const handler = this.requestHandlers.get(response.id);
      if (handler) {
        handler(response);
        this.requestHandlers.delete(response.id);
      }
    });
  }

  emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      log('WARN', 'Cannot emit MCP event: socket not connected', { event });
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`[MCP] Emitting ${event}`, data);
    this.socket.emit(`${this.eventPrefix}${event}`, data);
  }

  on(event: string, handler: (data: any) => void): void {
    if (!this.socket) return;

    const fullEvent = `${this.eventPrefix}${event}`;
    // eslint-disable-next-line no-console
    console.log(`[MCP] Listening to ${fullEvent}`);
    this.socket.on(fullEvent, handler);
  }

  off(event: string, handler: (data: any) => void): void {
    if (!this.socket) return;

    const fullEvent = `${this.eventPrefix}${event}`;
    this.socket.off(fullEvent, handler);
  }

  /**
   * Send an MCP request and wait for response
   */
  async request(request: MCPRequest, timeoutMs: number = 30000): Promise<MCPResponse> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    return new Promise<MCPResponse>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.requestHandlers.delete(request.id);
        reject(new Error(`MCP request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.requestHandlers.set(request.id, (response: MCPResponse) => {
        clearTimeout(timeout);
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response);
        }
      });

      this.emit('request', request);
    });
  }

  /**
   * Update socket instance (e.g., on reconnection)
   */
  updateSocket(socket: Socket | null | undefined): void {
    if (this.socket) {
      // Remove old handlers
      this.socket.off(`${this.eventPrefix}response`, this.handleResponse);
    }

    this.socket = socket ?? undefined;
    this.setupEventHandlers();
  }

  private handleResponse = (response: MCPResponse): void => {
    const handler = this.requestHandlers.get(response.id);
    if (handler) {
      handler(response);
      this.requestHandlers.delete(response.id);
    }
  };
}
