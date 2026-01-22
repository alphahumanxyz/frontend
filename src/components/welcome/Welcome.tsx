import { memo, useState } from '@teact';

import { HAS_COMPLETED_WELCOME_KEY } from '../../config';

import useLastCallback from '../../hooks/useLastCallback';

import Button from '../ui/Button';

import './Welcome.scss';

const Welcome = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = useLastCallback(() => {
    // Mark welcome as completed (device-specific)
    localStorage.setItem(HAS_COMPLETED_WELCOME_KEY, 'true');
    setIsLoading(true);
  });

  return (
    <div id="welcome-form" className="custom-scroll">
      <div className="welcome-form">
        <div className="welcome-lottie">
          <img src="/icon-square-192x192.png" alt="AlphaHuman Logo" />
          {/* <AnimatedSticker
            tgsUrl={LOCAL_TGS_URLS.HealthyStar}
            size={300}
            play
            noLoop={false}
            forceAlways
          /> */}
        </div>
        <h1>Welcome to AlphaHuman</h1>
        <p className="note">
          Summarize your busiest chats, execute human-like tasks in seconds, and connect your
          favorite tools to get more done, faster. All on Telegram.
          <br />
          <br />
          Are you ready to get AI superpowers?
          <br />
          <br />
          <small>
            (This is a telegram client so all your credentials are stored in
            your device and never passed onto any servers)
          </small>
        </p>
        <Button
          className="auth-button welcome-button"
          onClick={handleGetStarted}
          isLoading={isLoading}
          disabled={isLoading}
        >
          Let&apos;s Cook 🔥
        </Button>
      </div>
    </div>
  );
};

export default memo(Welcome);
