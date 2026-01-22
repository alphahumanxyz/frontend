import { memo } from '../../../lib/teact/teact';

import type { GlobalState } from '../../../global/types';

import WelcomeViewLogin from './WelcomeViewLogin';
import WelcomeViewPrompt from './WelcomeViewPrompt';

type WelcomeViewProps = {
  currentUserFirstName?: string;
  chatIds?: string[];
  chats?: GlobalState['chats']['byId'];
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onInputSubmit: () => void;
  onSuggestionClick: (suggestion: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  hasJwtToken?: boolean;
  isLoggingIn?: boolean;
  onLoginClick: () => void;
};

const WelcomeView = ({
  currentUserFirstName,
  chatIds,
  chats,
  inputValue,
  onInputChange,
  onInputSubmit,
  onSuggestionClick,
  onKeyDown,
  hasJwtToken,
  isLoggingIn,
  onLoginClick,
}: WelcomeViewProps) => {
  if (hasJwtToken) {
    return (
      <WelcomeViewPrompt
        currentUserFirstName={currentUserFirstName}
        chatIds={chatIds}
        chats={chats}
        inputValue={inputValue}
        onInputChange={onInputChange}
        onInputSubmit={onInputSubmit}
        onSuggestionClick={onSuggestionClick}
        onKeyDown={onKeyDown}
      />
    );
  }

  return (
    <WelcomeViewLogin
      currentUserFirstName={currentUserFirstName}
      isLoggingIn={isLoggingIn}
      onLoginClick={onLoginClick}
    />
  );
};

export default memo(WelcomeView);
