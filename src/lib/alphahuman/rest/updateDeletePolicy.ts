import { log } from '../logger';
import { makeRestRequest } from './restHelpers';

export interface UpdateDeletePolicyRequest {
  deleteThreadsAfterDays: number;
  deleteTelegramMessagesAfterDays: number;
}

export interface UpdateDeletePolicyResponse {
  deleteThreadsAfterDays: number;
  deleteTelegramMessagesAfterDays: number;
}

/**
 * Update delete policy settings for a Telegram user
 * REST API endpoint: PUT /telegram/delete-policy
 */
export async function updateDeletePolicyRest(
  data: UpdateDeletePolicyRequest,
): Promise<UpdateDeletePolicyResponse> {
  log('REQUEST', 'Updating delete policy via REST API');
  const response = await makeRestRequest<UpdateDeletePolicyRequest, UpdateDeletePolicyResponse>(
    'PUT',
    '/telegram/delete-policy',
    data,
  );
  log('RESPONSE', 'Delete policy updated:', response);
  return response;
}
