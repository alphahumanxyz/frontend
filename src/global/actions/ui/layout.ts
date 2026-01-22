import type { ActionReturnType } from '../../types';

import { addActionHandler } from '../../index';
import {
  loadLayoutPreferences,
  setAgentColumnState,
  setAgentColumnWidth,
  setContentMode,
  setLayoutPinned,
  toggleAgentColumn,
} from '../../reducers';

addActionHandler('setAgentColumnState',
  (global, actions, payload?: { state: 'expanded' | 'minimized' | 'collapsed' }): ActionReturnType => {
    if (!payload) return global;

    // Save preference to localStorage
    localStorage.setItem('alphaHuman.agentColumnState', payload.state);

    return setAgentColumnState(global, payload.state);
  });

addActionHandler('setAgentColumnWidth', (global, actions, payload?: { width: number }): ActionReturnType => {
  if (!payload) return global;

  const clampedWidth = Math.max(300, Math.min(580, payload.width));

  // Save preference to localStorage
  localStorage.setItem('alphaHuman.agentColumnWidth', String(clampedWidth));

  return setAgentColumnWidth(global, clampedWidth);
});

addActionHandler('toggleAgentColumn', (global): ActionReturnType => {
  const newGlobal = toggleAgentColumn(global);
  const newState = newGlobal.layout.agentColumnState;

  localStorage.setItem('alphaHuman.agentColumnState', newState);

  return newGlobal;
});

addActionHandler('setContentMode',
  (global, actions, payload?: { mode: 'chat' | 'split' | 'info' }): ActionReturnType => {
    if (!payload) return global;

    // Save preference to localStorage
    localStorage.setItem('alphaHuman.contentMode', payload.mode);

    return setContentMode(global, payload.mode);
  });

addActionHandler('setLayoutPinned', (global, actions, payload?: { isPinned: boolean }): ActionReturnType => {
  if (!payload) return global;

  localStorage.setItem('alphaHuman.layoutPinned', String(payload.isPinned));

  return setLayoutPinned(global, payload.isPinned);
});

addActionHandler('loadLayoutPreferences', (global): ActionReturnType => {
  return loadLayoutPreferences(global);
});

// Action handlers for AlphaHuman-specific features
addActionHandler('openAlphaHumanSettings', (global): ActionReturnType => {
  // TODO: Implement AlphaHuman settings modal
  return global;
});

addActionHandler('openUsageStatistics', (global): ActionReturnType => {
  // TODO: Implement usage statistics modal
  return global;
});

addActionHandler('openOwnProfile', (global): ActionReturnType => {
  // TODO: Implement own profile opening functionality
  return global;
});

addActionHandler('openAgentSidebar', (global, actions, payload?: { initialMessage?: string }): ActionReturnType => {
  // Set the agent column to expanded state
  const newGlobal = setAgentColumnState(global, 'expanded');

  localStorage.setItem('alphaHuman.agentColumnState', 'expanded');

  // For now, we'll just open the sidebar. In a full implementation,
  // we could extend the aiSocket state to handle initial messages
  // TODO: Add initial message handling to agent system
  if (payload?.initialMessage) {
    // Log the intended message for development
    // console.log('Opening agent with message:', payload.initialMessage);
  }

  return newGlobal;
});
