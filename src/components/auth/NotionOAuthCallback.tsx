import { useEffect, useState } from '../../lib/teact/teact';
import { getActions } from '../../global';

import { parseNotionOAuthCallback } from '../../util/routing';
import useLastCallback from '../../hooks/useLastCallback';

// Ensure notionAuth actions are loaded
import '../../global/actions/ui/notionAuth';

import styles from './NotionOAuthCallback.module.scss';

const REDIRECT_DELAY = 10; // 10 seconds

const NotionOAuthCallback = () => {
  const { completeNotionOAuthSuccess, completeNotionOAuthError } = getActions();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [callbackResult, setCallbackResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleGoHome = useLastCallback(() => {
    window.location.href = '/';
  });

  useEffect(() => {
    const callbackData = parseNotionOAuthCallback();

    if (!callbackData) {
      // Fallback: redirect to home if not a valid OAuth callback
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      return;
    }

    if (callbackData.type === 'success') {
      const workspace = callbackData.workspace || 'Unknown Workspace';
      setCallbackResult({
        type: 'success',
        message: `Successfully connected to Notion workspace: ${workspace}`,
      });
      completeNotionOAuthSuccess({ workspace });
    } else if (callbackData.type === 'error') {
      const error = callbackData.error || 'Unknown error occurred';
      setCallbackResult({
        type: 'error',
        message: `Failed to connect to Notion: ${error}`,
      });
      completeNotionOAuthError({ error });
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
  }, [completeNotionOAuthSuccess, completeNotionOAuthError]);

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
            <p className={styles.message}>Processing Notion connection...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default NotionOAuthCallback;