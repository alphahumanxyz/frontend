/**
 * Telegram API helpers for MCP tools
 * Wraps callApi calls with proper error handling
 */

import { getGlobal } from '../../../global';

import type { ApiChat, ApiInputMessageReplyInfo, ApiMessage, ApiUser } from '../../../api/types';

import { selectChat, selectUser } from '../../../global/selectors';
import { callApi } from '../../../api/gramjs/worker/connector';

/**
 * Get chat by ID or username
 */
export function getChatById(chatId: string | number): ApiChat | undefined {
  const global = getGlobal();
  const chatIdStr = String(chatId);

  // Try to get from global state first
  const chat = selectChat(global, chatIdStr);
  if (chat) {
    return chat;
  }

  // If not found, try to fetch
  // For username, we need to resolve it first
  if (typeof chatId === 'string' && chatId.startsWith('@')) {
    // This would require searchChats or resolveUsername
    // For now, return undefined and let the tool handle it
    return undefined;
  }

  return undefined;
}

/**
 * Get user by ID or username
 */
export function getUserById(userId: string | number): ApiUser | undefined {
  const global = getGlobal();
  const userIdStr = String(userId);

  const user = selectUser(global, userIdStr);
  if (user) {
    return user;
  }

  return undefined;
}

/**
 * Get messages from a chat
 */
export async function getMessages(
  chatId: string | number,
  limit: number = 20,
  offsetId?: number,
): Promise<ApiMessage[] | undefined> {
  const chat = getChatById(chatId);
  if (!chat) {
    return undefined;
  }

  const result = await callApi('fetchMessages', {
    chat,
    limit,
    offsetId,
  });

  return result?.messages;
}

/**
 * Send a message to a chat
 */
export async function sendMessage(
  chatId: string | number,
  message: string,
  replyToMessageId?: number,
): Promise<ApiMessage | undefined> {
  const chat = getChatById(chatId);
  if (!chat) {
    return undefined;
  }

  const replyInfo: ApiInputMessageReplyInfo | undefined = replyToMessageId
    ? {
      type: 'message',
      replyToMsgId: replyToMessageId,
    }
    : undefined;

  const result = await callApi('sendMessage', {
    chat,
    text: message,
    ...(replyInfo && { replyInfo }),
  });

  return result || undefined;
}

/**
 * Get list of chats
 */
export async function getChats(limit: number = 20): Promise<ApiChat[]> {
  const result = await callApi('fetchChats', {
    limit,
  });

  if (!result) {
    return [];
  }

  const global = getGlobal();
  const chats: ApiChat[] = [];

  // Extract chat IDs from result
  if (result && 'chatIds' in result && Array.isArray(result.chatIds)) {
    const chatIds = result.chatIds;
    for (const chatId of chatIds.slice(0, limit)) {
      const chat = selectChat(global, chatId);
      if (chat) {
        chats.push(chat);
      }
    }
  }

  return chats;
}

/**
 * Search for chats
 */
export async function searchChats(query: string): Promise<ApiChat[]> {
  const result = await callApi('searchChats', { query });
  if (!result || Array.isArray(result)) {
    return Array.isArray(result) ? result : [];
  }
  // If result has accountResultIds/globalResultIds, extract chats
  const global = getGlobal();
  const chats: ApiChat[] = [];
  if ('accountResultIds' in result) {
    for (const chatId of result.accountResultIds) {
      const chat = selectChat(global, chatId);
      if (chat) chats.push(chat);
    }
  }
  if ('globalResultIds' in result) {
    for (const chatId of result.globalResultIds) {
      const chat = selectChat(global, chatId);
      if (chat) chats.push(chat);
    }
  }
  return chats;
}

/**
 * Get current user info
 */
export function getCurrentUser(): ApiUser | undefined {
  const global = getGlobal();
  const currentUserId = global.currentUserId;
  if (!currentUserId) {
    return undefined;
  }

  return selectUser(global, currentUserId);
}

/**
 * Format entity (chat or user) for display
 */
export function formatEntity(entity: ApiChat | ApiUser): {
  id: string;
  name: string;
  type: string;
  username?: string;
  phone?: string;
} {
  if ('title' in entity) {
    // It's a chat
    return {
      id: entity.id,
      name: entity.title,
      type: entity.type === 'chatTypeChannel' ? 'channel' : 'group',
      username: entity.usernames?.[0]?.username,
    };
  } else {
    // It's a user
    const name = [entity.firstName, entity.lastName].filter(Boolean).join(' ') || 'Unknown';
    return {
      id: entity.id,
      name,
      type: 'user',
      username: entity.usernames?.[0]?.username,
      phone: entity.phoneNumber,
    };
  }
}

/**
 * Format message for display
 */
export function formatMessage(message: ApiMessage): {
  id: number;
  date: string;
  text: string;
  from_id?: string;
  has_media?: boolean;
  media_type?: string;
} {
  let text = '';
  if (message.content && 'text' in message.content) {
    text = message.content.text?.text || '';
  }

  const result: ReturnType<typeof formatMessage> = {
    id: message.id,
    date: new Date(message.date * 1000).toISOString(),
    text,
  };

  if (message.senderId) {
    result.from_id = String(message.senderId);
  }

  if (
    message.content
    && (('photo' in message.content) || ('video' in message.content) || ('document' in message.content))
  ) {
    result.has_media = true;
    if ('photo' in message.content) {
      result.media_type = 'MessageMediaPhoto';
    } else if ('video' in message.content) {
      result.media_type = 'MessageMediaDocument';
    } else if ('document' in message.content) {
      result.media_type = 'MessageMediaDocument';
    }
  }

  return result;
}
