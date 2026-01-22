import type { ActionReturnType } from '../../types';

import { getCurrentTabId } from '../../../util/establishMultitabRole';
import { addActionHandler, setGlobal } from '../../index';
import {
  initializeSummarizeState,
  markSummaryAsRead,
  resetSummarizeSetup,
  setIncludeArchived,
  setSummarizeSelectedDate,
  updateSummarizeSearchQuery,
  updateSummarizeState,
} from '../../reducers';
import { updateCurrentMessageList } from '../../reducers/messages';
import { updateTabState } from '../../reducers/tabs';
import { selectTabState } from '../../selectors';

addActionHandler('openSummarizePage', (global, actions, payload): ActionReturnType => {
  const { tabId = getCurrentTabId() } = payload || {};
  const tabState = selectTabState(global, tabId);

  // Close other views (mutual exclusion)
  actions.closeAlphaHumanThread({ tabId });

  // Set view mode to summarize
  global = updateTabState(global, { middleColumnView: 'summarize' }, tabId);

  // Clear current message list when opening summarize page
  global = updateCurrentMessageList(global, undefined, undefined, undefined, undefined, undefined, tabId);

  if (!tabState.summarize) {
    global = {
      ...global,
      byTabId: {
        ...global.byTabId,
        [tabId]: {
          ...tabState,
          ...initializeSummarizeState(tabId),
        },
      },
    };
  }

  // Mark as open
  global = updateSummarizeState(global, { isOpen: true }, tabId);

  const updatedTabState = selectTabState(global, tabId);
  if (!updatedTabState.summarize?.isSetupComplete) {
    actions.fetchBusiestChats({ tabId });
  } else if (updatedTabState.summarize.selectedChatIds.length > 0) {
    actions.generateSummaries({ tabId });
  }

  return global;
});

addActionHandler('closeSummarizePage', (global, actions, payload): ActionReturnType => {
  const { tabId = getCurrentTabId() } = payload || {};
  // Mark as closed and clear view mode if it was summarize
  global = updateSummarizeState(global, { isOpen: false }, tabId);
  const tabState = selectTabState(global, tabId);
  if (tabState.middleColumnView === 'summarize') {
    global = updateTabState(global, { middleColumnView: undefined }, tabId);
  }
  return global;
});

addActionHandler('updateSummarizeSearchQuery', (global, actions, payload): ActionReturnType => {
  const { query, tabId = getCurrentTabId() } = payload;
  return updateSummarizeSearchQuery(global, query, tabId);
});

addActionHandler('markSummaryAsRead', (global, actions, payload): ActionReturnType => {
  const { chatId, date, tabId = getCurrentTabId() } = payload;
  return markSummaryAsRead(global, chatId, date, tabId);
});

addActionHandler('setIncludeArchived', (global, actions, payload): ActionReturnType => {
  const { includeArchived, tabId = getCurrentTabId() } = payload;
  global = setIncludeArchived(global, includeArchived, tabId);
  setGlobal(global);
  // Refetch busiest chats when toggling archived, passing the new value directly
  actions.fetchBusiestChats({ tabId, includeArchived });
  return global;
});

addActionHandler('resetSummarizeSetup', (global, actions, payload): ActionReturnType => {
  const { tabId = getCurrentTabId() } = payload || {};
  global = resetSummarizeSetup(global, tabId);
  // Refetch busiest chats to show the selection list again
  actions.fetchBusiestChats({ tabId });
  return global;
});

addActionHandler('setSummarizeSelectedDate', (global, actions, payload): ActionReturnType => {
  const { date, tabId = getCurrentTabId() } = payload;
  return setSummarizeSelectedDate(global, date, tabId);
});
