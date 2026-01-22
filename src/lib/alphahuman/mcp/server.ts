/**
 * MCP Server implementation for Telegram
 * Provides tools for interacting with Telegram via MCP protocol
 */

import type { Socket } from 'socket.io-client';

import type { GlobalState } from '../../../global/types';
import type { MCPServerConfig, MCPTool, MCPToolCall, MCPToolResult } from './types';

import { ErrorCategory, logAndFormatError } from './errorHandler';
import * as tools from './tools';
import { SocketIOMCPTransportImpl } from './transport';
import { ValidationError } from './validation';

export interface MCPToolContext {
  global: GlobalState;
  transport: SocketIOMCPTransportImpl;
}

export type MCPToolHandler = (args: Record<string, unknown>, context: MCPToolContext) => Promise<MCPToolResult>;

export class MCPServer {
  private transport: SocketIOMCPTransportImpl;
  private config: MCPServerConfig;
  private global: GlobalState;

  constructor(socket: Socket | null | undefined, global: GlobalState) {
    this.transport = new SocketIOMCPTransportImpl(socket ?? undefined);
    this.config = {
      name: 'telegram-mcp',
      version: '1.0.0',
    };
    this.global = global;

    this.setupHandlers();
  }

  /**
   * Update socket instance (e.g., on reconnection)
   */
  updateSocket(socket: Socket | null | undefined): void {
    this.transport.updateSocket(socket ?? undefined);
  }

  /**
   * Update global state
   */
  updateGlobal(global: GlobalState): void {
    this.global = global;
  }

  /**
   * Setup MCP protocol handlers
   */
  private setupHandlers(): void {
    // Listen for tool calls from backend
    this.transport.on('toolCall', (data: { requestId: string; toolCall: MCPToolCall }) => {
      void this.handleToolCallRequest(data);
    });

    // Listen for list tools request
    this.transport.on('listTools', (data: { requestId: string }) => {
      const { requestId } = data;
      try {
        const toolsList = this.listTools();
        this.transport.emit('listToolsResponse', {
          requestId,
          tools: toolsList,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[MCP] Failed to list tools', error);
        this.transport.emit('listToolsResponse', {
          requestId,
          tools: [],
        });
      }
    });
  }

  private async handleToolCallRequest(data: { requestId: string; toolCall: MCPToolCall }): Promise<void> {
    const { requestId, toolCall } = data;

    try {
      const result = await this.handleToolCall(toolCall);
      this.transport.emit('toolResult', {
        requestId,
        result,
      });
    } catch (error) {
      const errorResult = logAndFormatError(
        'handleToolCall',
        error instanceof Error ? error : new Error(String(error)),
      );
      this.transport.emit('toolResult', {
        requestId,
        result: errorResult,
      });
    }
  }

  /**
   * List all available tools
   */
  private listTools(): MCPTool[] {
    return Object.values(tools).filter((tool): tool is MCPTool => {
      return (
        tool !== undefined &&
        typeof tool === 'object' &&
        'name' in tool &&
        'description' in tool &&
        'inputSchema' in tool &&
        typeof tool.name === 'string' &&
        typeof tool.description === 'string'
      );
    });
  }

  /**
   * Handle a tool call
   */
  private async handleToolCall(toolCall: MCPToolCall): Promise<MCPToolResult> {
    const { name, arguments: args } = toolCall;

    // eslint-disable-next-line no-console
    console.log(`[MCP] Executing tool: ${name}`, args);

    // Find the tool handler
    const toolHandler = this.findToolHandler(name);
    if (!toolHandler) {
      return {
        content: [
          {
            type: 'text',
            text: `Tool '${name}' not found`,
          },
        ],
        isError: true,
      };
    }

    try {
      // Execute the tool with context
      const result = await toolHandler(args, {
        global: this.global,
        transport: this.transport,
      });

      return result;
    } catch (error) {
      if (error instanceof ValidationError) {
        return logAndFormatError(name, error, ErrorCategory.VALIDATION);
      }

      return logAndFormatError(
        name,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Find tool handler by name
   */
  private findToolHandler(name: string): MCPToolHandler | undefined {
    // Map tool names to handlers
    // Type assertion needed since tool handlers have specific arg types,
    // but MCPToolHandler uses Record<string, unknown> for dynamic MCP calls
    const toolMap = {
      // Chat & Group Management
      get_chats: tools.getChats,
      list_chats: tools.listChats,
      get_chat: tools.getChat,
      create_group: tools.createGroup,
      invite_to_group: tools.inviteToGroup,
      create_channel: tools.createChannel,
      edit_chat_title: tools.editChatTitle,
      delete_chat_photo: tools.deleteChatPhoto,
      leave_chat: tools.leaveChat,
      get_participants: tools.getParticipants,
      get_admins: tools.getAdmins,
      get_banned_users: tools.getBannedUsers,
      promote_admin: tools.promoteAdmin,
      demote_admin: tools.demoteAdmin,
      ban_user: tools.banUser,
      unban_user: tools.unbanUser,
      get_invite_link: tools.getInviteLink,
      export_chat_invite: tools.exportChatInvite,
      import_chat_invite: tools.importChatInvite,
      join_chat_by_link: tools.joinChatByLink,
      subscribe_public_channel: tools.subscribePublicChannel,

      // Messaging
      get_messages: tools.getMessages,
      list_messages: tools.listMessages,
      list_topics: tools.listTopics,
      send_message: tools.sendMessage,
      reply_to_message: tools.replyToMessage,
      edit_message: tools.editMessage,
      delete_message: tools.deleteMessage,
      forward_message: tools.forwardMessage,
      pin_message: tools.pinMessage,
      unpin_message: tools.unpinMessage,
      mark_as_read: tools.markAsRead,
      get_message_context: tools.getMessageContext,
      get_history: tools.getHistory,
      get_pinned_messages: tools.getPinnedMessages,
      send_reaction: tools.sendReaction,
      remove_reaction: tools.removeReaction,
      get_message_reactions: tools.getMessageReactions,

      // Contact Management
      list_contacts: tools.listContacts,
      search_contacts: tools.searchContacts,
      add_contact: tools.addContact,
      delete_contact: tools.deleteContact,
      block_user: tools.blockUser,
      unblock_user: tools.unblockUser,
      get_blocked_users: tools.getBlockedUsers,

      // User & Profile
      get_me: tools.getMe,
      update_profile: tools.updateProfile,
      get_user_photos: tools.getUserPhotos,
      get_user_status: tools.getUserStatus,

      // Privacy & Settings
      mute_chat: tools.muteChat,
      unmute_chat: tools.unmuteChat,
      archive_chat: tools.archiveChat,
      unarchive_chat: tools.unarchiveChat,
      get_privacy_settings: tools.getPrivacySettings,
      set_privacy_settings: tools.setPrivacySettings,

      // Inline Buttons & Drafts
      list_inline_buttons: tools.listInlineButtons,
      press_inline_button: tools.pressInlineButton,
      save_draft: tools.saveDraft,
      get_drafts: tools.getDrafts,
      clear_draft: tools.clearDraft,

      // Search & Discovery
      search_public_chats: tools.searchPublicChats,
      search_messages: tools.searchMessages,
      resolve_username: tools.resolveUsername,

      // Media
      get_media_info: tools.getMediaInfo,

      // Admin & Actions
      get_recent_actions: tools.getRecentActions,

      // Polls
      create_poll: tools.createPoll,

      // Bots
      get_bot_info: tools.getBotInfo,
      set_bot_commands: tools.setBotCommands,

      // Profile
      set_profile_photo: tools.setProfilePhoto,
      delete_profile_photo: tools.deleteProfilePhoto,

      // Chat Photo
      edit_chat_photo: tools.editChatPhoto,

      // Stickers & GIFs
      get_sticker_sets: tools.getStickerSets,
      get_gif_search: tools.getGifSearch,

      // Contacts (Extended)
      get_contact_ids: tools.getContactIds,
      import_contacts: tools.importContacts,
      export_contacts: tools.exportContacts,
      get_direct_chat_by_contact: tools.getDirectChatByContact,
      get_contact_chats: tools.getContactChats,
      get_last_interaction: tools.getLastInteraction,
    } as unknown as Record<string, MCPToolHandler>;

    return toolMap[name] || undefined;
  }
}
