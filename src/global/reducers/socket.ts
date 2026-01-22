import type { AlphahumanThreadMessage } from '../../lib/alphahuman/types';
import type { AlphaHumanManagerState } from '../../lib/alphahuman/types';
import type { GlobalState } from '../types';

import { updateAlphahuman } from './alphahuman';

export function setAlphaHumanSocketState<T extends GlobalState>(
  global: T,
  state: AlphaHumanManagerState,
): T {
  return updateAlphahuman(global, {
    socketState: state,
  });
}

export function setAlphaHumanLastAgentUpdate<T extends GlobalState>(
  global: T,
  update: GlobalState['alphahuman']['lastAgentUpdate'],
): T {
  return updateAlphahuman(global, {
    lastAgentUpdate: update,
  });
}

export function setAlphaHumanSocketDisconnected<T extends GlobalState>(global: T): T {
  return updateAlphahuman(global, {
    socketState: 'disconnected',
  });
}

export function toggleThreadsSidebar<T extends GlobalState>(global: T): T {
  return updateAlphahuman(global, {
    isThreadsSidebarOpen: !global.alphahuman?.isThreadsSidebarOpen,
  });
}

/**
 * Select an alphahuman thread by ID
 * Simply sets the activeThreadId - messages are stored in threadMessages
 */
export function selectAlphahumanThreadById<T extends GlobalState>(
  global: T,
  threadId: string,
): T {
  const currentState = global.alphahuman;
  if (!currentState) {
    return global;
  }

  // Just set activeThreadId - messages are managed in threadMessages
  return updateAlphahuman(global, {
    activeThreadId: threadId,
  });
}

/**
 * Ensure threads data is initialized
 * No longer needed since we use REST data directly
 */
export function ensureThreadsInitialized<T extends GlobalState>(global: T): T {
  // No-op - we use REST data (threads and threadMessages) directly
  return global;
}

export function initializeThreadsData<T extends GlobalState>(global: T): T {
  // No longer initializes threadsCache - we use REST data directly
  return updateAlphahuman(global, {
    isThreadsSidebarOpen: false,
  });
}

// export function createNewThread<T extends GlobalState>(global: T): T {
//   const newGlobal = ensureThreadsInitialized(global);
//   const currentThreads = newGlobal.aiSocket!.threads!;

//   const newThreadId = `thread-${Date.now()}`;
//   const newThread = {
//     id: newThreadId,
//     title: 'New Conversation',
//     lastMessage: '',
//     timestamp: new Date(),
//     messageCount: 0,
//     messages: [],
//   };

//   return updateAlphaHumanSocket(newGlobal, {
//     threads: {
//       byId: {
//         ...currentThreads.byId,
//         [newThreadId]: newThread,
//       },
//       activeThreadId: newThreadId,
//       orderedIds: [newThreadId, ...currentThreads.orderedIds],
//     },
//     isThreadsSidebarOpen: false,
//   });
// }

/**
 * Get target thread ID
 */
function getTargetThreadId<T extends GlobalState>(
  global: T,
  threadId: string | undefined,
): string | undefined {
  return threadId || global.alphahuman?.activeThreadId;
}

/**
 * Add a message to a thread (user or agent)
 * Updates threadMessages directly instead of threadsCache
 */
export function addMessageToAlphahumanThread<T extends GlobalState>(
  global: T,
  threadId: string,
  message: AlphahumanThreadMessage,
): T {
  const currentState = global.alphahuman;
  if (!currentState) return global;

  const targetThreadId = getTargetThreadId(global, threadId);
  if (!targetThreadId) return global;

  // Get existing thread messages or create new entry
  const currentThreadMessages = currentState.threadMessages || {};
  const existingMessages = currentThreadMessages[targetThreadId]?.messages || [];
  const existingCount = currentThreadMessages[targetThreadId]?.count || 0;

  // Append new message to the messages array
  const updatedMessages = [...existingMessages, message];
  const updatedCount = existingCount + 1;

  return updateAlphahuman(global, {
    threadMessages: {
      ...currentThreadMessages,
      [targetThreadId]: {
        messages: updatedMessages,
        count: updatedCount,
      },
    },
  });
}

/**
 * Add a user message to a thread
 */
export function addUserMessageToAlphahumanThread<T extends GlobalState>(
  global: T,
  threadId: string,
  content: string,
): T {
  return addMessageToAlphahumanThread(global, threadId, {
    id: Date.now().toString(),
    content,
    sender: 'user',
    type: 'text',
    extraMetadata: {},
    createdAt: new Date().toISOString(),
  });
}

/**
 * Update streaming content for agent response
 */
export function updateStreamingContent<T extends GlobalState>(
  global: T,
  content: string,
): T {
  return updateAlphahuman(global, {
    streamingContent: content,
  });
}

/**
 * Clear streaming content and state
 */
export function clearStreamingContent<T extends GlobalState>(global: T): T {
  return updateAlphahuman(global, {
    streamingContent: undefined,
    isStreaming: false,
  });
}

/**
 * Set streaming content and state
 */
export function setStreamingContent<T extends GlobalState>(
  global: T,
  content: string,
): T {
  return updateAlphahuman(global, {
    streamingContent: content,
    isStreaming: true,
  });
}

/**
 * Set streaming state (without content)
 */
export function setStreamingState<T extends GlobalState>(
  global: T,
  isStreaming: boolean,
): T {
  return updateAlphahuman(global, {
    isStreaming,
  });
}

/**
 * Update tool status
 */
export function updateToolStatus<T extends GlobalState>(
  global: T,
  toolName: string,
  status: 'starting' | 'active' | 'completed',
): T {
  const currentTools = global.alphahuman?.activeTools || {};
  const tool = currentTools[toolName];

  if (status === 'completed' && tool) {
    // Remove completed tool after a short delay (handled in action)
    const updatedTools = { ...currentTools };
    delete updatedTools[toolName];
    return updateAlphahuman(global, {
      activeTools: updatedTools,
    });
  }

  return updateAlphahuman(global, {
    activeTools: {
      ...currentTools,
      [toolName]: {
        name: toolName,
        status,
        startTime: tool?.startTime || Date.now(),
      },
    },
  });
}

/**
 * Clear all active tools
 */
export function clearActiveTools<T extends GlobalState>(global: T): T {
  return updateAlphahuman(global, {
    activeTools: undefined,
  });
}
