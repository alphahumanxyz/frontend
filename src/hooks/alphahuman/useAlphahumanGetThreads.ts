import { useCallback, useEffect } from '../../lib/teact/teact';

import { getThreadsRest } from '../../lib/alphahuman/rest';
import useAlphahumanReducer from '../reducers/useAlphahumanReducer';

interface UseAlphahumanGetThreadsOptions {
  autoFetch?: boolean;
}

interface UseAlphahumanGetThreadsReturn {
  threads: ReturnType<typeof useAlphahumanReducer>[0]['threads'];
  count: number;
  isLoading: boolean;
  error: Error | undefined;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing threads from alphahuman API
 */
export default function useAlphahumanGetThreads(
  options: UseAlphahumanGetThreadsOptions = {},
): UseAlphahumanGetThreadsReturn {
  const { autoFetch = true } = options;
  const [state, dispatch] = useAlphahumanReducer();

  const fetchThreads = useCallback(async () => {
    dispatch({ type: 'setThreadsLoading', payload: true });
    try {
      const response = await getThreadsRest();
      dispatch({ type: 'setThreads', payload: response });
    } catch (error) {
      dispatch({
        type: 'setThreadsError',
        payload: error instanceof Error ? error : new Error('Failed to fetch threads'),
      });
    }
  }, [dispatch]);

  useEffect(() => {
    if (autoFetch && state.threads.length === 0 && !state.threadsLoading && !state.threadsError) {
      void fetchThreads();
    }
  }, [autoFetch, state.threads.length, state.threadsLoading, state.threadsError, fetchThreads]);

  return {
    threads: state.threads,
    count: state.threadsCount,
    isLoading: state.threadsLoading,
    error: state.threadsError,
    refetch: fetchThreads,
  };
}
