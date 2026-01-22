import type { ActionReturnType } from '../../types';
import { LeftColumnContent } from '../../../types';

import { getCurrentTabId } from '../../../util/establishMultitabRole';
import { addActionHandler } from '../../index';
import { setAlphahumanActiveThreadId } from '../../reducers/alphahuman';
import { updateCurrentMessageList } from '../../reducers/messages';
import { updateTabState } from '../../reducers/tabs';
import { selectTabState } from '../../selectors';

addActionHandler('openAlphaHumanThread', (global, actions, payload): ActionReturnType => {
  const { threadId, tabId = getCurrentTabId() } = payload;

  // Close other views (mutual exclusion)
  actions.closeSummarizePage({ tabId });

  // Get current tab state
  const tabState = selectTabState(global, tabId);
  const isAgentChatAlreadyOpen = tabState.agentChat.isOpen;
  const isLeftColumnShowingThreads = tabState.leftColumn.contentKey === LeftColumnContent.Threads;

  // If thread is clicked from left column (Threads menu is already showing),
  // close SmartChatScreen and open ConversationView
  // Otherwise, if SmartChatScreen is already open, keep it open (don't switch views)
  if (isLeftColumnShowingThreads) {
    // Thread clicked from left column - close SmartChatScreen and open ConversationView
    if (isAgentChatAlreadyOpen) {
      actions.toggleAgentChat({ force: false, tabId });
    }
    // Set view mode to alphaHumanThread (ConversationView)
    global = updateTabState(global, { middleColumnView: 'alphaHumanThread' }, tabId);
    // Clear current message list when opening alpha human thread
    global = updateCurrentMessageList(global, undefined, undefined, undefined, undefined, undefined, tabId);
  } else {
    // Called from other places (e.g., SmartChatScreen message sending)
    // Open agent chat if not already open
    if (!isAgentChatAlreadyOpen) {
      actions.toggleAgentChat({ force: true, tabId });
    }

    // Open left AlphahumanSidebar if not already showing
    // Only switch to Threads menu if agentChat is not already open (to avoid disrupting SmartChatScreen)
    if (!isAgentChatAlreadyOpen && !isLeftColumnShowingThreads) {
      actions.openLeftColumnContent({ contentKey: LeftColumnContent.Threads, tabId });
    }

    // Only set view mode to alphaHumanThread if agentChat is not already open
    // If agentChat is already open (SmartChatScreen is visible), keep the current middle column view
    // to avoid switching from SmartChatScreen to ConversationView
    if (!isAgentChatAlreadyOpen) {
      global = updateTabState(global, { middleColumnView: 'alphaHumanThread' }, tabId);
      // Clear current message list when opening alpha human thread
      global = updateCurrentMessageList(global, undefined, undefined, undefined, undefined, undefined, tabId);
    }
  }

  // Set alphahuman active thread ID (removed agentThreadId from tabState)
  // This is always needed so the correct thread is displayed in SmartChatScreen or ConversationView
  global = setAlphahumanActiveThreadId(global, threadId.toString());

  return global;
});

addActionHandler('closeAlphaHumanThread', (global, actions, payload): ActionReturnType => {
  const { tabId = getCurrentTabId() } = payload || {};
  // Clear alphahuman active thread ID (removed agentThreadId from tabState)
  global = setAlphahumanActiveThreadId(global, undefined);
  // Clear view mode if it was alphaHumanThread
  const tabState = global.byTabId[tabId];
  if (tabState?.middleColumnView === 'alphaHumanThread') {
    global = updateTabState(global, { middleColumnView: undefined }, tabId);
  }
  return global;
});
