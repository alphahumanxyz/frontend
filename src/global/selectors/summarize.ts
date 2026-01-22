import type { ChatSummary, SummarizeChatInfo, SummarizeState } from '../../types';
import type { GlobalState, TabArgs } from '../types';

import { getCurrentTabId } from '../../util/establishMultitabRole';
import { selectTabState } from './tabs';

export function selectSummarizeState<T extends GlobalState>(
  global: T,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): SummarizeState {
  return selectTabState(global, tabId).summarize;
}

export function selectIsSummarizeSetupComplete<T extends GlobalState>(
  global: T,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): boolean {
  return selectSummarizeState(global, tabId).isSetupComplete;
}

export function selectBusiestChats<T extends GlobalState>(
  global: T,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): SummarizeChatInfo[] | undefined {
  return selectSummarizeState(global, tabId).busiestChats;
}

export function selectIsLoadingBusiestChats<T extends GlobalState>(
  global: T,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): boolean {
  return selectSummarizeState(global, tabId).isLoadingBusiestChats ?? false;
}

export function selectSelectedChatIds<T extends GlobalState>(
  global: T,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): string[] {
  return selectSummarizeState(global, tabId).selectedChatIds;
}

export function selectSummaries<T extends GlobalState>(
  global: T,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): ChatSummary[] {
  return selectSummarizeState(global, tabId).summaries;
}

export function selectFilteredSummaries<T extends GlobalState>(
  global: T,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): ChatSummary[] {
  const { summaries, searchQuery } = selectSummarizeState(global, tabId);

  if (!searchQuery) {
    return summaries;
  }

  const query = searchQuery.toLowerCase();
  return summaries.filter((summary) => {
    const chat = global.chats.byId[summary.chatId];
    const chatTitle = chat?.title?.toLowerCase() || '';
    const contentText = summary.content.paragraphs.join(' ').toLowerCase();
    return chatTitle.includes(query) || contentText.includes(query);
  });
}

export function selectIsLoadingSummaries<T extends GlobalState>(
  global: T,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): boolean {
  return selectSummarizeState(global, tabId).isLoadingSummaries ?? false;
}

export function selectSummarizeSearchQuery<T extends GlobalState>(
  global: T,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): string | undefined {
  return selectSummarizeState(global, tabId).searchQuery;
}

export function selectIncludeArchived<T extends GlobalState>(
  global: T,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): boolean {
  return selectSummarizeState(global, tabId).includeArchived ?? false;
}

export function selectIsSummarizePageOpen<T extends GlobalState>(
  global: T,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): boolean {
  // Use middleColumnView to determine if page is open (mutual exclusion)
  const tabState = selectTabState(global, tabId);
  return tabState.middleColumnView === 'summarize';
}

export function selectSummarizeSelectedDate<T extends GlobalState>(
  global: T,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): number | undefined {
  return selectSummarizeState(global, tabId).selectedDate;
}
