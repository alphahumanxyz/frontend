import { useCallback, useEffect } from '../../lib/teact/teact';

import { getHighlightsRest, type HighlightsTimeframe } from '../../lib/alphahuman/rest';
import useAlphahumanReducer from '../reducers/useAlphahumanReducer';

interface UseAlphahumanGetHighlightsOptions {
  timeframe: HighlightsTimeframe;
  autoFetch?: boolean;
}

interface UseAlphahumanGetHighlightsReturn {
  highlights: ReturnType<typeof useAlphahumanReducer>[0]['highlights'][HighlightsTimeframe];
  isLoading: boolean;
  error: Error | undefined;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing highlights from alphahuman API
 */
export default function useAlphahumanGetHighlights(
  options: UseAlphahumanGetHighlightsOptions,
): UseAlphahumanGetHighlightsReturn {
  const { timeframe, autoFetch = true } = options;
  const [state, dispatch] = useAlphahumanReducer();

  const fetchHighlights = useCallback(async () => {
    dispatch({ type: 'setHighlightsLoading', payload: { timeframe, loading: true } });
    try {
      const highlights = await getHighlightsRest(timeframe);
      dispatch({ type: 'setHighlights', payload: { timeframe, highlights } });
    } catch (error) {
      dispatch({
        type: 'setHighlightsError',
        payload: {
          timeframe,
          error: error instanceof Error ? error : new Error('Failed to fetch highlights'),
        },
      });
    }
  }, [timeframe, dispatch]);

  useEffect(() => {
    if (autoFetch) {
      const cachedHighlights = state.highlights[timeframe];
      const isLoading = state.highlightsLoading[timeframe] || false;
      const hasError = state.highlightsError[timeframe] !== undefined;

      if (!cachedHighlights || cachedHighlights.length === 0) {
        if (!isLoading && !hasError) {
          void fetchHighlights();
        }
      }
    }
  }, [autoFetch, timeframe, state.highlights, state.highlightsLoading, state.highlightsError, fetchHighlights]);

  return {
    highlights: state.highlights[timeframe] || [],
    isLoading: state.highlightsLoading[timeframe] || false,
    error: state.highlightsError[timeframe],
    refetch: fetchHighlights,
  };
}
