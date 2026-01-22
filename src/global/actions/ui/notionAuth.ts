import { addActionHandler, getActions, getGlobal, setGlobal } from '../../index';
import { connectNotionRest } from '../../../lib/alphahuman/rest';

addActionHandler('connectToNotion', async (global) => {
  // Set connecting state
  setGlobal({
    ...global,
    alphahuman: {
      ...global.alphahuman,
      notionOAuth: {
        ...global.alphahuman?.notionOAuth,
        isConnecting: true,
        error: undefined,
      },
    },
  });

  try {
    // Call the backend API to get OAuth URL
    const response = await connectNotionRest();

    const updatedGlobal = getGlobal();

    // Store OAuth data and redirect
    setGlobal({
      ...updatedGlobal,
      alphahuman: {
        ...updatedGlobal.alphahuman,
        notionOAuth: {
          isConnecting: false,
          isConnected: false,
          oauthUrl: response.oauthUrl,
          oauthState: response.state,
          error: undefined,
        },
      },
    });

    // Redirect user to Notion OAuth page
    window.location.href = response.oauthUrl;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Notion';

    const updatedGlobal = getGlobal();

    // Reset connecting state and set error
    setGlobal({
      ...updatedGlobal,
      alphahuman: {
        ...updatedGlobal.alphahuman,
        notionOAuth: {
          ...updatedGlobal.alphahuman?.notionOAuth,
          isConnecting: false,
          error: errorMessage,
        },
      },
    });

    // Show error notification
    getActions().showNotification({ message: `Failed to connect to Notion: ${errorMessage}` });
  }
});

addActionHandler('resetNotionOAuthError', (global) => {
  setGlobal({
    ...global,
    alphahuman: {
      ...global.alphahuman,
      notionOAuth: {
        ...global.alphahuman?.notionOAuth,
        error: undefined,
      },
    },
  });
});

addActionHandler('completeNotionOAuthSuccess', (global, actions, payload) => {
  const { workspace } = payload;

  // Update global state to connected
  setGlobal({
    ...getGlobal(),
    alphahuman: {
      ...getGlobal().alphahuman,
      notionOAuth: {
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
    message: `Successfully connected to Notion workspace: ${workspace}`,
  });
});

addActionHandler('completeNotionOAuthError', (global, actions, payload) => {
  const { error } = payload;

  const updatedGlobal = getGlobal();

  // Update global state with error
  setGlobal({
    ...updatedGlobal,
    alphahuman: {
      ...updatedGlobal.alphahuman,
      notionOAuth: {
        ...updatedGlobal.alphahuman?.notionOAuth,
        isConnecting: false,
        isConnected: false,
        error,
      },
    },
  });

  // Show error notification
  getActions().showNotification({
    message: `Failed to connect to Notion: ${error}`,
  });
});