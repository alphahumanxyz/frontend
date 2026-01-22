import type { ThreadId } from '../../types';
import type { GlobalState } from '../types';
import type { TabArgs } from '../types';
import { AgentMessageSender } from '../../lib/alphahuman/types';

import { getCurrentTabId } from '../../util/establishMultitabRole';
import { selectTabState } from './index';

export function selectAlphaHumanThreadId<T extends GlobalState>(
  global: T,
): ThreadId | undefined {
  return global.alphahuman?.activeThreadId;
}

export function selectIsAlphaHumanThreadOpen<T extends GlobalState>(
  global: T,
  ...[tabId = getCurrentTabId()]: TabArgs<T>
): boolean {
  // Use middleColumnView to determine if page is open (mutual exclusion)
  const tabState = selectTabState(global, tabId);
  return tabState.middleColumnView === 'alphaHumanThread';
}

/**
 * Build threadsCache from threads (REST API) and threadMessages
 * This combines thread metadata with actual messages
 * Also includes threads that exist in threadMessages but not yet in threads (newly created threads)
 */
export function selectAlphahumanThreadsCache<T extends GlobalState>(
  global: T,
): {
  byId: Record<string, {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
    messageCount: number;
    chatId?: string;
    messages: Array<{
      id: string;
      content: string;
      sender: 'user' | 'agent';
      timestamp: Date;
    }>;
  }>;
  activeThreadId?: string;
  orderedIds: string[];
} | undefined {
  const alphahuman = global.alphahuman;
  if (!alphahuman) return undefined;

  const threads = alphahuman.threads || [];
  const threadMessages = alphahuman.threadMessages || {};
  const activeThreadId = alphahuman.activeThreadId;

  // Build byId record
  const byId: Record<string, {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
    messageCount: number;
    chatId?: string;
    messages: Array<{
      id: string;
      content: string;
      sender: 'user' | 'agent';
      timestamp: Date;
    }>;
  }> = {};

  // Process threads from REST API
  threads.forEach((thread) => {
    const messages = threadMessages[thread.id]?.messages || [];

    // Convert AlphahumanThreadMessage to the format expected by components
    const formattedMessages = messages
      .filter((msg) => !msg.isDeleted)
      .map((msg) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender === AgentMessageSender.USER ? 'user' as const : 'agent' as const,
        timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      }));

    // Get last message content
    const lastMessage = formattedMessages.length > 0
      ? formattedMessages[formattedMessages.length - 1].content
      : '';

    // Get timestamp from last message or thread creation
    const timestamp = formattedMessages.length > 0
      ? formattedMessages[formattedMessages.length - 1].timestamp
      : (thread.createdAt ? new Date(thread.createdAt) : new Date());

    byId[thread.id] = {
      id: thread.id,
      title: thread.title || `Thread ${thread.id.slice(0, 8)}`,
      lastMessage,
      timestamp,
      messageCount: formattedMessages.length,
      chatId: thread.chatId,
      messages: formattedMessages,
    };
  });

  // Also include threads that exist in threadMessages but not yet in threads (newly created threads)
  Object.keys(threadMessages).forEach((threadId) => {
    // Skip if already processed from threads array
    if (byId[threadId]) return;

    const messages = threadMessages[threadId]?.messages || [];

    // Convert AlphahumanThreadMessage to the format expected by components
    const formattedMessages = messages
      .filter((msg) => !msg.isDeleted)
      .map((msg) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender === AgentMessageSender.USER ? 'user' as const : 'agent' as const,
        timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      }));

    // Get last message content
    const lastMessage = formattedMessages.length > 0
      ? formattedMessages[formattedMessages.length - 1].content
      : '';

    // Get timestamp from last message or current time
    const timestamp = formattedMessages.length > 0
      ? formattedMessages[formattedMessages.length - 1].timestamp
      : new Date();

    byId[threadId] = {
      id: threadId,
      title: `Thread ${threadId.slice(0, 8)}`,
      lastMessage,
      timestamp,
      messageCount: formattedMessages.length,
      chatId: undefined, // Newly created threads may not have chatId yet
      messages: formattedMessages,
    };
  });

  // Build orderedIds (sorted by last message timestamp, most recent first)
  const orderedIds = Object.values(byId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .map((thread) => thread.id);

  return {
    byId,
    activeThreadId,
    orderedIds,
  };
}
