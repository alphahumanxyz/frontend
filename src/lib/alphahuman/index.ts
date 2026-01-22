/*
 * AI Socket Manager
 * Manages WebSocket connection to backend for AI features
 */

import { io, type Socket } from 'socket.io-client';
import { getActions, getGlobal, setGlobal } from '../../global';

import type { AgentUpdate, AlphaHumanManagerState, StreamMessageRequest } from './types';

import { BACKEND_API_URL } from '../../config';
import { updateAlphahuman } from '../../global/reducers/alphahuman';
import { log } from './logger';
import { initMCPServer, updateMCPServerSocket } from './mcp';

// Get backend URL from environment or default
const getBackendUrl = (): string => BACKEND_API_URL || '';

class AlphaHumanManager {
  private socket: Socket | undefined = undefined;
  private backendUrl: string = getBackendUrl();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;

  public state: AlphaHumanManagerState = 'disconnected';

  public getState(): AlphaHumanManagerState {
    return this.state;
  }

  /**
   * Update state and emit state change event
   * @param newState - The new state to set
   */
  private setState(newState: typeof this.state): void {
    if (this.state === newState) return; // No change, skip event

    const oldState = this.state;
    this.state = newState;
    log('STATE', `State changed: ${oldState} -> ${newState}`);

    // Emit state change via action
    getActions().updateAlphaHumanSocketState({ state: newState });
  }

  /**
   * Login to backend and get JWT token
   * Only connects if JWT token is present
   * @returns Promise that resolves when login is complete
   */
  public login(): void {
    log('CONNECTING', 'Login to backend');
    try {
      // Get JWT token from storage
      const jwtToken = this.getJwtToken();

      if (!jwtToken) {
        log('AUTH ERROR', 'No JWT token found');
        this.setState('jwt_missing');
        return;
      }

      // JWT token is present, connect to WebSocket
      this.connect(jwtToken);
    } catch (error) {
      log('AUTH ERROR', 'Login failed:', error);
      this.setState('jwt_invalid');
      throw error;
    }
  }

  public updateJwtAndLogin(jwtToken: string): void {
    log('REQUEST', 'Updating JWT token and logging in');
    this.saveJwtTokenToSession(jwtToken);
    this.login();
  }

  private connect(jwtToken: string): void {
    if (this.socket?.connected) {
      log('CONNECTED', 'Socket already connected');
      return;
    }

    if (!jwtToken) {
      log('AUTH ERROR', 'Cannot connect: JWT token is missing');
      this.setState('jwt_missing');
      return;
    }

    // Validate JWT token structure and expiration
    if (!this.validateJwtToken(jwtToken)) {
      return;
    }

    // Log token info for debugging (first 20 chars only for security)
    const tokenPreview = jwtToken.substring(0, 20) + '...';
    log('CONNECTING', `Connecting to backend at ${this.backendUrl} with token: ${tokenPreview}`);

    const url = this.backendUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    this.socket = io(url, {
      auth: { token: jwtToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      autoConnect: true,
      forceNew: true, // Force new connection (close any existing)
      path: '/socket.io/', // Explicit path for socket.io
    });

    this.setupEventHandlers();
    this.socket.connect();
  }

  /**
   * Validate JWT token structure and expiration
   * @returns true if token is valid, false otherwise
   */
  private validateJwtToken(jwtToken: string): boolean {
    try {
      const parts = jwtToken.split('.');
      if (parts.length !== 3) {
        log('AUTH ERROR', 'Invalid JWT token format: expected 3 parts, got', parts.length);
        this.setState('jwt_invalid');
        return false;
      }

      const payload = JSON.parse(atob(parts[1]));
      log('REQUEST', 'JWT token decoded:', {
        tgUserId: payload.tgUserId,
        exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'missing',
        iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'missing',
      });

      if (!payload.tgUserId) {
        log('AUTH ERROR', 'JWT token missing tgUserId in payload:', payload);
        this.setState('jwt_invalid');
        return false;
      }

      // Check if token is expired
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        log('AUTH ERROR', 'JWT token is expired');
        this.setState('jwt_invalid');
        return false;
      }

      return true;
    } catch (error) {
      log('AUTH ERROR', 'Failed to decode JWT token:', error);
      this.setState('jwt_invalid');
      return false;
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      log('CONNECTED', 'Connected to backend');
      // Update MCP server socket on reconnection
      updateMCPServerSocket(this.socket);
      // State will be updated to 'connected' after magic word verification in verifyMagicWord
      // The connect event itself doesn't need a separate state update as verifyMagicWord handles it
    });

    this.socket.on('disconnect', (reason: string) => {
      log('DISCONNECTED', 'Disconnected from backend:', reason);

      // If disconnected before connection established, likely JWT validation failed
      if (reason === 'io server disconnect' || reason === 'transport close') {
        log('AUTH ERROR', 'Socket was disconnected by server - likely JWT validation failed');
        this.setState('jwt_invalid');
      } else {
        // Dispatch action for disconnect event (setState already does this via updateAiSocketState)
        this.setState('disconnected');
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      this.reconnectAttempts++;
      log('CONNECTION ERROR', 'Connection error:', error.message);
      log('CONNECTION ERROR', 'Backend URL:', this.backendUrl);

      // Check if error indicates server not reachable or authentication failure
      const isConnectionError = error.message.includes('xhr poll error')
        || error.message.includes('websocket error')
        || error.message.includes('timeout')
        || error.message.includes('ECONNREFUSED');
      if (isConnectionError) {
        log('CONNECTION ERROR', `Cannot reach backend at ${this.backendUrl}. Is the server running?`);
      }

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        log('CONNECTION ERROR', 'Max reconnection attempts reached');
        // Dispatch action for max reconnection attempts (setState already does this)
        this.setState('jwt_invalid');
      }
    });

    // Backend emits error events with { requestId: string, message: string, status: number }
    this.socket.on('error', (error: { requestId?: string; message: string; status: number }) => {
      const requestIdText = error.requestId ? `RequestId: ${error.requestId}` : '';
      log('BACKEND ERROR', error.message, `Status: ${error.status}`, requestIdText);

      // Dispatch action for backend error
      getActions().onAlphaHumanBackendError({ error });

      // Check if error is authentication-related
      if (error.status === 401 || error.status === 403) {
        // Dispatch action for auth error (setState already does this)
        this.setState('jwt_invalid');
      }
    });

    // Setup agent updates listener
    this.socket.on('agentUpdates', (data: AgentUpdate) => {
      log('UPDATE', 'Received agent updates:', data);

      // Dispatch action for agent streaming update
      getActions().onAlphaHumanAgentStreamingUpdate({ update: data });
    });

    // Initialize MCP server
    initMCPServer(this.socket);
  }

  /**
   * Stream a message from user to agent with real-time updates
   * Sends a user message to the agent and receives streaming responses
   * @param request - Stream message request with threadId and content
   * @returns Promise that resolves with messageId when stream completes
   */
  public async streamMessageForUser(request: StreamMessageRequest): Promise<string> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    const requestId = crypto.randomUUID();
    log('REQUEST', 'Streaming message:', { requestId, threadId: request.threadId });

    return new Promise((resolve, reject) => {
      const STREAM_TIMEOUT_MS = 60000; // 60 seconds
      let messageId: string | undefined;
      let isResolved = false;

      // Listen for stream completion
      const onComplete = (update: AgentUpdate) => {
        if (update.eventType === 'complete') {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
            this.socket?.off('agentUpdates', onComplete);
            resolve(messageId ?? '');
          }
        } else if (update.eventType === 'error') {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
            this.socket?.off('agentUpdates', onComplete);
            reject(new Error(update.message?.content ?? 'Stream error'));
          }
        }
      };

      // Set timeout for stream completion
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          this.socket?.off('agentUpdates', onComplete);
          reject(new Error('Stream timeout'));
        }
      }, STREAM_TIMEOUT_MS);

      // Listen for agent updates
      if (this.socket) {
        this.socket.on('agentUpdates', onComplete);

        // Start streaming
        this.socket.emit('streamMessageForUser', {
          requestId,
          data: {
            threadId: request.threadId,
            content: request.content,
          },
        });
      }
    });
  }

  public disconnect(): void {
    if (this.socket) {
      log('DISCONNECTED', 'Disconnecting socket');
      this.socket.disconnect();
      this.socket = undefined;
    }
  }

  public clear(): void {
    this.disconnect();
    this.saveJwtTokenToSession(undefined);
  }

  /**
   * Get the current JWT token (public method)
   */
  public getJwtToken(): string | undefined {
    return this.loadJwtTokenLocally();
  }

  /**
   * Check if user is authenticated (has JWT token)
   */
  public isAuthenticated(): boolean {
    const jwtToken = this.getJwtToken();
    return Boolean(jwtToken);
  }

  /**
   * Load JWT token from global state (preferred) or storage (fallback for backward compatibility)
   */
  private loadJwtTokenLocally(): string | undefined {
    try {
      // Try global state first
      const globalToken = getGlobal().alphahuman?.jwtToken;
      if (globalToken && typeof globalToken === 'string') {
        return globalToken;
      }

      return undefined;
    } catch (error) {
      log('AUTH ERROR', 'Error loading JWT token:', error);
      return undefined;
    }
  }

  /**
   * Save JWT token to global state (public method for message listener)
   */
  public saveJwtTokenToSession(jwtToken: string | undefined): void {
    try {
      let global = getGlobal();
      global = updateAlphahuman(global, { jwtToken });
      setGlobal(global);
      log('REQUEST', 'JWT token saved to global state');
    } catch (error) {
      log('AUTH ERROR', 'Error saving JWT token to global state:', error);
      throw error;
    }
  }
}

// Singleton instance
let socketManagerInstance: AlphaHumanManager | undefined = undefined;

export function getAiSocketManager(): AlphaHumanManager {
  if (!socketManagerInstance) socketManagerInstance = new AlphaHumanManager();
  return socketManagerInstance;
}

export default getAiSocketManager;
