import type { FC } from '../../../lib/teact/teact';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { AlphaHumanManagerState } from '../../../lib/alphahuman/types';

import { log } from '../../../lib/alphahuman/logger';
import { requestMutation } from '../../../lib/fasterdom/fasterdom';
import { selectCurrentMessageList } from '../../../global/selectors';
import { selectAlphahumanThreadsCache } from '../../../global/selectors/alphaHumanThread';
import buildClassName from '../../../util/buildClassName';
import renderText from '../../common/helpers/renderText';

import Skeleton from '../../ui/placeholder/Skeleton';
import ChatInput from './ChatInput';
import WelcomeMessage from './WelcomeMessage';

import styles from './AgentSidebar.module.scss';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

type OwnProps = {
  className?: string;
};

type StateProps = {
  socketState?: AlphaHumanManagerState;
  streamingContent?: string;
  isStreaming?: boolean;
  activeTools?: Record<string, {
    name: string;
    status: 'starting' | 'active' | 'completed';
    startTime: number;
  }>;
  threads?: {
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
  };
  isLoadingMessages?: boolean;
  chatId?: string;
};

const AlphaHumanSmartChatScreen: FC<OwnProps & StateProps> = ({
  className,
  socketState,
  streamingContent,
  isStreaming,
  activeTools,
  threads,
  isLoadingMessages,
  chatId,
}) => {
  const {
    streamAlphaHumanMessage,
    loadAlphahumanThreadMessages,
  } = getActions();
  const scrollRef = useRef<HTMLDivElement>();
  const scrollAnimationFrameRef = useRef<number>();

  const scrollToBottom = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Cancel any pending scroll animation
    if (scrollAnimationFrameRef.current) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
    }

    // Use requestAnimationFrame for smooth scrolling during streaming
    // Read scrollHeight before requestMutation (fasterdom requires measurements outside mutations)
    scrollAnimationFrameRef.current = requestAnimationFrame(() => {
      const scrollHeight = container.scrollHeight;
      requestMutation(() => {
        container.scrollTop = scrollHeight;
      });
    });
  }, []);

  // Get messages from active thread
  const activeThreadId = threads?.activeThreadId;
  const activeThread = activeThreadId ? threads?.byId[activeThreadId] : undefined;
  const messages = useMemo(() => {
    return activeThread?.messages || [];
  }, [activeThread?.messages]);
  const isThinking = Boolean(isStreaming && !streamingContent);

  // Load messages when activeThreadId changes (similar to AlphaHumanThreadPage)
  useEffect(() => {
    if (activeThreadId && typeof activeThreadId === 'string') {
      loadAlphahumanThreadMessages({ threadId: activeThreadId });
    }
  }, [activeThreadId, loadAlphahumanThreadMessages]);
  // Throttle streaming content updates using requestAnimationFrame
  const [displayedStreamingContent, setDisplayedStreamingContent] = useState<string>('');
  const rafRef = useRef<number>();

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

  const handleSendMessage = useCallback((content: string) => {
    log('REQUEST', 'Sending message:', { content, chatId, threadId: activeThreadId });
    streamAlphaHumanMessage({ threadId: activeThreadId, content, chatId });
  }, [streamAlphaHumanMessage, activeThreadId, chatId]);

  // Format timestamp for display (matching ConversationView)
  const formatTime = useCallback((timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  }, []);

  // Render loading skeleton for messages
  const renderMessagesSkeleton = () => (
    <>
      {/* User message skeleton */}
      <div className={buildClassName(styles.messageWrapper, styles.messageOutgoing)}>
        <div className={buildClassName(styles.messageBubble, styles.messageBubbleUser)}>
          <div className={styles.messageContent}>
            <Skeleton variant="rounded-rect" height={16} width={180} />
          </div>
        </div>
      </div>

      {/* Agent message skeleton */}
      <div className={styles.messageWrapper}>
        <div className={styles.messageAvatar}>
          <div className={styles.aiAvatar}>AI</div>
        </div>
        <div className={buildClassName(styles.messageBubble, styles.messageBubbleAgent)}>
          <div className={styles.messageContent}>
            <Skeleton variant="rounded-rect" height={16} width={280} />
            <div className={styles.skeletonSpacer} />
            <Skeleton variant="rounded-rect" height={16} width={240} />
            <div className={styles.skeletonSpacer} />
            <Skeleton variant="rounded-rect" height={16} width={320} />
          </div>
        </div>
      </div>

      {/* Another user message skeleton */}
      <div className={buildClassName(styles.messageWrapper, styles.messageOutgoing)}>
        <div className={buildClassName(styles.messageBubble, styles.messageBubbleUser)}>
          <div className={styles.messageContent}>
            <Skeleton variant="rounded-rect" height={16} width={200} />
          </div>
        </div>
      </div>
    </>
  );

  // Auto-scroll to bottom when messages or streaming content changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedStreamingContent, isThinking, scrollToBottom]);

  return (
    <div className={buildClassName(styles.chatScreen, className)}>
      <div ref={scrollRef} className={styles.messagesContainer}>
        {isLoadingMessages && messages.length === 0 ? (
          renderMessagesSkeleton()
        ) : (
          <>
            {messages.length === 0 && !displayedStreamingContent && !isThinking && <WelcomeMessage />}

            {messages.map((message) => (
              <div
                key={message.id}
                className={buildClassName(
                  styles.messageWrapper,
                  message.sender === 'user' && styles.messageOutgoing,
                )}
              >
                {message.sender === 'agent' && (
                  <div className={styles.messageAvatar}>
                    <div className={styles.aiAvatar}>AI</div>
                  </div>
                )}
                <div
                  className={buildClassName(
                    styles.messageBubble,
                    message.sender === 'user' ? styles.messageBubbleUser : styles.messageBubbleAgent,
                  )}
                >
                  <div className={styles.messageContent}>
                    {message.sender === 'agent'
                      ? renderText(message.content, ['emoji', 'br', 'simple_markdown', 'links'])
                      : message.content}
                  </div>
                  <div className={styles.messageTime}>
                    {message.sender === 'user' && '✓ '}
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Show active tools */}
            {activeTools && Object.keys(activeTools).length > 0 && (
              <div className={styles.toolIndicators}>
                {Object.values(activeTools).map((tool) => {
                  const statusText = tool.status === 'starting' ? 'Starting...'
                    : tool.status === 'active' ? 'Running...'
                      : 'Completed';
                  return (
                    <div key={tool.name} className={styles.toolIndicator}>
                      <span className={styles.toolName}>{tool.name}</span>
                      <span className={styles.toolStatus}>{statusText}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Show streaming content if available */}
            {displayedStreamingContent && (
              <div className={styles.messageWrapper}>
                <div className={styles.messageAvatar}>
                  <div className={styles.aiAvatar}>AI</div>
                </div>
                <div className={buildClassName(styles.messageBubble, styles.messageBubbleAgent)}>
                  <div className={styles.messageContent}>
                    {renderText(displayedStreamingContent, ['emoji', 'br', 'simple_markdown', 'links'])}
                  </div>
                </div>
              </div>
            )}

            {isThinking && !displayedStreamingContent && (
              <div className={styles.messageWrapper}>
                <div className={styles.messageAvatar}>
                  <div className={styles.aiAvatar}>AI</div>
                </div>
                <div className={buildClassName(styles.messageBubble, styles.messageBubbleAgent)}>
                  <div className={styles.messageContent}>
                    Thinking...
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ChatInput onSend={handleSendMessage} disabled={isThinking} />
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const threads = selectAlphahumanThreadsCache(global);
    const activeThreadId = threads?.activeThreadId;
    const isLoadingMessages = activeThreadId
      ? (global.alphahuman?.threadMessagesLoading?.[activeThreadId] || false)
      : false;
    const { chatId } = selectCurrentMessageList(global) || {};

    return {
      socketState: global.alphahuman?.socketState,
      streamingContent: global.alphahuman?.streamingContent,
      isStreaming: global.alphahuman?.isStreaming,
      activeTools: global.alphahuman?.activeTools,
      threads,
      isLoadingMessages,
      chatId,
    };
  },
)(AlphaHumanSmartChatScreen));
