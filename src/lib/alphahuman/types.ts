/**
 * Types for AI Socket Manager
 * Types matching backend interfaces
 */

import type { ApiChatType } from '../../api/types/chats';
import type { ApiMessage } from '../../api/types/messages';

export enum TgMessageType {
  TEXT = 'text',
  PHOTO = 'photo',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  STICKER = 'sticker',
  VOICE = 'voice',
}

/**
 * Unified chat type for socket communication
 * Merged from ApiChatType ('chatTypePrivate' | 'chatTypeSecret' | 'chatTypeBasicGroup' | 'chatTypeSuperGroup' | 'chatTypeChannel')
 * and socket chatType ('private' | 'group' | 'supergroup' | 'channel')
 */
export type SocketChatType = 'private' | 'group' | 'supergroup' | 'channel';

/**
 * Converts ApiChatType to SocketChatType
 * @param apiChatType - The API chat type
 * @returns The corresponding socket chat type
 */
export function convertApiChatTypeToSocketChatType(apiChatType: ApiChatType): SocketChatType {
  switch (apiChatType) {
    case 'chatTypePrivate':
    case 'chatTypeSecret':
      return 'private';
    case 'chatTypeBasicGroup':
      return 'group';
    case 'chatTypeSuperGroup':
      return 'supergroup';
    case 'chatTypeChannel':
      return 'channel';
    default: {
      // TypeScript exhaustiveness check - this should never happen
      const _exhaustive: never = apiChatType;
      return 'private';
    }
  }
}

/**
 * Determines the message type from ApiMessage content
 * Checks content properties in order of specificity
 * @param message - The API message
 * @returns The corresponding TgMessageType
 */
export function getMessageTypeFromApiMessage(message: ApiMessage): TgMessageType {
  const { content } = message;

  // Check in order of specificity
  if (content.sticker) {
    return TgMessageType.STICKER;
  }
  if (content.voice) {
    return TgMessageType.VOICE;
  }
  if (content.photo) {
    return TgMessageType.PHOTO;
  }
  if (content.video) {
    return TgMessageType.VIDEO;
  }
  if (content.audio) {
    return TgMessageType.AUDIO;
  }
  if (content.document) {
    return TgMessageType.DOCUMENT;
  }

  // Default to text if no media content is found
  return TgMessageType.TEXT;
}

export interface ITgMessageReaction {
  emoji: string;
  count: number;
}

export interface ITgMessage {
  chatId: number;
  chatType: SocketChatType;
  content: string;
  fromUserId: number;
  fromUserType: 'user' | 'bot';
  messageId: number;
  messageType: TgMessageType;
  messageTimestamp: number;
  reactions?: ITgMessageReaction[];
}

export interface SyncMessagesData {
  messages: Partial<ITgMessage>[];
}

/**
 * Encrypted message data sent to backend
 * Includes encrypted hashes for chatHash and fromUserHash
 * messageId is sent as raw number (not encrypted)
 */
export interface IEncryptedTgMessage extends Partial<ITgMessage> {
  contentHash?: string;
  chatHash?: string;
  fromUserIdHash?: string;
  fromUsernameHash?: string;
  fromFirstNameHash?: string;
  fromLastNameHash?: string;
  messageId?: number; // Raw messageId (not encrypted)
}

/**
 * Socket manager state type
 */
export type AlphaHumanManagerState =
  | 'disconnected'
  | 'jwt_missing'
  | 'jwt_invalid'
  | 'connected';

export type AgentMessageType = 'text' | 'start' | 'toolStart' | 'toolEnd' | 'reasoning' | 'complete';
export enum AgentMessageSender {
  USER = 'user',
  AGENT = 'agent',
  ACTION = 'action',
}

export type AgentType = 'text' | 'start' | 'toolStart' | 'toolEnd' | 'reasoning' | 'complete' | 'error';

export interface AlphahumanThreadMessage {
  thread: string; // Reference to the agent thread
  tgUser: string; // Reference to Telegram user
  id: string;
  content: string;
  type: AgentType;
  extraMetadata: Record<string, unknown>;
  sender: AgentMessageSender;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Agent update event from backend
 * Supports streaming updates with different event types
 */
export interface AgentUpdate {
  eventType: 'chunk' | 'reasoning' | 'toolStart' | 'toolEnd' | 'complete' | 'error';
  message: AlphahumanThreadMessage;
}

/**
 * Stream message request
 */
export interface StreamMessageRequest {
  threadId?: string;
  content: string;
}
