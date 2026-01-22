import { useCallback, useState } from '../../lib/teact/teact';

import {
  type PurgeDataRequest,
  type PurgeDataResponse,
  purgeDataRest,
} from '../../lib/alphahuman/rest';

interface UseAlphahumanPurgeDataReturn {
  purgeData: (data: PurgeDataRequest) => Promise<PurgeDataResponse>;
  isLoading: boolean;
  error: Error | undefined;
}

/**
 * Hook for purging data via alphahuman API
 */
export default function useAlphahumanPurgeData(): UseAlphahumanPurgeDataReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const purgeData = useCallback(async (data: PurgeDataRequest): Promise<PurgeDataResponse> => {
    setIsLoading(true);
    setError(undefined);
    try {
      const response = await purgeDataRest(data);
      setIsLoading(false);
      return response;
    } catch (err) {
      const newError = err instanceof Error ? err : new Error('Failed to purge data');
      setError(newError);
      setIsLoading(false);
      throw newError;
    }
  }, []);

  return {
    purgeData,
    isLoading,
    error,
  };
}
