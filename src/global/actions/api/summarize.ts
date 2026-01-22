import type { SummarizeChatInfo, ChatSummary } from '../../../types';
import type { ActionReturnType, GlobalState } from '../../types';

import type { ApiMessage } from '../../../api/types';

import { getCurrentTabId } from '../../../util/establishMultitabRole';
import { addActionHandler, getGlobal, setGlobal } from '../../index';
import {
  setBusiestChats,
  setBusiestChatsLoading,
  selectChatsForSummarize,
  completeSummarizeSetup,
  setSummaries,
  setSummariesLoading,
} from '../../reducers';
import { selectChatMessages, selectChat } from '../../selectors';
import { getMessageText } from '../../helpers';
import { isChatArchived } from '../../helpers/chats';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function getMessageCountForLast3Days(chatId: string): number {
  const global = getGlobal();
  const messages = selectChatMessages(global, chatId);
  if (!messages) return 0;

  const now = Date.now();
  const threeDaysAgo = now - THREE_DAYS_MS;

  return Object.values(messages).filter((message) => {
    return message.date * 1000 >= threeDaysAgo;
  }).length;
}

addActionHandler('fetchBusiestChats', async (global, actions, payload): Promise<void> => {
  const { tabId = getCurrentTabId(), includeArchived: includeArchivedParam } = payload || {};
  
  global = setBusiestChatsLoading(global, true, tabId);
  setGlobal(global);
  global = getGlobal();

  const tabState = global.byTabId[tabId];
  const includeArchived = includeArchivedParam !== undefined 
    ? includeArchivedParam 
    : (tabState?.summarize?.includeArchived ?? false);

  const chatIds = Object.keys(global.chats.byId);
  const chatInfoList: SummarizeChatInfo[] = [];

  for (const chatId of chatIds) {
    const chat = selectChat(global, chatId);
    if (!chat) continue;

    // Filter out archived chats if includeArchived is false
    if (!includeArchived && isChatArchived(chat)) {
      continue;
    }

    const messageCount = getMessageCountForLast3Days(chatId);
    if (messageCount > 0) {
      const messages = selectChatMessages(global, chatId);
      const lastMessage = messages ? Object.values(messages).sort((a, b) => b.date - a.date)[0] : undefined;
      
      chatInfoList.push({
        chatId,
        messageCount,
        lastMessageDate: lastMessage?.date,
      });
    }
  }

  chatInfoList.sort((a, b) => b.messageCount - a.messageCount);

  global = getGlobal();
  global = setBusiestChats(global, chatInfoList.slice(0, 20), tabId);
  setGlobal(global);
});

addActionHandler('selectChatsForSummarize', (global, actions, payload): ActionReturnType => {
  const { chatIds, tabId = getCurrentTabId() } = payload;
  return selectChatsForSummarize(global, chatIds, tabId);
});

addActionHandler('generateSummaries', async (global, actions, payload): Promise<void> => {
  const { tabId = getCurrentTabId() } = payload || {};
  const tabState = global.byTabId[tabId];
  
  if (!tabState.summarize) {
    return;
  }

  const { selectedChatIds, isSetupComplete } = tabState.summarize;

  if (!isSetupComplete) {
    global = completeSummarizeSetup(global, tabId);
    setGlobal(global);
    global = getGlobal();
  }

  if (selectedChatIds.length === 0) {
    return;
  }

  global = setSummariesLoading(global, true, tabId);
  setGlobal(global);
  global = getGlobal();

  const summaries: ChatSummary[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = Math.floor(today.getTime() / 1000);

  // Generate dummy data for multiple previous dates (last 10 days)
  const datesToGenerate = Array.from({ length: 10 }, (_, i) => {
    return todayTimestamp - (86400 * i);
  });

  for (const dateTimestamp of datesToGenerate) {
    for (const chatId of selectedChatIds) {
      const messages = selectChatMessages(global, chatId);
      
      // Get messages for this date range (within 3 days before the target date)
      let recentMessages: ApiMessage[] = [];
      if (messages) {
        recentMessages = Object.values(messages)
          .filter((msg) => msg.date >= dateTimestamp - 86400 * 3 && msg.date < dateTimestamp + 86400)
          .sort((a, b) => a.date - b.date);
      }

      // Generate summary content (use actual messages if available, otherwise generate dummy)
      let summaryContent;
      if (recentMessages.length > 0) {
        summaryContent = await generateSummaryContent(global, chatId, recentMessages);
      } else {
        // Generate dummy summary content
        const chat = selectChat(global, chatId);
        const chatTitle = chat?.title || 'Chat';
        summaryContent = {
          paragraphs: [
            `In ${chatTitle}, there was activity on this day. Team members discussed various topics and shared updates.`,
            `Key highlights from the conversation included important decisions and collaborative discussions.`,
            `The team continued to work together effectively, addressing questions and providing support as needed.`,
          ],
          actionItems: [],
          messageLinks: [],
        };
      }
      
      summaries.push({
        chatId,
        date: dateTimestamp,
        content: summaryContent,
        isRead: false,
      });
    }
  }

  global = getGlobal();
  global = setSummaries(global, summaries, tabId);
  setGlobal(global);
});

async function generateSummaryContent(
  global: GlobalState,
  chatId: string,
  messages: ApiMessage[]
): Promise<ChatSummary['content']> {
  const paragraphs: string[] = [];
  const actionItems: string[] = [];
  const messageLinks: ChatSummary['content']['messageLinks'] = [];

  if (messages.length === 0) {
    return { paragraphs: [], actionItems: [], messageLinks: [] };
  }

  const chat = selectChat(global, chatId);
  const chatTitle = chat?.title || 'Chat';

  const messageTexts = messages
    .map((msg) => {
      const text = getMessageText(msg);
      return text?.text || '';
    })
    .filter((text) => text.length > 0)
    .join(' ');

  if (messageTexts.length > 0) {
    const summary = `In ${chatTitle}, the team discussed various topics over the past few days. ${messageTexts.substring(0, 500)}...`;
    paragraphs.push(summary);
  }

  return {
    paragraphs,
    actionItems,
    messageLinks,
  };
}
