import { memo } from '../../lib/teact/teact';
import { withGlobal } from '../../global';
import { getActions } from '../../global';

import { selectAlphaHumanThreadId, selectIsAlphaHumanThreadOpen } from '../../global/selectors/alphaHumanThread';

import useHistoryBack from '../../hooks/useHistoryBack';

type StateProps = {
  isAlphaHumanThreadOpen: boolean;
  alphaHumanThreadId?: string;
};

const AlphaHumanThreadHistoryHandler = ({
  isAlphaHumanThreadOpen,
  alphaHumanThreadId,
}: StateProps) => {
  const { closeAlphaHumanThread } = getActions();

  const hash = alphaHumanThreadId ? `at-${alphaHumanThreadId}` : undefined;

  useHistoryBack({
    isActive: isAlphaHumanThreadOpen,
    hash,
    onBack: closeAlphaHumanThread,
  });

  return undefined;
};

export default memo(withGlobal<Record<string, never>>(
  (global): StateProps => {
    return {
      isAlphaHumanThreadOpen: selectIsAlphaHumanThreadOpen(global),
      alphaHumanThreadId: selectAlphaHumanThreadId(global)?.toString(),
    };
  },
)(AlphaHumanThreadHistoryHandler));
