import { memo } from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';

import { selectIsSummarizePageOpen } from '../../../global/selectors/summarize';

import useHistoryBack from '../../../hooks/useHistoryBack';

import { getActions } from '../../../global';

type StateProps = {
  isSummarizePageOpen: boolean;
};

const SummarizeHistoryHandler = ({ isSummarizePageOpen }: StateProps) => {
  const { closeSummarizePage } = getActions();

  useHistoryBack({
    isActive: isSummarizePageOpen,
    hash: 'summarize',
    onBack: closeSummarizePage,
  });

  return undefined;
};

export default memo(withGlobal<Record<string, never>>(
  (global): StateProps => {
    return {
      isSummarizePageOpen: selectIsSummarizePageOpen(global),
    };
  },
)(SummarizeHistoryHandler));
