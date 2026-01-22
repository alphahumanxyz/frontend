/**
 * REST API controllers for Telegram endpoints
 * These controllers make HTTP requests to the backend REST API
 */

export { getMeRest, type GetMeResponse } from './getMe';
export {
  getHighlightsRest,
  type GetHighlightsResponse,
  type HighlightsTimeframe,
  type Highlight,
} from './getHighlights';
export { getThreadsRest, type GetThreadsResponse, type AlphahumanThread } from './getThreads';
export { createThreadRest, type CreateThreadResponse } from './createThread';
export {
  getThreadMessagesRest,
  type GetThreadMessagesResponse,
} from './getThreadMessages';
export {
  updateMagicWordRest,
  type UpdateMagicWordRequest,
  type UpdateMagicWordResponse,
} from './updateMagicWord';
export {
  updateDeletePolicyRest,
  type UpdateDeletePolicyRequest,
  type UpdateDeletePolicyResponse,
} from './updateDeletePolicy';
export { purgeDataRest, type PurgeDataRequest, type PurgeDataResponse } from './purgeData';
export {
  createLoginTokenRest,
  consumeLoginTokenRest,
  type CreateLoginTokenResponse,
  type ConsumeLoginTokenResponse,
} from './loginTokens';
export { connectNotionRest, type NotionOAuthResponse } from './notionAuth';
export { connectGoogleRest, type GoogleOAuthResponse } from './googleAuth';
