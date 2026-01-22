import type { FC } from '../../../lib/teact/teact';
import { memo } from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';

import { selectChat } from '../../../global/selectors';

import Avatar from '../../common/Avatar';
import Loading from '../../ui/Loading';

import './SummaryCardLoading.scss';

type OwnProps = {
  chatId: string;
};

type StateProps = {
  chat?: ReturnType<typeof selectChat>;
};

const SummaryCardLoading: FC<OwnProps & StateProps> = ({
  chat,
}) => {
  return (
    <div className="SummaryCardLoading">
      <div className="SummaryCardLoading__header">
        <Avatar
          peer={chat}
          size="small"
        />
        <div className="SummaryCardLoading__header-info">
          <div className="SummaryCardLoading__chat-title">
            {chat?.title || 'Loading...'}
          </div>
          <div className="SummaryCardLoading__status">Generating summary...</div>
        </div>
      </div>

      <div className="SummaryCardLoading__content">
        <Loading />
      </div>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global, { chatId }): StateProps => {
    return {
      chat: selectChat(global, chatId),
    };
  },
)(SummaryCardLoading));
