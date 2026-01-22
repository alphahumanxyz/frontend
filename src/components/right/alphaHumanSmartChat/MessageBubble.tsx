import type { FC } from '../../../lib/teact/teact';
import { memo } from '../../../lib/teact/teact';

import type { Message } from './AlphaHumanSmartChatScreen';

import buildClassName from '../../../util/buildClassName';
import { formatTime } from '../../../util/dates/dateFormat';
import renderText from '../../common/helpers/renderText';

import useOldLang from '../../../hooks/useOldLang';

import styles from './AgentSidebar.module.scss';

type OwnProps = {
  message: Message;
  className?: string;
  isStreaming?: boolean;
};

const MessageBubble: FC<OwnProps> = ({
  message,
  className,
  isStreaming = false,
}) => {
  const { content, sender, timestamp } = message;
  const lang = useOldLang();

  // Render markdown for agent messages, plain text for user messages
  const renderedContent = sender === 'agent'
    ? renderText(content, ['emoji', 'br', 'simple_markdown', 'links'])
    : content;

  return (
    <div
      className={buildClassName(
        styles.messageBubble,
        sender === 'user' ? styles.messageBubbleUser : styles.messageBubbleAgent,
        isStreaming && styles.messageBubbleStreaming,
        className,
      )}
    >
      <div className={styles.messageContent}>
        {renderedContent}
        {isStreaming && <span className={styles.streamingCursor}>▊</span>}
      </div>
      {!isStreaming && (
        <div className={styles.messageTime}>
          {formatTime(lang, timestamp)}
        </div>
      )}
    </div>
  );
};

export default memo(MessageBubble);
