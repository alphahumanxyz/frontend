import type { SummarizeChatInfo, SummarizeState, ChatSummary } from '../../types';
import type { GlobalState, TabArgs, TabState } from '../types';

import { getCurrentTabId } from '../../util/establishMultitabRole';
import { updateTabState } from './tabs';

export function initializeSummarizeState<T extends GlobalState>(
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): Partial<TabState> {
  return {
    summarize: {
      isOpen: false,
      isSetupComplete: false,
      selectedChatIds: [],
      summaries: [],
      isLoadingBusiestChats: false,
      isLoadingSummaries: false,
      includeArchived: false,
    },
  };
}

export function updateSummarizeState<T extends GlobalState>(
  global: T,
  update: Partial<SummarizeState>,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): T {
  const currentSummarize = global.byTabId[tabId]?.summarize || {
    isOpen: false,
    isSetupComplete: false,
    selectedChatIds: [],
    summaries: [],
    isLoadingBusiestChats: false,
    isLoadingSummaries: false,
    includeArchived: false,
    selectedDate: undefined,
  };

  return updateTabState(global, {
    summarize: {
      ...currentSummarize,
      ...update,
    },
  }, tabId);
}

export function setBusiestChats<T extends GlobalState>(
  global: T,
  busiestChats: SummarizeChatInfo[],
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): T {
  return updateSummarizeState(global, {
    busiestChats,
    isLoadingBusiestChats: false,
  }, tabId);
}

export function setBusiestChatsLoading<T extends GlobalState>(
  global: T,
  isLoading: boolean,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): T {
  return updateSummarizeState(global, {
    isLoadingBusiestChats: isLoading,
  }, tabId);
}

export function selectChatsForSummarize<T extends GlobalState>(
  global: T,
  chatIds: string[],
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): T {
  return updateSummarizeState(global, {
    selectedChatIds: chatIds,
  }, tabId);
}

export function completeSummarizeSetup<T extends GlobalState>(
  global: T,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): T {
  return updateSummarizeState(global, {
    isSetupComplete: true,
  }, tabId);
}

export function resetSummarizeSetup<T extends GlobalState>(
  global: T,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): T {
  return updateSummarizeState(global, {
    isSetupComplete: false,
    summaries: [],
    selectedChatIds: [],
    selectedDate: undefined,
  }, tabId);
}

export function setSummarizeSelectedDate<T extends GlobalState>(
  global: T,
  date: number | undefined,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): T {
  return updateSummarizeState(global, {
    selectedDate: date,
  }, tabId);
}

export function setSummaries<T extends GlobalState>(
  global: T,
  summaries: ChatSummary[],
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): T {
  return updateSummarizeState(global, {
    summaries,
    isLoadingSummaries: false,
  }, tabId);
}

export function setSummariesLoading<T extends GlobalState>(
  global: T,
  isLoading: boolean,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): T {
  return updateSummarizeState(global, {
    isLoadingSummaries: isLoading,
  }, tabId);
}

export function updateSummarizeSearchQuery<T extends GlobalState>(
  global: T,
  query: string,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): T {
  return updateSummarizeState(global, {
    searchQuery: query,
  }, tabId);
}

export function markSummaryAsRead<T extends GlobalState>(
  global: T,
  chatId: string,
  date: number,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): T {
  const summarize = global.byTabId[tabId]?.summarize;
  if (!summarize) return global;

  const summaries = summarize.summaries.map((summary) => {
    if (summary.chatId === chatId && summary.date === date) {
      return { ...summary, isRead: true };
    }
    return summary;
  });

  return updateSummarizeState(global, {
    summaries,
  }, tabId);
}

export function setIncludeArchived<T extends GlobalState>(
  global: T,
  includeArchived: boolean,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): T {
  return updateSummarizeState(global, {
    includeArchived,
  }, tabId);
}
