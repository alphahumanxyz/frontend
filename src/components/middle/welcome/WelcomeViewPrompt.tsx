import { memo, useMemo } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { GlobalState } from '../../../global/types';

import { isChatChannel, isChatGroup } from '../../../global/helpers';
import buildClassName from '../../../util/buildClassName';

import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';

import styles from './MiddleColumnWelcome.module.scss';
import notionLogo from './notion.png';
import googleLogo from './google.png';

type OwnProps = {
  currentUserFirstName?: string;
  chatIds?: string[];
  chats?: GlobalState['chats']['byId'];
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onInputSubmit: () => void;
  onSuggestionClick: (suggestion: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

type StateProps = {
  notionOAuth?: {
    isConnecting?: boolean;
    isConnected?: boolean;
    error?: string;
  };
  googleOAuth?: {
    isConnecting?: boolean;
    isConnected?: boolean;
    error?: string;
  };
};

type WelcomeViewPromptProps = OwnProps & StateProps;

const WelcomeViewPrompt = ({
  currentUserFirstName,
  chatIds,
  chats,
  inputValue,
  onInputChange,
  onInputSubmit,
  onSuggestionClick,
  onKeyDown,
  notionOAuth,
  googleOAuth,
}: WelcomeViewPromptProps) => {
  const { connectToNotion, connectToGoogle } = getActions();
  const lang = useLang();

  const contextualSuggestions = useMemo(() => {
    if (!chatIds || chatIds.length === 0 || !chats) {
      return [
        'Help me write a professional email',
        'Summarize my recent conversations',
        'Create a meeting agenda',
        'Draft a project proposal',
      ];
    }

    const suggestions: string[] = [];

    // Get up to 5 chats (prioritize groups and channels)
    const chatObjects = chatIds
      .slice(0, 20)
      .map((id) => chats[id])
      .filter(Boolean)
      .sort((a, b) => {
        // Prioritize groups and channels
        const aIsGroup = isChatGroup(a) || isChatChannel(a);
        const bIsGroup = isChatGroup(b) || isChatChannel(b);
        if (aIsGroup && !bIsGroup) return -1;
        if (!aIsGroup && bIsGroup) return 1;
        return 0;
      })
      .slice(0, 5);

    chatObjects.forEach((chat) => {
      if (!chat) return;
      const chatTitle = chat.title || 'this chat';

      if (isChatGroup(chat) || isChatChannel(chat)) {
        suggestions.push(`Summarize recent messages in ${chatTitle}`);
        suggestions.push(`What are the key topics discussed in ${chatTitle}?`);
        suggestions.push(`Create action items from ${chatTitle}`);
      } else {
        suggestions.push(`Help me draft a message to ${chatTitle}`);
        suggestions.push(`What should I say to ${chatTitle}?`);
      }
    });

    // Fill remaining slots with generic suggestions
    const genericSuggestions = [
      'Help me write a professional email',
      'Create a meeting agenda',
      'Draft a project proposal',
      'Summarize my recent conversations',
    ];

    while (suggestions.length < 4) {
      const generic = genericSuggestions.find((s) => !suggestions.includes(s));
      if (generic) {
        suggestions.push(generic);
      } else {
        break;
      }
    }

    return suggestions.slice(0, 4);
  }, [chatIds, chats]);

  const getTimeBasedGreeting = useLastCallback((): string => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return lang('MiddleWelcomeGoodMorning');
    } else if (hour < 17) {
      return lang('MiddleWelcomeGoodAfternoon');
    } else {
      return lang('MiddleWelcomeGoodEvening');
    }
  });

  const handleNotionConnect = useLastCallback(() => {
    connectToNotion();
  });

  const handleGoogleConnect = useLastCallback(() => {
    connectToGoogle();
  });

  const fullName = currentUserFirstName
    ? String(currentUserFirstName)
    : lang('MiddleWelcomeUser');

  return (
    <div className={styles.content}>
      <div className={styles.greeting}>
        <h1 className={styles.greetingText}>
          {getTimeBasedGreeting()}
          ,&nbsp;
          {fullName}
          ! Let&apos;s cook. 🔥
        </h1>
      </div>

      <div className={styles.welcomePromptCard}>
        <div className={styles.welcomePromptContainer}>
          <textarea
            className={styles.welcomeInput}
            placeholder="What shall we do today?"
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            rows={1}
          />
          <div className={styles.actionBar}>
            <div className={styles.actionBarLeft}>

            </div>
            <div className={styles.actionBarRight}>
              <button
                className={buildClassName(styles.sendButton, inputValue.trim() && styles.sendButtonActive)}
                onClick={onInputSubmit}
                disabled={!inputValue.trim()}
                type="button"
                aria-label="Send"
              >
                <i className="icon icon-send" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* <div className={styles.summariesCard}>
        <div className={styles.summariesContent}>
          <span className={styles.summariesText}>Try daily summaries of your busiest chats</span>
          <button
            className={styles.summariesButton}
            onClick={() => actions.openSummarizePage()}
            type="button"
          >
            Get Started
            <i className="icon icon-chevron-right" />
          </button>
        </div>
      </div> */}

      <div className={styles.toolsCard}>
        <span className={styles.toolsText}>Connect your tools to get more done</span>
        <div className={styles.toolsIcons}>
          <div
            className={buildClassName(
              styles.toolIcon,
              notionOAuth?.isConnecting && styles.toolIconLoading,
              notionOAuth?.isConnected && styles.toolIconConnected,
            )}
            title={
              notionOAuth?.isConnected
                ? 'Notion - Connected'
                : notionOAuth?.isConnecting
                  ? 'Notion - Connecting...'
                  : 'Connect to Notion'
            }
            onClick={!notionOAuth?.isConnecting ? handleNotionConnect : undefined}
          >
            {notionOAuth?.isConnecting ? (
              <i className="icon icon-spinner" />
            ) : (
              <img src={notionLogo} alt="Notion" />
            )}
            {notionOAuth?.isConnected && (
              <i className={buildClassName('icon', 'icon-check', styles.connectedCheck)} />
            )}
          </div>
          <div
            className={buildClassName(
              styles.toolIcon,
              googleOAuth?.isConnecting && styles.toolIconLoading,
              googleOAuth?.isConnected && styles.toolIconConnected,
            )}
            title={
              googleOAuth?.isConnected
                ? 'Google - Connected'
                : googleOAuth?.isConnecting
                  ? 'Google - Connecting...'
                  : 'Connect to Google'
            }
            onClick={!googleOAuth?.isConnecting ? handleGoogleConnect : undefined}
          >
            {googleOAuth?.isConnecting ? (
              <i className="icon icon-spinner" />
            ) : (
              <img src={googleLogo} alt="Google" />
            )}
            {googleOAuth?.isConnected && (
              <i className={buildClassName('icon', 'icon-check', styles.connectedCheck)} />
            )}
          </div>
          <i className="icon icon-chevron-right" />
        </div>
      </div>

      <div className={styles.suggestions}>
        <div className={styles.suggestionsTitle}>Here are a few ideas to get you started</div>
        <div className={styles.suggestionsList}>
          {contextualSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className={styles.suggestionItem}
              onClick={() => onSuggestionClick(suggestion)}
            >
              &quot;
              {suggestion}
              &quot;
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    return {
      notionOAuth: global.alphahuman?.notionOAuth,
      googleOAuth: global.alphahuman?.googleOAuth,
    };
  },
)(WelcomeViewPrompt));
