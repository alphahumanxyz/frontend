/**
 * Alphahuman API hooks
 * Hooks for interacting with the alphahuman REST API
 */

export { default as useAlphahumanChat } from './useAlphahumanChat';
export { default as useAlphahumanGetMe } from './useAlphahumanGetMe';
export { default as useAlphahumanGetThreads } from './useAlphahumanGetThreads';
export { default as useAlphahumanGetThreadMessages } from './useAlphahumanGetThreadMessages';
export { default as useAlphahumanGetHighlights } from './useAlphahumanGetHighlights';
export { default as useAlphahumanUpdateMagicWord } from './useAlphahumanUpdateMagicWord';
export { default as useAlphahumanUpdateDeletePolicy } from './useAlphahumanUpdateDeletePolicy';
export { default as useAlphahumanPurgeData } from './useAlphahumanPurgeData';

export type {
  UseAlphahumanChatCallbacks,
  UseAlphahumanChatState,
  UseAlphahumanChatReturn,
} from './useAlphahumanChat';
