import { useCallback, useEffect } from '../../lib/teact/teact';

import { getMeRest } from '../../lib/alphahuman/rest';
import useAlphahumanReducer from '../reducers/useAlphahumanReducer';

interface UseAlphahumanGetMeOptions {
  autoFetch?: boolean;
}

interface UseAlphahumanGetMeReturn {
  me: ReturnType<typeof useAlphahumanReducer>[0]['me'];
  isLoading: boolean;
  error: Error | undefined;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing user data from alphahuman API
 */
export default function useAlphahumanGetMe(
  options: UseAlphahumanGetMeOptions = {},
): UseAlphahumanGetMeReturn {
  const { autoFetch = true } = options;
  const [state, dispatch] = useAlphahumanReducer();

  const fetchMe = useCallback(async () => {
    dispatch({ type: 'setMeLoading', payload: true });
    try {
      const me = await getMeRest();
      dispatch({ type: 'setMe', payload: me });
    } catch (error) {
      dispatch({
        type: 'setMeError',
        payload: error instanceof Error ? error : new Error('Failed to fetch user data'),
      });
    }
  }, [dispatch]);

  useEffect(() => {
    if (autoFetch && !state.me && !state.meLoading && !state.meError) {
      void fetchMe();
    }
  }, [autoFetch, state.me, state.meLoading, state.meError, fetchMe]);

  return {
    me: state.me,
    isLoading: state.meLoading,
    error: state.meError,
    refetch: fetchMe,
  };
}
