import type { FC } from '@teact';
import { memo, useCallback, useEffect, useRef, useState } from '@teact';
import { getActions, withGlobal } from '../../global';

import type { AgentType } from '../../lib/alphahuman/types.ts';
import type { IAnchorPosition, ThreadId } from '../../types';

import { toHumanReadableAction } from '../../lib/alphahuman/mcp/toolActionParser';
import { requestMutation } from '../../lib/fasterdom/fasterdom';
import buildClassName from '../../util/buildClassName';
import { copyTextToClipboard } from '../../util/clipboard';
import renderText from '../../components/common/helpers/renderText';

import useLastCallback from '../../hooks/useLastCallback';

import Avatar from '../common/Avatar';
import Icon from '../common/icons/Icon';
import Button from '../ui/Button';
import Menu from '../ui/Menu';
import MenuItem from '../ui/MenuItem';
import Skeleton from '../ui/placeholder/Skeleton';

import './AlphaHumanThreadPage.scss';

export type OwnProps = {
  threadId?: ThreadId;
  onClose?: () => void;
};

type StateProps = {
  messages?: Array<{
    id: string;
    content: string;
    sender: 'user' | 'agent';
    createdAt: string;
    type: AgentType;
  }>;
  isLoading?: boolean;
  threadTitle?: string;
  streamingContent?: string;
  isStreaming?: boolean;
  activeTools?: Record<string, {
    name: string;
    status: 'starting' | 'active' | 'completed';
    startTime: number;
  }>;
};

const AlphaHumanThreadPage: FC<OwnProps & StateProps> = ({
  threadId,
  onClose,
  messages = [],
  isLoading = false,
  threadTitle,
  streamingContent,
  isStreaming = false,
  activeTools,
}) => {
  const { loadAlphahumanThreadMessages, streamAlphaHumanMessage } = getActions();

  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>();
  const messagesContainerRef = useRef<HTMLDivElement>();
  const scrollAnimationFrameRef = useRef<number>();

  // Throttled streaming content state
  const [displayedStreamingContent, setDisplayedStreamingContent] = useState<string>('');
  const rafRef = useRef<number>();
  const prevMessagesLengthRef = useRef<number>(0);

  // Context menu state
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [contextMenuAnchor, setContextMenuAnchor] = useState<IAnchorPosition | undefined>();
  const [contextMenuMessage, setContextMenuMessage] = useState<string | undefined>();
  const menuRef = useRef<HTMLDivElement>();

  // Menu positioning functions
  const getTriggerElement = useLastCallback(() => {
    return messagesContainerRef.current;
  });

  const getRootElement = useLastCallback(() => document.body);

  const getMenuElement = useLastCallback(() => menuRef.current);

  const getLayout = useLastCallback(() => {
    return {
      extraPaddingX: 10,
      shouldAvoidNegativePosition: true,
    };
  });

  // Check if user is near bottom (within threshold)
  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return false;
    const threshold = 100; // pixels from bottom
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < threshold;
  }, []);

  // Optimized scroll to bottom function
  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Cancel any pending scroll animation
    if (scrollAnimationFrameRef.current) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
    }

    // Use requestAnimationFrame for smooth scrolling
    // Read scrollHeight before requestMutation (fasterdom requires measurements outside mutations)
    scrollAnimationFrameRef.current = requestAnimationFrame(() => {
      const scrollHeight = container.scrollHeight;
      requestMutation(() => {
        container.scrollTop = scrollHeight;
      });
    });
  }, []);

  // Load messages when threadId changes
  useEffect(() => {
    if (threadId && typeof threadId === 'string') {
      loadAlphahumanThreadMessages({ threadId });
    }
  }, [threadId, loadAlphahumanThreadMessages]);

  // Throttle streaming content updates using requestAnimationFrame
  useEffect(() => {
    // Cancel any pending update
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Throttle updates to ~60fps
    rafRef.current = requestAnimationFrame(() => {
      setDisplayedStreamingContent(streamingContent || '');
    });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [streamingContent]);

  // Auto-scroll to bottom when messages change or streaming starts
  // Always scroll if streaming or when messages first load, otherwise only if user is near bottom
  useEffect(() => {
    const currentMessagesLength = messages.length;
    const hasNewMessages = currentMessagesLength > prevMessagesLengthRef.current;
    const hasInitialMessages = !isLoading && currentMessagesLength > 0 && prevMessagesLengthRef.current === 0;

    if (hasNewMessages || hasInitialMessages || isStreaming) {
      // If streaming or initial load, always scroll. Otherwise only scroll if user is near bottom
      const isUserNearBottom = isNearBottom();
      if (isStreaming || hasInitialMessages || isUserNearBottom) {
        // Use a small delay to ensure DOM has updated
        const timeoutId = setTimeout(() => {
          scrollToBottom();
        }, 50);
        prevMessagesLengthRef.current = currentMessagesLength;
        return () => clearTimeout(timeoutId);
      }
      prevMessagesLengthRef.current = currentMessagesLength;
    }
    return undefined;
  }, [messages.length, isLoading, isStreaming, scrollToBottom, isNearBottom]);

  // Group messages by sender to determine first/last in group
  const getMessageGroupPosition = (index: number) => {
    const currentMessage = messages[index];
    const prevMessage = index > 0 ? messages[index - 1] : undefined;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : undefined;

    const isFirstInGroup = !prevMessage || prevMessage.sender !== currentMessage.sender;
    const isLastInGroup = !nextMessage || nextMessage.sender !== currentMessage.sender;

    return { isFirstInGroup, isLastInGroup };
  };

  // Handle sending message
  const handleSend = useLastCallback(() => {
    const content = inputValue.trim();
    if (!content || isStreaming) return;

    const threadIdString = threadId && typeof threadId === 'string' ? threadId : undefined;
    streamAlphaHumanMessage({ threadId: threadIdString, content });
    setInputValue('');
    inputRef.current?.focus();
  });

  // Handle Enter key press
  const handleInputKeyDown = useLastCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Handle copying message text
  const handleCopyMessage = useLastCallback(() => {
    if (contextMenuMessage) {
      // Check if user has text selection
      const selection = window.getSelection();
      const hasSelection = Boolean(
        selection?.toString().trim() &&
        selection.anchorNode?.parentNode &&
        (selection.anchorNode.parentNode as HTMLElement).closest('.Message'),
      );

      if (hasSelection) {
        // Copy selected text
        document.execCommand('copy');
      } else {
        // Copy full message text
        copyTextToClipboard(contextMenuMessage);
      }
    }
    setIsContextMenuOpen(false);
    setContextMenuAnchor(undefined);
    setContextMenuMessage(undefined);
  });

  // Handle right-click on message
  const handleMessageContextMenu = useLastCallback((e: React.MouseEvent, messageContent: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuMessage(messageContent);
    setContextMenuAnchor({ x: e.clientX, y: e.clientY });
    setIsContextMenuOpen(true);
  });

  // Handle closing context menu
  const handleContextMenuClose = useLastCallback(() => {
    setIsContextMenuOpen(false);
  });

  // Handle context menu hide animation end
  const handleContextMenuHide = useLastCallback(() => {
    setContextMenuAnchor(undefined);
    setContextMenuMessage(undefined);
  });

  // Render skeleton loading for messages
  const renderMessagesSkeleton = () => (
    <div className="messages-skeleton">
      {/* User message skeleton */}
      <div className="Message message-list-item own first-in-group last-in-group">
        <div className="message-content-wrapper">
          <div className="message-content text">
            <div className="text-content with-meta">
              <Skeleton variant="rounded-rect" height={16} width={180} />
            </div>
          </div>
        </div>
      </div>

      {/* Agent message skeleton */}
      <div className="Message message-list-item first-in-group last-in-group">
        <Avatar size="small" previewUrl="/android-chrome-192x192.png" />
        <div className="message-content-wrapper">
          <div className="message-content text">
            <div className="text-content with-meta">
              <Skeleton variant="rounded-rect" height={16} width={280} />
              <div style="height: 8px" />
              <Skeleton variant="rounded-rect" height={16} width={240} />
              <div style="height: 8px" />
              <Skeleton variant="rounded-rect" height={16} width={320} />
            </div>
          </div>
        </div>
      </div>

      {/* User message skeleton */}
      <div className="Message message-list-item own first-in-group last-in-group">
        <div className="message-content-wrapper">
          <div className="message-content text">
            <div className="text-content with-meta">
              <Skeleton variant="rounded-rect" height={16} width={180} />
            </div>
          </div>
        </div>
      </div>

      {/* Another agent message skeleton */}
      <div className="Message message-list-item first-in-group last-in-group">
        <Avatar size="small" previewUrl="/android-chrome-192x192.png" />
        <div className="message-content-wrapper">
          <div className="message-content text">
            <div className="text-content with-meta">
              <Skeleton variant="rounded-rect" height={16} width={300} />
              <div style="height: 8px" />
              <Skeleton variant="rounded-rect" height={16} width={200} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="AlphaHumanThreadPage">
      <div className="alpha-human-thread-header">
        <div className="header-content">
          <h3 className="header-title">{threadTitle || 'New Chat'}</h3>
        </div>
      </div>
      <div className="alpha-human-thread-messages" ref={messagesContainerRef}>
        <div className="messages-container">
          {isLoading && messages.length === 0 && renderMessagesSkeleton()}
          {messages.map((message, index) => {
            const isOutgoing = message.sender === 'user';
            const isAgent = message.sender === 'agent';
            const { isFirstInGroup, isLastInGroup } = getMessageGroupPosition(index);

            // Render markdown for agent messages, plain text for user messages
            const renderedContent = isAgent
              ? renderText(message.content, ['emoji', 'br', 'simple_markdown', 'links'])
              : message.content;

            if (['text', 'toolStart', 'complete'].includes(message.type)) {
              return (
                <div
                  key={message.id}
                  className={buildClassName(
                    'Message message-list-item',
                    isOutgoing && 'own',
                    isFirstInGroup && 'first-in-group',
                    isLastInGroup && 'last-in-group',
                  )}
                >
                  {isAgent && isLastInGroup && (
                    <Avatar
                      size="small"
                      previewUrl="/android-chrome-192x192.png"
                    />
                  )}
                  {['complete', 'text'].includes(message.type) ? (
                    <div
                      className="message-content-wrapper"
                      onContextMenu={(e) => handleMessageContextMenu(e, message.content)}
                    >
                      <div className="message-content text">
                        <div className="text-content with-meta" dir="auto">
                          {renderedContent}
                          {/* todo: add message time */}
                          {/* <span className="AgMessageMeta">
                        <span className="message-time">
                          {formatTime(lang, messageDate)}
                        </span>
                      </span> */}
                        </div>
                      </div>
                    </div>
                  ) : message.type !== 'toolEnd' ? (
                    <div className="intermediate-step">
                      {renderedContent}
                    </div>
                  ) : <></>}
                </div>
              );
            } else {
              return <></>;
            }
          })}

          {/* Show unified agent response: analyzing or streaming content */}
          {isStreaming && (
            <div className={buildClassName('Message message-list-item first-in-group last-in-group')}>
              <Avatar size="small" previewUrl="/android-chrome-192x192.png" />
              <div className="message-content-wrapper">
                <div className="message-content text">
                  <div className="text-content with-meta" dir="auto">
                    <div className="analyzing-content">
                      <div className="analyzing-text-container">
                        <span className="analyzing-text">Analyzing your message...</span>
                        <div className="thinking-dots">
                          <span className="dot"></span>
                          <span className="dot"></span>
                          <span className="dot"></span>
                        </div>
                      </div>
                      {displayedStreamingContent ? (
                        // Show actual streaming content
                        <>
                          {renderText(displayedStreamingContent, ['emoji', 'br', 'simple_markdown', 'links'])}
                          <span className="streaming-cursor">▊</span>
                        </>
                      ) : (
                        <div className="analyzing-skeleton">
                          <Skeleton variant="rounded-rect" height={12} width={120} />
                          <div style="height: 4px" />
                          <Skeleton variant="rounded-rect" height={12} width={80} />
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="alpha-human-thread-composer">
        <div className="composer-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="composer-input"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={isStreaming}
          />
          <Button
            round
            size="smaller"
            color="primary"
            className="send-button"
            ariaLabel="Send"
            onClick={handleSend}
            disabled={isStreaming || !inputValue.trim()}
          >
            <Icon name="send" />
          </Button>
        </div>
      </div>

      {/* Context menu for copying messages */}
      <Menu
        ref={menuRef}
        isOpen={isContextMenuOpen}
        anchor={contextMenuAnchor}
        getTriggerElement={getTriggerElement}
        getRootElement={getRootElement}
        getMenuElement={getMenuElement}
        getLayout={getLayout}
        withPortal
        withMaxHeight
        className="AlphaHumanContextMenu"
        onClose={handleContextMenuClose}
        onCloseAnimationEnd={handleContextMenuHide}
      >
        <MenuItem
          icon="copy"
          onClick={handleCopyMessage}
        >
          Copy Text
        </MenuItem>
      </Menu>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global, ownProps): StateProps => {
    const { threadId } = ownProps;
    const threadIdString = threadId && typeof threadId === 'string' ? threadId : undefined;

    // Get messages from REST API data (threadMessages)
    const threadMessages = threadIdString ? global.alphahuman?.threadMessages?.[threadIdString] : undefined;
    const isLoading = threadIdString ? (global.alphahuman?.threadMessagesLoading?.[threadIdString] || false) : false;
    const thread = threadIdString ? global.alphahuman?.threads?.find((t) => t.id === threadIdString) : undefined;

    // Process messages from threadMessages (all messages are stored here, both historical and live)
    const messages = threadMessages?.messages?.map((msg) => {
      let content: string = msg.content || '';
      if (msg.type === 'toolStart') {
        const toolName = msg.extraMetadata?.toolName as string | undefined;
        const toolInput = (msg.extraMetadata?.toolInput as Record<string, unknown> | undefined) || {};

        if (toolName) {
          try {
            // Try to get human-readable description using the parser
            const humanReadable = toHumanReadableAction(toolName, toolInput);
            content = ` ${humanReadable}`;
          } catch (error) {
            // Fallback to simple description if parser fails
            content = `Tool ${toolName} started`;
          }
        } else {
          content = 'Tool started';
        }
      }

      if (msg.type === 'toolEnd') {
        const toolName = msg.extraMetadata?.toolName as string | undefined;

        if (toolName) {
          try {
            // For toolEnd, we might not have toolInput, so use empty object
            // The parser will still give us a useful description
            const toolInput = (msg.extraMetadata?.toolInput as Record<string, unknown> | undefined) || {};
            const humanReadable = toHumanReadableAction(toolName, toolInput);
            content = `✅ ${humanReadable}`;
          } catch (error) {
            // Fallback to simple description if parser fails
            content = `Tool ${toolName} completed`;
          }
        } else {
          content = 'Tool completed';
        }
      }

      // createdAt is a string from REST API, convert to Date for display
      const createdAt =
        typeof msg.createdAt === 'string'
          ? msg.createdAt
          : new Date(msg.createdAt || Date.now()).toISOString();

      return {
        id: msg.id,
        content,
        sender: msg.sender as 'user' | 'agent',
        createdAt,
        type: msg.type,
      };
    }).filter((msg) => msg.content !== '') || [];

    return {
      messages,
      isLoading,
      threadTitle: thread?.title,
      streamingContent: global.alphahuman?.streamingContent,
      isStreaming: global.alphahuman?.isStreaming,
    };
  },
)(AlphaHumanThreadPage));
