import type { FC } from '../../../lib/teact/teact';
import { memo } from '../../../lib/teact/teact';

import buildClassName from '../../../util/buildClassName';

import styles from './AgentSidebar.module.scss';

type OwnProps = {
  className?: string;
};

const WelcomeMessage: FC<OwnProps> = ({ className }) => {
  return (
    <div className={buildClassName(styles.welcomeMessage, className)}>
      <div className={styles.welcomeIcon}>🤖</div>
      <div className={styles.welcomeTitle}>
        This is your Smart Chat
      </div>
      <div className={styles.welcomeDescription}>
        Ask questions about the current chat to get things done faster and smarter.
      </div>
      <div className={styles.welcomeExamples}>
        <div className={styles.exampleTitle}>
          Examples:
        </div>
        <div className={styles.exampleItem}>
          &quot;Analyze the tone of the current chat and give me a good response.&quot;
        </div>
        <div className={styles.exampleItem}>
          &quot;Find me the most active people in the current chat.&quot;
        </div>
        <div className={styles.exampleItem}>
          &quot;Write a summary of the current chat&quot;
        </div>
      </div>
    </div>
  );
};

export default memo(WelcomeMessage);
