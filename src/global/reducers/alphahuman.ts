import type {
  AlphahumanThread,
  GetMeResponse,
  Highlight,
} from '../../lib/alphahuman/rest';
import type { AlphahumanThreadMessage } from '../../lib/alphahuman/types';
import type { GlobalState } from '../types';

import { log } from '../../lib/alphahuman/logger';
import {
  createThreadRest,
  getHighlightsRest,
  getMeRest,
  getThreadMessagesRest,
  getThreadsRest,
} from '../../lib/alphahuman/rest';
import { addActionHandler, getGlobal, setGlobal } from '../index';

type AlphahumanState = GlobalState['alphahuman'];

/**
 * Update alphahuman state
 */
export function updateAlphahuman<T extends GlobalState>(
  global: T,
  update: Partial<NonNullable<AlphahumanState>>,
): T {
  return {
    ...global,
    alphahuman: {
      ...(global.alphahuman || {}),
      ...update,
    },
  };
}

/**
 * Set user data (me)
 */
export function setAlphahumanMe<T extends GlobalState>(
  global: T,
  me: GetMeResponse | undefined,
): T {
  return updateAlphahuman(global, {
    me,
    meError: undefined,
  });
}

/**
 * Set me loading state
 */
export function setAlphahumanMeLoading<T extends GlobalState>(
  global: T,
  meLoading: boolean,
): T {
  return updateAlphahuman(global, { meLoading });
}

/**
 * Set me error
 */
export function setAlphahumanMeError<T extends GlobalState>(
  global: T,
  meError: Error | undefined,
): T {
  return updateAlphahuman(global, {
    meError,
    meLoading: false,
  });
}

/**
 * Set threads data
 */
export function setAlphahumanThreads<T extends GlobalState>(
  global: T,
  threads: AlphahumanThread [],
  count: number,
): T {
  return updateAlphahuman(global, {
    threads,
    threadsCount: count,
    threadsError: undefined,
  });
}

/**
 * Set threads loading state
 */
export function setAlphahumanThreadsLoading<T extends GlobalState>(
  global: T,
  threadsLoading: boolean,
): T {
  return updateAlphahuman(global, { threadsLoading });
}

/**
 * Set threads error
 */
export function setAlphahumanThreadsError<T extends GlobalState>(
  global: T,
  threadsError: Error | undefined,
): T {
  return updateAlphahuman(global, {
    threadsError,
    threadsLoading: false,
  });
}

/**
 * Set thread messages for a specific thread
 */
export function setAlphahumanThreadMessages<T extends GlobalState>(
  global: T,
  threadId: string,
  messages: AlphahumanThreadMessage[],
  count: number,
): T {
  const currentState = global.alphahuman;
  if (!currentState) {
    return global;
  }

  return updateAlphahuman(global, {
    threadMessages: {
      ...currentState.threadMessages,
      [threadId]: { messages, count },
    },
    threadMessagesError: {
      ...currentState.threadMessagesError,
      [threadId]: undefined,
    },
  });
}

/**
 * Set thread messages loading state
 */
export function setAlphahumanThreadMessagesLoading<T extends GlobalState>(
  global: T,
  threadId: string,
  loading: boolean,
): T {
  const currentState = global.alphahuman;
  if (!currentState) {
    return global;
  }

  return updateAlphahuman(global, {
    threadMessagesLoading: {
      ...currentState.threadMessagesLoading,
      [threadId]: loading,
    },
  });
}

/**
 * Set thread messages error
 */
export function setAlphahumanThreadMessagesError<T extends GlobalState>(
  global: T,
  threadId: string,
  error: Error | undefined,
): T {
  const currentState = global.alphahuman;
  if (!currentState) {
    return global;
  }

  return updateAlphahuman(global, {
    threadMessagesError: {
      ...currentState.threadMessagesError,
      [threadId]: error,
    },
    threadMessagesLoading: {
      ...currentState.threadMessagesLoading,
      [threadId]: false,
    },
  });
}

/**
 * Set highlights for a timeframe
 */
export function setAlphahumanHighlights<T extends GlobalState>(
  global: T,
  timeframe: 'daily' | 'weekly',
  highlights: Highlight[],
): T {
  const currentState = global.alphahuman;
  if (!currentState) {
    return global;
  }

  return updateAlphahuman(global, {
    highlights: {
      daily: currentState.highlights?.daily || [],
      weekly: currentState.highlights?.weekly || [],
      [timeframe]: highlights,
    },
    highlightsError: {
      daily: currentState.highlightsError?.daily || undefined,
      weekly: currentState.highlightsError?.weekly || undefined,
      [timeframe]: undefined,
    },
  });
}

/**
 * Set highlights loading state
 */
export function setAlphahumanHighlightsLoading<T extends GlobalState>(
  global: T,
  timeframe: 'daily' | 'weekly',
  loading: boolean,
): T {
  const currentState = global.alphahuman;
  if (!currentState) {
    return global;
  }

  return updateAlphahuman(global, {
    highlightsLoading: {
      daily: currentState.highlightsLoading?.daily || false,
      weekly: currentState.highlightsLoading?.weekly || false,
      [timeframe]: loading,
    },
  });
}

/**
 * Set highlights error
 */
export function setAlphahumanHighlightsError<T extends GlobalState>(
  global: T,
  timeframe: 'daily' | 'weekly',
  error: Error | undefined,
): T {
  const currentState = global.alphahuman;
  if (!currentState) {
    return global;
  }

  return updateAlphahuman(global, {
    highlightsError: {
      daily: currentState.highlightsError?.daily || undefined,
      weekly: currentState.highlightsError?.weekly || undefined,
      [timeframe]: error,
    },
    highlightsLoading: {
      daily: currentState.highlightsLoading?.daily || false,
      weekly: currentState.highlightsLoading?.weekly || false,
      [timeframe]: false,
    },
  });
}

/**
 * Clear thread messages for a specific thread
 */
export function clearAlphahumanThreadMessages<T extends GlobalState>(
  global: T,
  threadId: string,
): T {
  const currentState = global.alphahuman;
  if (!currentState) {
    return global;
  }

  const newThreadMessages = { ...currentState.threadMessages };
  const newThreadMessagesLoading = { ...currentState.threadMessagesLoading };
  const newThreadMessagesError = { ...currentState.threadMessagesError };

  delete newThreadMessages[threadId];
  delete newThreadMessagesLoading[threadId];
  delete newThreadMessagesError[threadId];

  return updateAlphahuman(global, {
    threadMessages: newThreadMessages,
    threadMessagesLoading: newThreadMessagesLoading,
    threadMessagesError: newThreadMessagesError,
  });
}

/**
 * Clear highlights for a timeframe
 */
export function clearAlphahumanHighlights<T extends GlobalState>(
  global: T,
  timeframe: 'daily' | 'weekly',
): T {
  const currentState = global.alphahuman;
  if (!currentState) {
    return global;
  }

  return updateAlphahuman(global, {
    highlights: {
      daily: currentState.highlights?.daily || [],
      weekly: currentState.highlights?.weekly || [],
      [timeframe]: [],
    },
    highlightsError: {
      daily: currentState.highlightsError?.daily || undefined,
      weekly: currentState.highlightsError?.weekly || undefined,
      [timeframe]: undefined,
    },
  });
}

/**
 * Set active thread ID
 */
export function setAlphahumanActiveThreadId<T extends GlobalState>(
  global: T,
  threadId: string | undefined,
): T {
  return updateAlphahuman(global, {
    activeThreadId: threadId,
  });
}

// Action handlers for API calls

addActionHandler('loadAlphahumanMe', async (global, actions): Promise<void> => {
  global = setAlphahumanMeLoading(global, true);
  setGlobal(global);
  global = getGlobal();

  try {
    const me = await getMeRest();
    global = getGlobal();
    global = setAlphahumanMe(global, me);
    setGlobal(global);
  } catch (error) {
    log('BACKEND ERROR', 'Failed to load alphahuman me:', error);
    global = getGlobal();
    global = setAlphahumanMeError(
      global,
      error instanceof Error ? error : new Error('Failed to fetch user data'),
    );
    setGlobal(global);
  }
});

addActionHandler('loadAlphahumanThreads', async (global, actions): Promise<void> => {
  global = setAlphahumanThreadsLoading(global, true);
  setGlobal(global);
  global = getGlobal();

  try {
    const { threads, count } = await getThreadsRest();
    global = getGlobal();
    global = setAlphahumanThreads(global, threads, count);
    global = setAlphahumanThreadsLoading(global, false);
    setGlobal(global);
  } catch (error) {
    log('BACKEND ERROR', 'Failed to load alphahuman threads:', error);
    global = getGlobal();
    global = setAlphahumanThreadsError(
      global,
      error instanceof Error ? error : new Error('Failed to fetch threads'),
    );
    setGlobal(global);
  }
});

addActionHandler('loadAlphahumanThreadMessages', async (global, actions, payload): Promise<void> => {
  const { threadId } = payload;

  global = setAlphahumanThreadMessagesLoading(global, threadId, true);
  setGlobal(global);
  global = getGlobal();

  try {
    const { messages, count } = await getThreadMessagesRest(threadId);
    global = getGlobal();
    global = setAlphahumanThreadMessages(global, threadId, messages, count);
    setGlobal(global);
  } catch (error) {
    log('BACKEND ERROR', `Failed to load thread messages for ${threadId}:`, error);
    global = getGlobal();
    global = setAlphahumanThreadMessagesError(
      global,
      threadId,
      error instanceof Error ? error : new Error('Failed to fetch thread messages'),
    );
    setGlobal(global);
  }
});

addActionHandler('loadAlphahumanHighlights', async (global, actions, payload): Promise<void> => {
  const { timeframe } = payload;

  global = setAlphahumanHighlightsLoading(global, timeframe, true);
  setGlobal(global);
  global = getGlobal();

  try {
    const highlights = await getHighlightsRest(timeframe);
    global = getGlobal();
    global = setAlphahumanHighlights(global, timeframe, highlights);
    setGlobal(global);
  } catch (error) {
    log('BACKEND ERROR', `Failed to load highlights for ${timeframe}:`, error);
    global = getGlobal();
    global = setAlphahumanHighlightsError(
      global,
      timeframe,
      error instanceof Error ? error : new Error('Failed to fetch highlights'),
    );
    setGlobal(global);
  }
});

addActionHandler('createAlphahumanThread', async (global, actions): Promise<void> => {
  try {
    const response = await createThreadRest();
    const threadId = response.id;
    global = getGlobal();
    global = setAlphahumanActiveThreadId(global, threadId);

    // Also set it in aiSocket threads for websocket compatibility
    const { ensureThreadsInitialized, selectAlphahumanThreadById } = await import('./socket');
    global = getGlobal();
    global = ensureThreadsInitialized(global);
    global = getGlobal();
    global = selectAlphahumanThreadById(global, threadId);

    setGlobal(global);
  } catch (error) {
    log('BACKEND ERROR', 'Failed to create alphahuman thread:', error);
    // Don't set error state here, let the caller handle it
  }
});
