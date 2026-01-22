import { addActionHandler, getActions, getGlobal, setGlobal } from '../../index';
import { connectGoogleRest } from '../../../lib/alphahuman/rest';

addActionHandler('connectToGoogle', async (global) => {
  // Set connecting state
  setGlobal({
    ...global,
    alphahuman: {
      ...global.alphahuman,
      googleOAuth: {
        ...global.alphahuman?.googleOAuth,
        isConnecting: true,
        error: undefined,
      },
    },
  });

  try {
    // Call the backend API to get OAuth URL
    const response = await connectGoogleRest();

    const updatedGlobal = getGlobal();

    // Store OAuth data and redirect
    setGlobal({
      ...updatedGlobal,
      alphahuman: {
        ...updatedGlobal.alphahuman,
        googleOAuth: {
          isConnecting: false,
          isConnected: false,
          oauthUrl: response.oauthUrl,
          oauthState: response.state,
          error: undefined,
        },
      },
    });

    // Redirect user to Google OAuth page
    window.location.href = response.oauthUrl;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Google';

    const updatedGlobal = getGlobal();

    // Reset connecting state and set error
    setGlobal({
      ...updatedGlobal,
      alphahuman: {
        ...updatedGlobal.alphahuman,
        googleOAuth: {
          ...updatedGlobal.alphahuman?.googleOAuth,
          isConnecting: false,
          error: errorMessage,
        },
      },
    });

    // Show error notification
    getActions().showNotification({ message: `Failed to connect to Google: ${errorMessage}` });
  }
});

addActionHandler('resetGoogleOAuthError', (global) => {
  setGlobal({
    ...global,
    alphahuman: {
      ...global.alphahuman,
      googleOAuth: {
        ...global.alphahuman?.googleOAuth,
        error: undefined,
      },
    },
  });
});

addActionHandler('completeGoogleOAuthSuccess', (global) => {
  // Update global state to connected
  setGlobal({
    ...getGlobal(),
    alphahuman: {
      ...getGlobal().alphahuman,
      googleOAuth: {
        isConnecting: false,
        isConnected: true,
        oauthUrl: undefined,
        oauthState: undefined,
        error: undefined,
      },
    },
  });

  // Show success notification
  getActions().showNotification({
    message: 'Successfully connected to Google',
  });
});

addActionHandler('completeGoogleOAuthError', (global, actions, payload) => {
  const { error } = payload;

  const updatedGlobal = getGlobal();

  // Update global state with error
  setGlobal({
    ...updatedGlobal,
    alphahuman: {
      ...updatedGlobal.alphahuman,
      googleOAuth: {
        ...updatedGlobal.alphahuman?.googleOAuth,
        isConnecting: false,
        isConnected: false,
        error,
      },
    },
  });

  // Show error notification
  getActions().showNotification({
    message: `Failed to connect to Google: ${error}`,
  });
});