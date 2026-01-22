import { useCallback, useState } from '../../lib/teact/teact';

import {
  type UpdateMagicWordRequest,
  type UpdateMagicWordResponse,
  updateMagicWordRest,
} from '../../lib/alphahuman/rest';

interface UseAlphahumanUpdateMagicWordReturn {
  updateMagicWord: (data: UpdateMagicWordRequest) => Promise<UpdateMagicWordResponse>;
  isLoading: boolean;
  error: Error | undefined;
}

/**
 * Hook for updating magic word via alphahuman API
 */
export default function useAlphahumanUpdateMagicWord(): UseAlphahumanUpdateMagicWordReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const updateMagicWord = useCallback(async (data: UpdateMagicWordRequest): Promise<UpdateMagicWordResponse> => {
    setIsLoading(true);
    setError(undefined);
    try {
      const response = await updateMagicWordRest(data);
      setIsLoading(false);
      return response;
    } catch (err) {
      const newError = err instanceof Error ? err : new Error('Failed to update magic word');
      setError(newError);
      setIsLoading(false);
      throw newError;
    }
  }, []);

  return {
    updateMagicWord,
    isLoading,
    error,
  };
}
