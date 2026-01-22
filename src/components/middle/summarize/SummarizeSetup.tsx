import type { FC } from '../../../lib/teact/teact';
import type { ChangeEvent } from 'react';
import { memo, useMemo, useState } from '../../../lib/teact/teact';
import { getActions, getGlobal, withGlobal } from '../../../global';

import type { ApiChat } from '../../../api/types';
import type { SummarizeChatInfo } from '../../../types';

import { selectChat } from '../../../global/selectors';
import {
  selectBusiestChats,
  selectIsLoadingBusiestChats,
  selectSelectedChatIds,
  selectIncludeArchived,
} from '../../../global/selectors/summarize';
import buildClassName from '../../../util/buildClassName';

import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';

import Avatar from '../../common/Avatar';
import Button from '../../ui/Button';
import Checkbox from '../../ui/Checkbox';
import SearchInput from '../../ui/SearchInput';
import Loading from '../../ui/Loading';
import Switcher from '../../ui/Switcher';

import './SummarizeSetup.scss';

type OwnProps = {
  isActive: boolean;
};

type StateProps = {
  busiestChats?: SummarizeChatInfo[];
  isLoading: boolean;
  selectedChatIds: string[];
  includeArchived: boolean;
};

const SummarizeSetup: FC<OwnProps & StateProps> = ({
  isActive,
  busiestChats,
  isLoading,
  selectedChatIds,
  includeArchived,
}) => {
  const {
    selectChatsForSummarize,
    generateSummaries,
    setIncludeArchived,
  } = getActions();

  const lang = useLang();
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedChatIds);

  const filteredChats = useMemo(() => {
    if (!busiestChats) return [];
    if (!searchQuery) return busiestChats;

    const global = getGlobal();
    const query = searchQuery.toLowerCase();
    return busiestChats.filter((chatInfo) => {
      const chat = selectChat(global, chatInfo.chatId);
      const title = chat?.title?.toLowerCase() || '';
      return title.includes(query);
    });
  }, [busiestChats, searchQuery]);

  const handleChatToggle = useLastCallback((chatId: string) => {
    setLocalSelectedIds((prev) => {
      if (prev.includes(chatId)) {
        return prev.filter((id) => id !== chatId);
      }
      return [...prev, chatId];
    });
  });

  const handleCreate = useLastCallback(() => {
    selectChatsForSummarize({ chatIds: localSelectedIds });
    generateSummaries();
  });

  const handleSearchChange = useLastCallback((value: string) => {
    setSearchQuery(value);
  });

  const handleIncludeArchivedToggle = useLastCallback((isChecked: boolean) => {
    setIncludeArchived({ includeArchived: isChecked });
  });

  const handleSwitcherChange = useLastCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleIncludeArchivedToggle(e.currentTarget.checked);
  });

  return (
    <div className="SummarizeSetup">
      <div className="SummarizeSetup__info">
        <div className="SummarizeSetup__info-card">
          <h2 className="SummarizeSetup__info-title">Summarize Your Most Busiest Chats</h2>
          <p className="SummarizeSetup__info-description">
            Get a daily digest of your busiest chats to catch up on what matters without reading every message.
            Save time and stay up-to-date in seconds.
          </p>
        </div>
      </div>

      <div className="SummarizeSetup__content">
        <div className="SummarizeSetup__content-inner">
          <h3 className="SummarizeSetup__content-header">Select the chats you want to summarize daily below.</h3>
          <div className="SummarizeSetup__search">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by chat name"
              canClose={false}
            />
          </div>

          {isLoading ? (
            <div className="SummarizeSetup__loading">
              <Loading />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="SummarizeSetup__empty">
              <p>No chats found.</p>
            </div>
          ) : (
            <div className="SummarizeSetup__chat-list">
              {filteredChats.map((chatInfo) => {
                const chat = selectChat(getGlobal(), chatInfo.chatId);
                if (!chat) return null;

                const isSelected = localSelectedIds.includes(chatInfo.chatId);

                return (
                  <div
                    key={chatInfo.chatId}
                    className={buildClassName(
                      'SummarizeSetup__chat-item',
                      isSelected && 'selected',
                    )}
                    onClick={() => handleChatToggle(chatInfo.chatId)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleChatToggle(chatInfo.chatId)}
                    />
                    <Avatar
                      peer={chat}
                      size="small"
                    />
                    <div className="SummarizeSetup__chat-info">
                      <div className="SummarizeSetup__chat-title">
                        {chat.title || 'Unknown Chat'}
                      </div>
                      <div className="SummarizeSetup__chat-meta">
                        {chatInfo.messageCount} messages in last 3 days
                      </div>
                    </div>
                    {isSelected && (
                      <div className="SummarizeSetup__chat-status">
                        Added
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="SummarizeSetup__footer">
            <div className="SummarizeSetup__toggle">
              <Switcher
                label="Include archived chats"
                checked={includeArchived}
                onChange={handleSwitcherChange}
                onCheck={handleIncludeArchivedToggle}
              />
              <span className="SummarizeSetup__toggle-label">Show archived chats</span>
            </div>
            <Button
              onClick={handleCreate}
              disabled={localSelectedIds.length === 0}
            >
              {localSelectedIds.length > 0
                ? `Create ${localSelectedIds.length} Summar${localSelectedIds.length === 1 ? 'y' : 'ies'} Daily`
                : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    return {
      busiestChats: selectBusiestChats(global),
      isLoading: selectIsLoadingBusiestChats(global),
      selectedChatIds: selectSelectedChatIds(global),
      includeArchived: selectIncludeArchived(global),
    };
  },
)(SummarizeSetup));
