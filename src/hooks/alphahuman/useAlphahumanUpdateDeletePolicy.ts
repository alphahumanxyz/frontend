import { useCallback, useState } from '../../lib/teact/teact';

import {
  type UpdateDeletePolicyRequest,
  type UpdateDeletePolicyResponse,
  updateDeletePolicyRest,
} from '../../lib/alphahuman/rest';

interface UseAlphahumanUpdateDeletePolicyReturn {
  updateDeletePolicy: (data: UpdateDeletePolicyRequest) => Promise<UpdateDeletePolicyResponse>;
  isLoading: boolean;
  error: Error | undefined;
}

/**
 * Hook for updating delete policy via alphahuman API
 */
export default function useAlphahumanUpdateDeletePolicy(): UseAlphahumanUpdateDeletePolicyReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const updateDeletePolicy = useCallback(
    async (data: UpdateDeletePolicyRequest): Promise<UpdateDeletePolicyResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        const response = await updateDeletePolicyRest(data);
        setIsLoading(false);
        return response;
      } catch (err) {
        const newError = err instanceof Error ? err : new Error('Failed to update delete policy');
        setError(newError);
        setIsLoading(false);
        throw newError;
      }
    },
    [],
  );

  return {
    updateDeletePolicy,
    isLoading,
    error,
  };
}
