import type { FC } from '@teact';
import { memo, useEffect, useMemo, useRef } from '@teact';
import { getActions, withGlobal } from '../../global';

import { selectCurrentMessageList } from '../../global/selectors';
import { selectAlphahumanThreadsCache } from '../../global/selectors/alphaHumanThread';

import useLastCallback from '../../hooks/useLastCallback';
import useOldLang from '../../hooks/useOldLang';

import ListItem from '../ui/ListItem';
import Skeleton from '../ui/placeholder/Skeleton';

import './ThreadHistory.scss';

export interface OwnProps {
  isActive: boolean;
  onClose: (shouldScrollUp?: boolean) => void;
}

type ThreadsData = {
  byId: Record<string, ThreadData>;
  activeThreadId?: string;
  orderedIds: string[];
};

type StateProps = {
  threads?: ThreadsData;
  alphahumanThreads?: Array<{ id: string; title: string; lastMessageAt?: string; createdAt: string }>;
  alphahumanThreadsLoading?: boolean;
  alphahumanThreadsError?: Error;
  chatId?: string;
};

type ThreadData = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  chatId?: string;
  messages: Array<{
    id: string;
    content: string;
    sender: 'user' | 'agent';
    timestamp: Date;
  }>;
};

const ThreadHistory: FC<OwnProps & StateProps> = ({
  isActive,
  onClose,
  threads,
  alphahumanThreads,
  alphahumanThreadsLoading,
  alphahumanThreadsError,
  chatId,
}) => {
  const { openAlphaHumanThread, loadAlphahumanThreads } = getActions();
  const lang = useOldLang();
  const hasAttemptedLoadRef = useRef(false);

  // Load alphahuman threads when component becomes active, only once
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

  const handleThreadClick = useLastCallback((e: any, threadId?: string) => {
    if (!threadId) return;
    openAlphaHumanThread({ threadId });
    onClose(false);
  });

  // Get sorted threads from threadsCache, filtered by chatId
  const sortedThreads = useMemo((): ThreadData[] => {
    if (!threads?.byId) return [];

    // Filter threads based on active chatId
    // If chatId is empty/undefined, show threads with empty chatId
    // If chatId is set, show only threads that match that chatId
    const filteredThreads = Object.values(threads.byId).filter((thread) => {
      const threadChatId = String(thread.chatId) || '';
      const activeChatId = chatId || '';
      // If active chatId is empty, show threads with empty chatId
      if (!activeChatId) {
        return !threadChatId || threadChatId === '';
      }

      // If active chatId is set, show only threads that match
      return threadChatId === activeChatId;
    });

    // Sort by timestamp (most recent first)
    return filteredThreads.sort((a, b) => {
      const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
      const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
      return bTime - aTime;
    });
  }, [threads, chatId]);

  // Render skeleton loading for threads
  const renderThreadSkeletons = () => (
    <div className="thread-list loading">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={`skeleton-${index}`} className="thread-item">
          <Skeleton width={350} height={40} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="ThreadHistory">
      <div className="thread-list-wrapper">
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
                key={thread.id}
                className="thread-item"
                onClick={handleThreadClick}
                clickArg={thread.id}
              >
                <div className="thread-title">{thread.title || 'New Chat'}</div>
              </ListItem>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const threads = selectAlphahumanThreadsCache(global);
    const { chatId } = selectCurrentMessageList(global) || {};
    return {
      threads: threads as ThreadsData | undefined,
      alphahumanThreads: global.alphahuman?.threads,
      alphahumanThreadsLoading: global.alphahuman?.threadsLoading,
      alphahumanThreadsError: global.alphahuman?.threadsError,
      chatId,
    };
  },
)(ThreadHistory));
