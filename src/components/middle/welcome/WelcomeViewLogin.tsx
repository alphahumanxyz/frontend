import { memo } from '../../../lib/teact/teact';

import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';

import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';

import styles from './MiddleColumnWelcome.module.scss';

type WelcomeViewLoginProps = {
  currentUserFirstName?: string;
  isLoggingIn?: boolean;
  onLoginClick: () => void;
};

const WelcomeViewLogin = ({
  currentUserFirstName,
  isLoggingIn,
  onLoginClick,
}: WelcomeViewLoginProps) => {
  const lang = useLang();

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
          <div className={styles.loginPrompt}>
            <p className={styles.loginText}>
              Connect your Telegram account to start using AlphaHuman
            </p>
            <Button
              className={styles.loginButton}
              onClick={onLoginClick}
              color="primary"
              disabled={isLoggingIn}
            >
              <Icon name="user" />
              <span>{isLoggingIn ? 'Verifying...' : 'Login'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(WelcomeViewLogin);
