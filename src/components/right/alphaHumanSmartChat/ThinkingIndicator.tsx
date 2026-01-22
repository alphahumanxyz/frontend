import type { FC } from '../../../lib/teact/teact';
import { memo } from '../../../lib/teact/teact';

import buildClassName from '../../../util/buildClassName';

import styles from './AgentSidebar.module.scss';

type OwnProps = {
  className?: string;
};

const ThinkingIndicator: FC<OwnProps> = ({ className }) => {
  return (
    <div className={buildClassName(styles.messageBubble, styles.messageBubbleAgent, className)}>
      <div className={styles.thinkingIndicator}>
        <span className={styles.thinkingText}>
          Thinking...
        </span>
        <div className={styles.thinkingDots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </div>
    </div>
  );
};

export default memo(ThinkingIndicator);
