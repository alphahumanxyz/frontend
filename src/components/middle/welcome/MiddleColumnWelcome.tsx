import { memo, useState } from '../../../lib/teact/teact';
import { getActions, getGlobal, withGlobal } from '../../../global';

import type { GlobalState } from '../../../global/types';
import type { AlphahumanThread } from '../../../lib/alphahuman/rest/getThreads';
import type { AlphaHumanManagerState } from '../../../lib/alphahuman/types';
import { LeftColumnContent } from '../../../types';

import { selectUser } from '../../../global/selectors';
import buildClassName from '../../../util/buildClassName';

import useLastCallback from '../../../hooks/useLastCallback';

import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';
import ConversationView from './ConversationView';
import WelcomeView from './WelcomeView';

import styles from './MiddleColumnWelcome.module.scss';

type OwnProps = {
  className?: string;
};

type StateProps = {
  currentUserId?: string;
  currentUserFirstName?: string;
  currentUser?: ReturnType<typeof selectUser>;
  chatIds?: string[];
  chats?: GlobalState['chats']['byId'];
  socketState?: AlphaHumanManagerState;
  threads?: AlphahumanThread[];
  hasJwtToken?: boolean;
  isLoggingIn?: boolean;
};

const MiddleColumnWelcome = ({
  className,
  currentUserFirstName,
  chatIds,
  chats,
  hasJwtToken,
  isLoggingIn,
}: OwnProps & StateProps) => {
  const actions = getActions();
  const [inputValue, setInputValue] = useState('');
  const [hasSentMessage, setHasSentMessage] = useState(false);

  const handleInputChange = useLastCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  });

  const handleInputSubmit = useLastCallback(() => {
    if (!inputValue.trim()) return;

    const message = inputValue.trim();

    setHasSentMessage(true);
    setInputValue('');

    // Send the message to the socket (will create a new thread via API if none exists)
    actions.streamAlphaHumanMessage({ threadId: undefined, content: message });
  });

  const handleKeyDown = useLastCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputSubmit();
    }
  });

  const handleSuggestionClick = useLastCallback((suggestion: string) => {
    setInputValue(suggestion);
    // Focus the textarea
    const textarea = document.querySelector(`.${styles.welcomeInput}`) as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
    }
  });

  const handleLoginClick = useLastCallback(() => {
    actions.startAlphaHumanLogin();
  });

  // Check if we have messages in the active thread
  const activeThreadId = getGlobal().alphahuman?.activeThreadId;
  const activeThread = activeThreadId ? getGlobal()?.alphahuman?.threadMessages?.[activeThreadId] : undefined;
  const hasMessages = activeThread?.messages && activeThread.messages.length > 0;

  // Show ConversationView if user has sent a message OR if there are messages in the active thread
  if (hasSentMessage || hasMessages) {
    return (
      <>
        <ConversationView className={className} />

        <div className={styles.historyFab}>
          <Button
            round
            color="primary"
            onClick={() => actions.openLeftColumnContent({ contentKey: LeftColumnContent.Threads })}
            ariaLabel="Show thread history"
          >
            <Icon name="clock" />
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={buildClassName(styles.root, className)}>
        <WelcomeView
          currentUserFirstName={currentUserFirstName}
          chatIds={chatIds}
          chats={chats}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          onInputSubmit={handleInputSubmit}
          onSuggestionClick={handleSuggestionClick}
          onKeyDown={handleKeyDown}
          hasJwtToken={hasJwtToken}
          isLoggingIn={isLoggingIn}
          onLoginClick={handleLoginClick}
        />
      </div>

      <div className={styles.historyFab}>
        <Button
          round
          color="primary"
          onClick={() => actions.openLeftColumnContent({ contentKey: LeftColumnContent.Threads })}
          ariaLabel="Show thread history"
        >
          <Icon name="clock" />
        </Button>
      </div>
    </>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const { currentUserId } = global;
    const currentUser = currentUserId ? selectUser(global, currentUserId) : undefined;
    const chatIds = global.chats.listIds.active?.slice(0, 20) || [];

    return {
      currentUserId,
      currentUserFirstName: currentUser?.firstName,
      currentUser,
      chatIds,
      chats: global.chats.byId,
      socketState: global.alphahuman?.socketState,
      threads: global.alphahuman?.threads,
      hasJwtToken: (() => {
        // Check both global state and storage for JWT token
        if (global.alphahuman?.jwtToken) return true;
        return false;
      })(),
      isLoggingIn: global.alphahuman?.isLoggingIn || false,
    };
  },
)(MiddleColumnWelcome));
