import { useCallback, useEffect } from '../../lib/teact/teact';

import { getThreadMessagesRest } from '../../lib/alphahuman/rest';
import useAlphahumanReducer from '../reducers/useAlphahumanReducer';

interface UseAlphahumanGetThreadMessagesOptions {
  threadId: string | undefined;
  autoFetch?: boolean;
}

interface UseAlphahumanGetThreadMessagesReturn {
  messages: ReturnType<typeof useAlphahumanReducer>[0]['threadMessages'][string] | undefined;
  isLoading: boolean;
  error: Error | undefined;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing thread messages from alphahuman API
 */
export default function useAlphahumanGetThreadMessages(
  options: UseAlphahumanGetThreadMessagesOptions,
): UseAlphahumanGetThreadMessagesReturn {
  const { threadId, autoFetch = true } = options;
  const [state, dispatch] = useAlphahumanReducer();

  const fetchMessages = useCallback(async () => {
    if (!threadId) return;

    dispatch({ type: 'setThreadMessagesLoading', payload: { threadId, loading: true } });
    try {
      const response = await getThreadMessagesRest(threadId);
      dispatch({
        type: 'setThreadMessages',
        payload: { threadId, messages: response.messages, count: response.count },
      });
    } catch (error) {
      dispatch({
        type: 'setThreadMessagesError',
        payload: {
          threadId,
          error: error instanceof Error ? error : new Error('Failed to fetch thread messages'),
        },
      });
    }
  }, [threadId, dispatch]);

  useEffect(() => {
    if (threadId && autoFetch) {
      const cachedMessages = state.threadMessages[threadId];
      const isLoading = state.threadMessagesLoading[threadId] || false;
      const hasError = state.threadMessagesError[threadId] !== undefined;

      if (!cachedMessages && !isLoading && !hasError) {
        void fetchMessages();
      }
    }
  }, [
    threadId, autoFetch, state.threadMessages, state.threadMessagesLoading,
    state.threadMessagesError, fetchMessages,
  ]);

  return {
    messages: threadId ? state.threadMessages[threadId] : undefined,
    isLoading: threadId ? (state.threadMessagesLoading[threadId] || false) : false,
    error: threadId ? state.threadMessagesError[threadId] : undefined,
    refetch: fetchMessages,
  };
}
