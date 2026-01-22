import type { FC } from '../../lib/teact/teact';
import { memo } from '../../lib/teact/teact';

import buildClassName from '../../util/buildClassName';

import Icon from '../common/icons/Icon';

import styles from './ControlBar.module.scss';

interface OwnProps {
  className?: string;
}

const ControlBar: FC<OwnProps> = ({ className }) => {
  return (
    <div className={buildClassName(styles.root, className)}>
      <div className={styles.section}>
        {/* <button
          className={styles.controlButton}
          aria-label="AI Agent"
          title="AI Agent"
        >
          <Icon name="bots" />
        </button> */}

        <button
          className={styles.controlButton}
          aria-label="Settings"
          title="Settings"
        >
          <Icon name="settings" />
        </button>
      </div>
    </div>
  );
};

export default memo(ControlBar);
