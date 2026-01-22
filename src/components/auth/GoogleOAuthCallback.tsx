import { useEffect, useState } from '../../lib/teact/teact';
import { getActions } from '../../global';

import { parseGoogleOAuthCallback } from '../../util/routing';
import useLastCallback from '../../hooks/useLastCallback';

// Ensure googleAuth actions are loaded
import '../../global/actions/ui/googleAuth';

import styles from './GoogleOAuthCallback.module.scss';

const REDIRECT_DELAY = 10; // 10 seconds

const GoogleOAuthCallback = () => {
  const { completeGoogleOAuthSuccess, completeGoogleOAuthError } = getActions();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [callbackResult, setCallbackResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleGoHome = useLastCallback(() => {
    window.location.href = '/';
  });

  useEffect(() => {
    const callbackData = parseGoogleOAuthCallback();

    if (!callbackData) {
      // Fallback: redirect to home if not a valid OAuth callback
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      return;
    }

    if (callbackData.type === 'success') {
      setCallbackResult({
        type: 'success',
        message: 'Successfully connected to Google',
      });
      completeGoogleOAuthSuccess();
    } else if (callbackData.type === 'error') {
      const error = callbackData.error || 'Unknown error occurred';
      setCallbackResult({
        type: 'error',
        message: `Failed to connect to Google: ${error}`,
      });
      completeGoogleOAuthError({ error });
    }

    // Start countdown
    setCountdown(REDIRECT_DELAY);
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          window.location.href = '/';
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [completeGoogleOAuthSuccess, completeGoogleOAuthError]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {callbackResult ? (
          <>
            <div className={styles.icon}>
              <i className={callbackResult.type === 'success' ? 'icon icon-check' : 'icon icon-close'} />
            </div>
            <h2 className={styles.title}>
              {callbackResult.type === 'success' ? 'Connection Successful!' : 'Connection Failed'}
            </h2>
            <p className={styles.message}>{callbackResult.message}</p>
            <div className={styles.actions}>
              <p className={styles.countdown}>
                {countdown !== null ? `Redirecting in ${countdown} seconds` : 'Redirecting...'}
              </p>
              <button className={styles.homeButton} onClick={handleGoHome}>
                Go Home Now
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.spinner}>
              <i className="icon icon-spinner" />
            </div>
            <p className={styles.message}>Processing Google connection...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleOAuthCallback;