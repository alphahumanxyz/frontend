import type { Socket } from 'socket.io-client';
import { useCallback, useEffect, useRef, useState } from '../../lib/teact/teact';

import type { AgentUpdate, StreamMessageRequest } from '../../lib/alphahuman/types';

import getAiSocketManager from '../../lib/alphahuman';

export interface UseAlphahumanChatCallbacks {
  onChunk?: (content: string, update: AgentUpdate) => void;
  onIntermediate?: (content: string, update: AgentUpdate) => void;
  onToolStart?: (toolName: string, toolInput: Record<string, unknown>, update: AgentUpdate) => void;
  onToolEnd?: (toolName: string, update: AgentUpdate) => void;
  onComplete?: (messageId: string, content: string, update: AgentUpdate) => void;
  onError?: (error: string, update: AgentUpdate) => void;
}

export interface UseAlphahumanChatState {
  streamingContent: string;
  activeTools: Set<string>;
  isStreaming: boolean;
  currentMessageId: string | undefined;
  currentThreadId: string | undefined;
}

export interface UseAlphahumanChatReturn extends UseAlphahumanChatState {
  submitMessage: (request: StreamMessageRequest) => Promise<string>;
  isLoading: boolean;
  error: Error | undefined;
}

/**
 * Hook for handling all chat communications via alphahuman socket
 * Wraps and encapsulates the entire streamMessageForUser socket flow
 */
export default function useAlphahumanChat(
  callbacks?: UseAlphahumanChatCallbacks,
): UseAlphahumanChatReturn {
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [activeTools, setActiveTools] = useState<Set<string>>(() => new Set());
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | undefined>();
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>();

  const callbacksRef = useRef(callbacks);
  const socketRef = useRef<Socket | undefined>();
  const isStreamingRef = useRef<boolean>(false);
  const requestIdRef = useRef<string | undefined>();

  // Update callbacks ref when callbacks change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Setup agent updates listener
  useEffect(() => {
    const manager = getAiSocketManager();
    const socket = (manager as any).socket as Socket | undefined;

    if (!socket) {
      return;
    }

    socketRef.current = socket;

    const handleAgentUpdate = (update: AgentUpdate) => {
      // Only process updates if we're currently streaming
      if (!isStreamingRef.current) {
        return;
      }

      const {
        onChunk,
        onIntermediate,
        onToolStart,
        onToolEnd,
        onComplete,
        onError,
      } = callbacksRef.current || {};

      // Update thread ID if provided
      if (update.threadId) {
        setCurrentThreadId(update.threadId);
      }

      // Handle different event types
      switch (update.eventType) {
        case 'chunk': {
          if (update.content) {
            setStreamingContent((prev) => {
              const newContent = prev + update.content!;
              onChunk?.(update.content!, update);
              return newContent;
            });
          }
          break;
        }

        case 'intermediate': {
          if (update.content) {
            const messageId = update.messageId || `intermediate-${update.responseIndex || Date.now()}`;
            setCurrentMessageId(messageId);
            setStreamingContent(''); // Clear streaming content after intermediate
            onIntermediate?.(update.content, update);
          }
          break;
        }

        case 'toolStart': {
          if (update.toolName) {
            setActiveTools((prev) => new Set(prev).add(update.toolName!));
            onToolStart?.(update.toolName, update.toolInput || {}, update);
          }
          break;
        }

        case 'toolEnd': {
          if (update.toolName) {
            setActiveTools((prev) => {
              const next = new Set(prev);
              next.delete(update.toolName!);
              return next;
            });
            onToolEnd?.(update.toolName, update);
          }
          break;
        }

        case 'complete': {
          const messageId = update.messageId;

          setStreamingContent((prev) => {
            const finalContent = update.content || prev;
            if (messageId) {
              onComplete?.(messageId, finalContent, update);
            }
            return '';
          });

          if (messageId) {
            setCurrentMessageId(messageId);
          }

          setActiveTools(new Set());
          setIsStreaming(false);
          isStreamingRef.current = false;
          break;
        }

        case 'error': {
          const errorMessage = update.content || 'Stream error';
          setError(new Error(errorMessage));
          setStreamingContent('');
          setActiveTools(new Set());
          setIsStreaming(false);
          isStreamingRef.current = false;
          onError?.(errorMessage, update);
          break;
        }
      }
    };

    socket.on('agentUpdates', handleAgentUpdate);

    return () => {
      socket.off('agentUpdates', handleAgentUpdate);
    };
  }, []);

  const submitMessage = useCallback(
    async (request: StreamMessageRequest): Promise<string> => {
      const manager = getAiSocketManager();

      // Reset state
      setStreamingContent('');
      setActiveTools(new Set());
      setError(undefined);
      setIsLoading(true);
      setIsStreaming(true);
      isStreamingRef.current = true;
      setCurrentThreadId(request.threadId);

      try {
        // Generate request ID for tracking (if needed)
        requestIdRef.current = crypto.randomUUID();

        // Stream message via socket
        const messageId = await manager.streamMessageForUser(request);

        setCurrentMessageId(messageId);
        setIsLoading(false);
        setIsStreaming(false);
        isStreamingRef.current = false;

        return messageId;
      } catch (err) {
        const newError = err instanceof Error ? err : new Error('Failed to stream message');
        setError(newError);
        setIsLoading(false);
        setIsStreaming(false);
        isStreamingRef.current = false;
        setStreamingContent('');
        setActiveTools(new Set());

        throw newError;
      }
    },
    [],
  );

  return {
    streamingContent,
    activeTools,
    isStreaming,
    currentMessageId,
    currentThreadId,
    submitMessage,
    isLoading,
    error,
  };
}
