import type { FC } from '../../../lib/teact/teact';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { AlphaHumanManagerState } from '../../../lib/alphahuman/types';

import { requestMutation } from '../../../lib/fasterdom/fasterdom';
import { selectAlphahumanThreadsCache } from '../../../global/selectors/alphaHumanThread';
import buildClassName from '../../../util/buildClassName';
import renderText from '../../common/helpers/renderText';

import useLastCallback from '../../../hooks/useLastCallback';

import styles from './MiddleColumnWelcome.module.scss';

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
};

const ConversationView: FC<OwnProps & StateProps> = ({
  className,
  socketState,
  streamingContent,
  isStreaming,
  activeTools,
  threads,
}) => {
  const { streamAlphaHumanMessage } = getActions();
  const scrollRef = useRef<HTMLDivElement>();
  const scrollAnimationFrameRef = useRef<number>();
  const [inputValue, setInputValue] = useState('');

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
  const messages = useMemo(() => activeThread?.messages || [], [activeThread?.messages]);
  const isThinking = Boolean(isStreaming && !streamingContent);

  // Messages are now managed via threadMessages and the selector
  // No need for this safety mechanism as messages are added when sent via streamAlphaHumanMessage

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

  const handleInputChange = useLastCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  });

  const handleInputSubmit = useLastCallback(() => {
    if (!inputValue.trim()) return;

    const message = inputValue.trim();
    setInputValue('');
    streamAlphaHumanMessage({ threadId: activeThreadId, content: message });
  });

  const handleKeyDown = useLastCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputSubmit();
    }
  });

  // Auto-scroll to bottom when messages or streaming content changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedStreamingContent, isThinking, scrollToBottom]);

  // Format timestamp for display
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

  return (
    <div className={buildClassName(styles.root, styles.conversationView, className)}>
      <div className={styles.conversationContent}>
        <div ref={scrollRef} className={styles.messagesContainer}>
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
        </div>

        {/* Input at bottom */}
        <div className={styles.promptCard}>
          <div className={styles.promptContainer}>
            <textarea
              className={styles.input}
              placeholder="Message..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isThinking}
            />
            <button
              className={buildClassName(
                styles.sendButton,
                styles.sendButtonPurple,
                inputValue.trim() && styles.sendButtonActive,
              )}
              onClick={handleInputSubmit}
              disabled={!inputValue.trim() || isThinking}
              type="button"
              aria-label="Send"
            >
              <i className="icon icon-send" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    return {
      socketState: global.alphahuman?.socketState,
      streamingContent: global.alphahuman?.streamingContent,
      isStreaming: global.alphahuman?.isStreaming,
      activeTools: global.alphahuman?.activeTools,
      threads: selectAlphahumanThreadsCache(global),
    };
  },
)(ConversationView));
