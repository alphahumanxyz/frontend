import type { ActionReturnType } from '../../types';
import type { GlobalState } from '../../types';
import { type ApiMessage, MAIN_THREAD_ID } from '../../../api/types';

import { ALPHAHUMAN_BOT_ID, ALPHAHUMAN_BOT_USERNAME } from '../../../config';
import getAiSocketManager from '../../../lib/alphahuman';
import { log } from '../../../lib/alphahuman/logger';
import { consumeLoginTokenRest, createLoginTokenRest, createThreadRest } from '../../../lib/alphahuman/rest';
import { getCurrentTabId } from '../../../util/establishMultitabRole';
import { callApi } from '../../../api/gramjs';
import { getMessageText } from '../../helpers';
import { addActionHandler, getGlobal, setGlobal } from '../../index';
import {
  addMessageToAlphahumanThread,
  addUserMessageToAlphahumanThread,
  clearActiveTools,
  clearStreamingContent,
  selectAlphahumanThreadById,
  setAlphahumanActiveThreadId,
  setAlphaHumanLastAgentUpdate,
  setAlphaHumanSocketDisconnected,
  setAlphaHumanSocketState,
  setStreamingState,
  toggleThreadsSidebar,
  updateAlphahuman,
  updateChat,
  updateUser,
} from '../../reducers';
import { selectChat } from '../../selectors';

addActionHandler('updateAlphaHumanSocketState', (global, actions, payload): ActionReturnType => {
  const { state } = payload;
  return setAlphaHumanSocketState(global, state);
});

addActionHandler('onAlphaHumanBackendError', (global, actions, payload): ActionReturnType => {
  const { error } = payload;

  log('BACKEND ERROR', 'Backend error:', error);

  // Handle authentication errors
  if (error.status === 401 || error.status === 403) {
    return setAlphaHumanSocketState(global, 'jwt_invalid');
  }

  return global;
});

addActionHandler('onAlphaHumanAgentStreamingUpdate', (global, actions, payload): ActionReturnType => {
  const { update } = payload;

  log('UPDATE', 'Processing agent update:', {
    eventType: update.eventType,
    message: update.message,
  });

  // Update the lastAgentUpdate for tracking (convert eventType to eventType)
  let newGlobal = setAlphaHumanLastAgentUpdate(global, {
    ...update,
    eventType: update.eventType,
  } as GlobalState['alphahuman']['lastAgentUpdate']);

  // If backend returns a threadId, select it if different from current
  const currentThreadId = newGlobal.alphahuman?.activeThreadId;
  if (update.message.thread && currentThreadId !== update.message.thread) {
    log('REQUEST', 'Backend returned threadId, selecting thread:', { threadId: update.message.thread });
    newGlobal = selectAlphahumanThreadById(newGlobal, update.message.thread);
    newGlobal = setAlphahumanActiveThreadId(newGlobal, update.message.thread);
    // Open the thread view to ensure it's displayed correctly
    actions.openAlphaHumanThread({ threadId: update.message.thread.toString(), tabId: getCurrentTabId() });
    newGlobal = getGlobal();
  }

  if (!update.message.thread) return newGlobal;

  // Handle different event types
  switch (update.eventType) {
    // case 'chunk':
    //   if (update.content) {
    //     const currentStreamingContent = newGlobal.alphahuman?.streamingContent || '';
    //     newGlobal = setStreamingContent(newGlobal, currentStreamingContent + update.content);
    //   }
    //   break;

    case 'complete':
      update.message.type = 'text';
      newGlobal = addMessageToAlphahumanThread(newGlobal, update.message.thread, update.message);
      newGlobal = clearStreamingContent(newGlobal);
      break;

    case 'toolStart':
    case 'toolEnd':
    case 'reasoning':
      newGlobal = addMessageToAlphahumanThread(newGlobal, update.message.thread, update.message);
      break;

    case 'error':
      log('UPDATE', 'Agent stream error:', update.message.content);
      update.message.type = 'text';
      newGlobal = addMessageToAlphahumanThread(newGlobal, update.message.thread, update.message);
      newGlobal = clearStreamingContent(newGlobal);
      newGlobal = clearActiveTools(newGlobal);
      break;
  }

  return newGlobal;
});

addActionHandler('connectAlphaHumanSocket', (global, actions, payload): ActionReturnType => {
  const { jwtToken } = payload;
  const socketManager = getAiSocketManager();

  try {
    socketManager.updateJwtAndLogin(jwtToken);
  } catch (error) {
    log('CONNECTION ERROR', 'Failed to connect socket:', error);
    actions.updateAlphaHumanSocketState({ state: 'jwt_invalid' });
  }
});

addActionHandler('disconnectAlphaHumanSocket', (global, actions): ActionReturnType => {
  const socketManager = getAiSocketManager();
  socketManager.clear();
  return setAlphaHumanSocketDisconnected(global);
});

addActionHandler('streamAlphaHumanMessage', async (global, actions, payload): Promise<void> => {
  const { threadId, content, chatId } = payload;
  const socketManager = getAiSocketManager();

  // Get current active thread ID
  let threadIdToUse = threadId || global.alphahuman?.activeThreadId;

  log('UPDATE', 'Stream AlphaHuman message:', { threadId: threadIdToUse, content });

  // If no thread ID exists, create a new thread via API
  if (!threadIdToUse) {
    try {
      log('REQUEST', 'Creating Alphahuman thread via API');
      const response = await createThreadRest(chatId);
      log('RESPONSE', 'Alphahuman Thread created:', response);
      threadIdToUse = response.id;
      global = getGlobal();
      global = setAlphahumanActiveThreadId(global, threadIdToUse);

      // Also set it in aiSocket threads for websocket compatibility
      global = selectAlphahumanThreadById(global, threadIdToUse);
      setGlobal(global);
      global = getGlobal();

      // Open the thread view to ensure it's displayed correctly
      actions.openAlphaHumanThread({ threadId: threadIdToUse.toString(), tabId: getCurrentTabId() });
      global = getGlobal();
    } catch (error) {
      log('STREAM ERROR', 'Failed to create thread via API, falling back to local thread:', error);
    }
  }

  // If we still don't have a threadId after attempting to create one, we can't proceed
  if (!threadIdToUse) {
    log('STREAM ERROR', 'No threadId available after creation attempt');
    return;
  }

  // Mark streaming state as active immediately so UI can show thinking state
  global = setStreamingState(global, true);

  // Add user message to thread and clear streaming content
  global = addUserMessageToAlphahumanThread(global, threadIdToUse, content);
  global = clearStreamingContent(global);
  setGlobal(global);

  try {
    log('REQUEST', 'Streaming message:', { threadId: threadIdToUse, content });
    const messageId = await socketManager.streamMessageForUser({ threadId: threadIdToUse, content });
    log('RESPONSE', 'Stream completed, messageId:', messageId);
  } catch (error) {
    log('STREAM ERROR', 'Failed to stream message:', error);
    global = getGlobal();
    global = clearStreamingContent(global);
    setGlobal(global);
  }
});

addActionHandler('apiUpdate', async (global, _actions, update): Promise<void> => {
  if (update['@type'] !== 'newMessage') return;

  const loginToken = global.alphahuman?.loginToken;
  if (!loginToken) return;

  const { chatId, message } = update;
  const chat = selectChat(global, chatId);

  // Check if message is from ALPHAHUMAN_BOT_USERNAME
  const isFromLoginBot = chat?.usernames?.some(
    (u) => u.username.toLowerCase() === ALPHAHUMAN_BOT_USERNAME.toLowerCase(),
  );

  if (!isFromLoginBot || message.isOutgoing) return;

  const messageText = getMessageText(message as ApiMessage);
  const text = messageText?.text;

  if (!text) return;

  const messageToFind = 'successfully logged into';

  if (text.includes(messageToFind)) {
    try {
      const response = await consumeLoginTokenRest(loginToken);
      if (!response.jwtToken) {
        return;
      }

      const socketManager = getAiSocketManager();
      socketManager.updateJwtAndLogin(response.jwtToken);

      global = getGlobal();
      global = updateAlphahuman(global, { isLoggingIn: false, loginToken: undefined });
      setGlobal(global);
    } catch (error) {
      log('AUTH ERROR', 'Failed to consume login token:', error);
      global = getGlobal();
      global = updateAlphahuman(global, { isLoggingIn: false, loginToken: undefined });
      setGlobal(global);
    }
  }
});

// Threads-related actions
addActionHandler('toggleThreadsSidebar', (global): ActionReturnType => {
  return toggleThreadsSidebar(global);
});

addActionHandler('selectAlphahumanThreadById', (global, actions, payload): ActionReturnType => {
  const { threadId } = payload;
  return selectAlphahumanThreadById(global, threadId);
});

addActionHandler('addMessageToAlphahumanThread', (global, actions, payload): ActionReturnType => {
  const { threadId, message } = payload;
  return addMessageToAlphahumanThread(global, threadId, message);
});

addActionHandler('startAlphaHumanLogin', async (global, actions): Promise<void> => {
  global = updateAlphahuman(global, { isLoggingIn: true });
  setGlobal(global);
  global = getGlobal();

  // Step 1: Create login token
  const { token } = await createLoginTokenRest();

  global = getGlobal();
  global = updateAlphahuman(global, { loginToken: token });
  setGlobal(global);

  // Step 2: Ensure bot chat is loaded, then send /start command
  const cleanUsername = ALPHAHUMAN_BOT_USERNAME.startsWith('@')
    ? ALPHAHUMAN_BOT_USERNAME.slice(1)
    : ALPHAHUMAN_BOT_USERNAME;

  // Check if chat already exists
  let chat = selectChat(global, ALPHAHUMAN_BOT_ID);

  // If chat doesn't exist, fetch it
  if (!chat) {
    const resolvedPeer = await callApi('getChatByUsername', cleanUsername);
    if (!resolvedPeer?.chat) {
      log('AUTH ERROR', 'Failed to resolve bot username');
      global = getGlobal();
      global = updateAlphahuman(global, { isLoggingIn: false, loginToken: undefined });
      setGlobal(global);
      return;
    }

    // Update global state with the fetched chat and user
    global = getGlobal();
    global = updateChat(global, resolvedPeer.chat.id, resolvedPeer.chat);
    if (resolvedPeer.user) {
      global = updateUser(global, resolvedPeer.user.id, resolvedPeer.user);
    }
    setGlobal(global);
    chat = resolvedPeer.chat;
  }

  // Step 3: Send /start command directly to bot
  actions.sendMessage({
    messageList: {
      chatId: chat.id,
      threadId: MAIN_THREAD_ID,
      type: 'thread',
    },
    tabId: getCurrentTabId(),
    text: `/start ${token}`,
  });
});

addActionHandler('stopAlphaHumanLogin', (global): ActionReturnType => {
  return updateAlphahuman(global, { isLoggingIn: false, loginToken: undefined });
});

addActionHandler('initAlphaHumanSocket', (global, actions): ActionReturnType => {
  const socketManager = getAiSocketManager();

  if (socketManager.isAuthenticated()) {
    try {
      socketManager.login();
    } catch (error) {
      log('CONNECTION ERROR', 'Failed to initialize socket:', error);
      actions.updateAlphaHumanSocketState({ state: 'jwt_invalid' });
    }
  }
});
