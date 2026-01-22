import type { FC } from '../../../lib/teact/teact';
import { memo, useEffect, useRef } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { AlphahumanThread } from '../../../lib/alphahuman/rest';

import buildClassName from '../../../util/buildClassName';

import useHistoryBack from '../../../hooks/useHistoryBack';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';
import useShowTransitionDeprecated from '../../../hooks/useShowTransitionDeprecated';

import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';
import ListItem from '../../ui/ListItem';
import Skeleton from '../../ui/placeholder/Skeleton';

import './AlphahumanSidebar.scss';

export type OwnProps = {
  isActive: boolean;
  currentChatId?: string;
  onReset: () => void;
};

type StateProps = {
  alphahumanThreads?: AlphahumanThread[];
  alphahumanThreadsLoading?: boolean;
  alphahumanThreadsError?: Error;
};

const AlphahumanSidebar: FC<OwnProps & StateProps> = ({
  isActive,
  currentChatId,
  onReset,
  alphahumanThreads,
  alphahumanThreadsLoading,
  alphahumanThreadsError,
}) => {
  const { openChat, loadAlphahumanThreads, openAlphaHumanThread } = getActions();
  const lang = useOldLang();
  const hasAttemptedLoadRef = useRef(false);

  // Load alphahuman threads when sidebar becomes active, only once
  useEffect(() => {
    if (!isActive) {
      hasAttemptedLoadRef.current = false;
      return;
    }

    // Only load if:
    // 1. We haven't attempted to load yet
    // 2. Not currently loading
    // 3. No threads loaded yet (undefined or empty array)
    // 4. No error from previous attempt
    if (
      !hasAttemptedLoadRef.current
      && !alphahumanThreadsLoading
      && (!alphahumanThreads || alphahumanThreads.length === 0)
      && !alphahumanThreadsError
    ) {
      hasAttemptedLoadRef.current = true;
      loadAlphahumanThreads();
    }
  }, [isActive, alphahumanThreads, alphahumanThreadsLoading, alphahumanThreadsError, loadAlphahumanThreads]);

  useHistoryBack({
    isActive,
    onBack: onReset,
  });

  const {
    shouldRender: shouldRenderTitle,
    transitionClassNames: titleClassNames,
  } = useShowTransitionDeprecated(true, undefined, undefined, false);

  const handleThreadClick = useLastCallback((e: any, threadId?: string) => {
    if (!threadId) return;
    openAlphaHumanThread({ threadId });
  });

  const handleNewThread = useLastCallback(() => {
    openChat({ id: undefined });
  });

  // const handleOpenSummaries = useLastCallback(() => {
  //   openSummarizePage();
  // });8

  const renderThreadSkeletons = () => {
    return (
      <div className="thread-list loading">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={`skeleton-${index}`} className="thread-item">
            <Skeleton width={350} height={40} />
          </div>
        ))}
      </div>
    );
  };

  // Sort alphahuman threads by lastMessageAt (most recent first)
  const sortedThreads = (alphahumanThreads || [])
    .filter((thread) => !thread.chatId)
    .slice()
    .sort((a, b) => {
      const aDate = new Date(a.lastMessageAt || a.createdAt).getTime();
      const bDate = new Date(b.lastMessageAt || b.createdAt).getTime();
      return bDate - aDate;
    });

  return (
    <div className="AlphahumanSidebar">
      <div className={buildClassName('left-header', 'left-header-shadow')}>
        <Button
          round
          size="smaller"
          color="translucent"
          onClick={onReset}
          ariaLabel="Return to chat list"
          iconName="arrow-left"
        />
        {shouldRenderTitle && <h3 className={titleClassNames}>AlphaHuman Menu</h3>}
      </div>
      <div className="thread-list-wrapper">
        <div className="cta-buttons cta-buttons-inline" onClick={handleNewThread}>
          <div>
            <p className="cta-title">New Chat</p>
            <p className="cta-decription">Create a new chat with the AlphaHuman AI</p>
          </div>
          <Button
            className="cta-button cta-fab"
            size="smaller"
            round
            color="primary"
            ariaLabel="New Chat"
          >
            <Icon name="add" />
          </Button>
        </div>
        {/* <div className="cta-buttons cta-buttons-inline" onClick={handleOpenSummaries}>
          <div>
            <p className="cta-title">Chat Summaries</p>
            <p className="cta-decription">Summaries of your busiest chats</p>
          </div>
          <Button
            className="cta-button cta-fab"
            size="smaller"
            round
            color="primary"
            ariaLabel="Open AI Summaries"
          >
            <Icon name="document" />
          </Button>
        </div> */}
        <div className="cta-thread-title">
          <div className="cta-thread-title-text">Your AlphaHuman Threads</div>
        </div>
        {alphahumanThreadsLoading ? (
          renderThreadSkeletons()
        ) : sortedThreads.length === 0 ? (
          <div className="empty-state">
            <p>{lang('NoThreads') || 'No threads available'}</p>
          </div>
        ) : (
          <div className="thread-list">
            {sortedThreads.map((thread) => (
              <ListItem
                key={thread.id.toString()}
                className="thread-item"
                onClick={handleThreadClick}
                clickArg={thread.id.toString()}
              >
                <div className="thread-title">{thread.title || `New Chat`}</div>
              </ListItem>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => ({
    alphahumanThreads: global.alphahuman?.threads,
    alphahumanThreadsLoading: global.alphahuman?.threadsLoading,
    alphahumanThreadsError: global.alphahuman?.threadsError,
  }),
)(AlphahumanSidebar));
