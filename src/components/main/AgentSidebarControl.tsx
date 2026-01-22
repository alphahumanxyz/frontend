import type { FC } from '../../lib/teact/teact';
import { memo } from '../../lib/teact/teact';
import { getActions, withGlobal } from '../../global';

import { selectTabState } from '../../global/selectors';
import buildClassName from '../../util/buildClassName';

import useLastCallback from '../../hooks/useLastCallback';
import useLang from '../../hooks/useLang';

import Button from '../ui/Button';
import Icon from '../common/icons/Icon';

import styles from './AgentSidebarControl.module.scss';

interface StateProps {
  isAgentChatOpen?: boolean;
}

const AgentSidebarControl: FC<StateProps> = ({ isAgentChatOpen }) => {
  const { toggleAgentChat } = getActions();
  const lang = useLang();

  const handleToggle = useLastCallback(() => {
    toggleAgentChat();
  });

  return (
    <div className={styles.root}>
      <Button
        round
        size="smaller"
        color="translucent"
        className={buildClassName(styles.agentButton, isAgentChatOpen && styles.active)}
        onClick={handleToggle}
        ariaLabel={lang('AiAgent')}
      >
        <Icon name="bots" className={styles.icon} />
      </Button>
    </div>
  );
};

export default memo(withGlobal(
  (global): Complete<StateProps> => {
    const { agentChat } = selectTabState(global);

    return {
      isAgentChatOpen: agentChat?.isOpen,
    };
  },
)(AgentSidebarControl));