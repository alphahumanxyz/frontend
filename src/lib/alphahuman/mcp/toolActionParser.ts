/**
 * Tool Action Parser - Converts tool inputs to human-readable descriptions
 *
 * This module provides parsers for MCP tools to convert raw JSON inputs
 * into human-readable action descriptions.
 */

type ToolArguments = Record<string, any>;

/**
 * Helper to format chat/user IDs with fallback
 */
function formatId(id: string | number | undefined, prefix: string = ''): string {
  if (!id) return '';
  const str = String(id);
  return prefix ? `${prefix} ${str}` : str;
}

/**
 * Helper to truncate long text
 */
function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Get human-readable action description for a tool
 */
export function toHumanReadableAction(toolName: string, args: ToolArguments): string {
  const parser = toolParsers[toolName];
  if (parser) {
    return parser(args);
  }

  // Fallback: return generic description
  return `Executing ${toolName} with provided parameters`;
}

/**
 * Parser functions for each tool
 */
const toolParsers: Record<string, (args: ToolArguments) => string> = {
  // === Messaging Tools ===

  send_message: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const message = truncateText(args.message || '', 100);
    return `Send message to ${chatId}: "${message}"`;
  },

  reply_to_message: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const messageId = args.message_id;
    const text = truncateText(args.text || '', 100);
    return `Reply to message ${messageId} in ${chatId}: "${text}"`;
  },

  edit_message: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const messageId = args.message_id;
    const newText = truncateText(args.new_text || '', 100);
    return `Edit message ${messageId} in ${chatId} to: "${newText}"`;
  },

  delete_message: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const messageId = args.message_id;
    return `Delete message ${messageId} from ${chatId}`;
  },

  forward_message: (args) => {
    const fromChat = formatId(args.from_chat_id, 'chat');
    const toChat = formatId(args.to_chat_id, 'chat');
    const messageId = args.message_id;
    return `Forward message ${messageId} from ${fromChat} to ${toChat}`;
  },

  pin_message: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const messageId = args.message_id;
    return `Pin message ${messageId} in ${chatId}`;
  },

  unpin_message: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const messageId = args.message_id;
    return `Unpin message ${messageId} in ${chatId}`;
  },

  mark_as_read: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    return `Mark messages as read in ${chatId}`;
  },

  send_reaction: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const messageId = args.message_id;
    const reaction = args.reaction || '👍';
    return `Add reaction ${reaction} to message ${messageId} in ${chatId}`;
  },

  remove_reaction: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const messageId = args.message_id;
    const reaction = args.reaction || '';
    return `Remove reaction ${reaction} from message ${messageId} in ${chatId}`;
  },

  save_draft: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const text = truncateText(args.text || '', 50);
    return `Save draft in ${chatId}: "${text}"`;
  },

  clear_draft: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    return `Clear draft in ${chatId}`;
  },

  // === Chat Management Tools ===

  list_chats: (args) => {
    const chatType = args.chat_type || 'all';
    const limit = args.limit || 20;
    return `List ${limit} ${chatType} chats`;
  },

  get_chat: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    return `Get information for ${chatId}`;
  },

  create_group: (args) => {
    const title = args.title || 'Untitled Group';
    const userCount = Array.isArray(args.user_ids) ? args.user_ids.length : 0;
    return `Create group "${title}" with ${userCount} member${userCount !== 1 ? 's' : ''}`;
  },

  create_channel: (args) => {
    const title = args.title || 'Untitled Channel';
    const description = args.description ? `: ${truncateText(args.description, 50)}` : '';
    return `Create channel "${title}"${description}`;
  },

  edit_chat_title: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const newTitle = args.new_title || '';
    return `Change title of ${chatId} to "${newTitle}"`;
  },

  delete_chat_photo: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    return `Remove photo from ${chatId}`;
  },

  edit_chat_photo: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    return `Update photo for ${chatId}`;
  },

  leave_chat: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    return `Leave ${chatId}`;
  },

  mute_chat: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const muteFor = args.mute_for ? ` for ${args.mute_for} seconds` : '';
    return `Mute ${chatId}${muteFor}`;
  },

  unmute_chat: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    return `Unmute ${chatId}`;
  },

  archive_chat: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    return `Archive ${chatId}`;
  },

  unarchive_chat: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    return `Unarchive ${chatId}`;
  },

  // === User & Admin Management Tools ===

  invite_to_group: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const userCount = Array.isArray(args.user_ids) ? args.user_ids.length : 0;
    return `Invite ${userCount} user${userCount !== 1 ? 's' : ''} to ${chatId}`;
  },

  ban_user: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const userId = formatId(args.user_id, 'user');
    return `Ban ${userId} from ${chatId}`;
  },

  unban_user: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const userId = formatId(args.user_id, 'user');
    return `Unban ${userId} from ${chatId}`;
  },

  promote_admin: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const userId = formatId(args.user_id, 'user');
    return `Promote ${userId} to admin in ${chatId}`;
  },

  demote_admin: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const userId = formatId(args.user_id, 'user');
    return `Demote ${userId} from admin in ${chatId}`;
  },

  block_user: (args) => {
    const userId = formatId(args.user_id, 'user');
    return `Block ${userId}`;
  },

  unblock_user: (args) => {
    const userId = formatId(args.user_id, 'user');
    return `Unblock ${userId}`;
  },

  // === Contact Management Tools ===

  add_contact: (args) => {
    const firstName = args.first_name || '';
    const lastName = args.last_name || '';
    const phone = args.phone_number || '';
    const name = [firstName, lastName].filter(Boolean).join(' ') || phone;
    return `Add contact: ${name}`;
  },

  delete_contact: (args) => {
    const userId = formatId(args.user_id, 'user');
    return `Delete contact ${userId}`;
  },

  list_contacts: (args) => {
    const limit = args.limit || 20;
    return `List ${limit} contacts`;
  },

  search_contacts: (args) => {
    const query = truncateText(args.query || '', 30);
    return `Search contacts for "${query}"`;
  },

  // === Search & Discovery Tools ===

  search_messages: (args) => {
    const chatId = args.chat_id ? formatId(args.chat_id, 'chat') : 'all chats';
    const query = truncateText(args.query || '', 30);
    const limit = args.limit || 20;
    return `Search for "${query}" in ${chatId} (limit: ${limit})`;
  },

  search_public_chats: (args) => {
    const query = truncateText(args.query || '', 30);
    return `Search public chats for "${query}"`;
  },

  resolve_username: (args) => {
    const username = args.username || '';
    return `Resolve username @${username.replace('@', '')}`;
  },

  // === Message Retrieval Tools ===

  get_messages: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const limit = args.limit || 20;
    return `Get ${limit} messages from ${chatId}`;
  },

  list_messages: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const limit = args.limit || 20;
    return `List ${limit} messages from ${chatId}`;
  },

  get_history: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const limit = args.limit || 20;
    return `Get message history from ${chatId} (${limit} messages)`;
  },

  get_pinned_messages: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    return `Get pinned messages from ${chatId}`;
  },

  get_message_context: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const messageId = args.message_id;
    const limit = args.limit || 5;
    return `Get context around message ${messageId} in ${chatId} (±${limit} messages)`;
  },

  list_topics: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    return `List topics in ${chatId}`;
  },

  // === List & Info Tools ===

  get_participants: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const limit = args.limit || 100;
    return `Get ${limit} participants from ${chatId}`;
  },

  get_admins: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    return `Get administrators of ${chatId}`;
  },

  get_banned_users: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    return `Get banned users from ${chatId}`;
  },

  get_blocked_users: () => {
    return 'Get list of blocked users';
  },

  // === Invite Link Tools ===

  get_invite_link: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    return `Get invite link for ${chatId}`;
  },

  export_chat_invite: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    return `Create invite link for ${chatId}`;
  },

  import_chat_invite: (args) => {
    const inviteHash = args.invite_hash ? truncateText(args.invite_hash, 20) : '';
    return `Join chat via invite link: ${inviteHash}`;
  },

  join_chat_by_link: (args) => {
    const inviteLink = args.invite_link ? truncateText(args.invite_link, 30) : '';
    return `Join chat via link: ${inviteLink}`;
  },

  subscribe_public_channel: (args) => {
    const username = args.username || '';
    return `Subscribe to public channel @${username.replace('@', '')}`;
  },

  // === Profile Tools ===

  update_profile: (args) => {
    const updates: string[] = [];
    if (args.first_name) updates.push(`first name: "${args.first_name}"`);
    if (args.last_name) updates.push(`last name: "${args.last_name}"`);
    if (args.bio) updates.push(`bio: "${truncateText(args.bio, 30)}"`);
    return `Update profile (${updates.join(', ')})`;
  },

  set_profile_photo: () => {
    return 'Set profile photo';
  },

  delete_profile_photo: () => {
    return 'Delete profile photo';
  },

  get_user_photos: (args) => {
    const userId = formatId(args.user_id, 'user');
    const limit = args.limit || 20;
    return `Get ${limit} photos from ${userId}`;
  },

  get_user_status: (args) => {
    const userId = formatId(args.user_id, 'user');
    return `Get status of ${userId}`;
  },

  // === Other Tools ===

  get_me: () => {
    return 'Get current user information';
  },

  list_inline_buttons: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const messageId = args.message_id;
    return `Get inline buttons from message ${messageId} in ${chatId}`;
  },

  press_inline_button: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const messageId = args.message_id;
    const buttonText = args.button_text ? ` "${truncateText(args.button_text, 30)}"` : '';
    return `Press inline button${buttonText} on message ${messageId} in ${chatId}`;
  },

  create_poll: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const question = truncateText(args.question || '', 50);
    const optionCount = Array.isArray(args.options) ? args.options.length : 0;
    return `Create poll in ${chatId}: "${question}" with ${optionCount} options`;
  },

  get_bot_info: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    return `Get bot information from ${chatId}`;
  },

  set_bot_commands: (args) => {
    const chatId = args.chat_id ? formatId(args.chat_id, 'chat') : 'all chats';
    const commandCount = Array.isArray(args.commands) ? args.commands.length : 0;
    return `Set ${commandCount} bot commands for ${chatId}`;
  },

  get_privacy_settings: () => {
    return 'Get privacy settings';
  },

  set_privacy_settings: (args) => {
    const setting = args.setting || 'unknown';
    const value = args.value || '';
    return `Set privacy setting "${setting}" to ${value}`;
  },

  get_media_info: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const messageId = args.message_id;
    return `Get media information from message ${messageId} in ${chatId}`;
  },

  get_recent_actions: (args) => {
    const chatId = formatId(args.chat_id, 'chat');
    const limit = args.limit || 20;
    return `Get ${limit} recent admin actions from ${chatId}`;
  },
};
