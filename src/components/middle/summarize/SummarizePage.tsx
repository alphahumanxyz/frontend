import type { FC } from '../../../lib/teact/teact';
import { memo, useEffect, useMemo, useRef, useState } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { ApiChat } from '../../../api/types';
import type { ChatSummary } from '../../../types';

import { selectChat } from '../../../global/selectors';
import {
  selectFilteredSummaries,
  selectIsLoadingSummaries,
  selectIsSummarizeSetupComplete,
  selectSummarizeSearchQuery,
  selectSelectedChatIds,
  selectSummarizeSelectedDate,
} from '../../../global/selectors/summarize';
import captureEscKeyListener from '../../../util/captureEscKeyListener';

import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';

import Avatar from '../../common/Avatar';
import Button from '../../ui/Button';
import Loading from '../../ui/Loading';
import Icon from '../../common/icons/Icon';
import TabList from '../../ui/TabList';
import type { TabWithProperties } from '../../ui/TabList';
import SummarizeSetup from './SummarizeSetup';
import SummaryCard from './SummaryCard';
import SummaryCardLoading from './SummaryCardLoading';

import './SummarizePage.scss';

export type OwnProps = {
  isActive: boolean;
};

type StateProps = {
  isSetupComplete: boolean;
  summaries: ChatSummary[];
  isLoadingSummaries: boolean;
  searchQuery?: string;
  selectedChatIds: string[];
  selectedDate?: number;
};

const SummarizePage: FC<OwnProps & StateProps> = ({
  isActive,
  isSetupComplete,
  summaries,
  isLoadingSummaries,
  searchQuery,
  selectedChatIds,
  selectedDate,
}) => {
  const {
    openSummarizePage,
    closeSummarizePage,
    generateSummaries,
    markSummaryAsRead,
    resetSummarizeSetup,
    setSummarizeSelectedDate,
  } = getActions();

  const lang = useLang();
  const containerRef = useRef<HTMLDivElement>();
  const [isTabLoading, setIsTabLoading] = useState(false);

  useEffect(() => {
    if (isActive) {
      openSummarizePage();
    }
  }, [isActive]);

  useEffect(() => {
    if (!isSetupComplete && selectedChatIds.length > 0) {
      generateSummaries();
    }
  }, [isSetupComplete, selectedChatIds, generateSummaries]);

  useEffect(() => {
    return captureEscKeyListener(() => {
      closeSummarizePage();
    });
  }, [closeSummarizePage]);

  const handleSummaryClick = useLastCallback((chatId: string, date: number) => {
    markSummaryAsRead({ chatId, date });
  });

  // Group summaries by date
  const summariesByDate = useMemo(() => {
    const grouped: Record<number, ChatSummary[]> = {};
    summaries.forEach((summary) => {
      if (!grouped[summary.date]) {
        grouped[summary.date] = [];
      }
      grouped[summary.date].push(summary);
    });
    return grouped;
  }, [summaries]);

  // Get unique dates sorted in descending order (newest first)
  const availableDates = useMemo(() => {
    return Object.keys(summariesByDate)
      .map(Number)
      .sort((a, b) => b - a);
  }, [summariesByDate]);

  // Set default selected date to today or most recent date
  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Math.floor(today.getTime() / 1000);

      // Use today if available, otherwise use the most recent date
      const defaultDate = availableDates.includes(todayTimestamp)
        ? todayTimestamp
        : availableDates[0];

      setSummarizeSelectedDate({ date: defaultDate });
    }
  }, [selectedDate, availableDates, setSummarizeSelectedDate]);

  // Get summaries for selected date
  const filteredSummaries = useMemo(() => {
    if (!selectedDate) return [];
    return summariesByDate[selectedDate] || [];
  }, [selectedDate, summariesByDate]);

  // Create tabs for dates
  const dateTabs: TabWithProperties[] = useMemo(() => {
    return availableDates.map((date) => {
      const dateObj = new Date(date * 1000);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isToday = date === Math.floor(today.getTime() / 1000);
      const isYesterday = date === Math.floor((today.getTime() - 86400000) / 1000);

      let title: string;
      if (isToday) {
        title = 'Today';
      } else if (isYesterday) {
        title = 'Yesterday';
      } else {
        title = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: dateObj.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        });
      }

      return {
        id: date,
        title,
      };
    });
  }, [availableDates]);

  const activeTabIndex = useMemo(() => {
    if (!selectedDate) return 0;
    return availableDates.indexOf(selectedDate);
  }, [selectedDate, availableDates]);

  const handleTabSwitch = useLastCallback((index: number) => {
    const date = availableDates[index];
    setIsTabLoading(true);
    setSummarizeSelectedDate({ date });
    
    // Show skeleton loading for 1 second
    setTimeout(() => {
      setIsTabLoading(false);
    }, 1000);
  });


  if (!isSetupComplete) {
    return <SummarizeSetup isActive={isActive} />;
  }

  return (
    <div ref={containerRef} className="SummarizePage">
      <div className="SummarizePage__info">
        <div className="SummarizePage__info-card">
          <h2 className="SummarizePage__info-title">Daily Summaries</h2>
          <p className="SummarizePage__info-description">
            AI-powered summaries of your busiest chats. Get caught up on what matters without reading every message.
          </p>
        </div>
      </div>

      <div className="SummarizePage__edit-button">
        <Button
          round
          color="primary"
          onClick={() => resetSummarizeSetup()}
          ariaLabel="Reselect Chats"
        >
          <Icon name="settings" />
        </Button>
      </div>

      <div className="SummarizePage__content">
        <div className="SummarizePage__content-inner">
          {availableDates.length > 0 && (
            <div className="SummarizePage__date-tabs">
              <TabList
                tabs={dateTabs}
                activeTab={activeTabIndex}
                onSwitchTab={handleTabSwitch}
              />
            </div>
          )}

          {isLoadingSummaries ? (
            <div className="SummarizePage__summaries">
              {selectedChatIds.map((chatId) => (
                <SummaryCardLoading
                  key={chatId}
                  chatId={chatId}
                />
              ))}
            </div>
          ) : isTabLoading ? (
            <div className="SummarizePage__skeleton">
              <div className="SummarizePage__skeleton-card" />
              <div className="SummarizePage__skeleton-card" />
              <div className="SummarizePage__skeleton-card" />
            </div>
          ) : filteredSummaries.length === 0 ? (
            <div className="SummarizePage__empty">
              <p>No summaries available for this date.</p>
              <p className="SummarizePage__empty-subtitle">
                Summaries will appear here once chats are selected and messages are available.
              </p>
            </div>
          ) : (
            <div className="SummarizePage__summaries">
              {filteredSummaries.map((summary) => (
                <SummaryCard
                  key={`${summary.chatId}-${summary.date}`}
                  summary={summary}
                  onClick={() => handleSummaryClick(summary.chatId, summary.date)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    return {
      isSetupComplete: selectIsSummarizeSetupComplete(global),
      summaries: selectFilteredSummaries(global),
      isLoadingSummaries: selectIsLoadingSummaries(global),
      searchQuery: selectSummarizeSearchQuery(global),
      selectedChatIds: selectSelectedChatIds(global),
      selectedDate: selectSummarizeSelectedDate(global),
    };
  },
)(SummarizePage));
