import type { GlobalState } from '../types';

const DEFAULT_LAYOUT = {
  agentColumnState: 'collapsed' as const,
  agentColumnWidth: 400,
  contentMode: 'chat' as const,
  isPinned: false,
};

export function updateLayout<T extends GlobalState>(
  global: T,
  layoutUpdate: Partial<GlobalState['layout']>,
): T {
  const currentLayout = global.layout || DEFAULT_LAYOUT;

  return {
    ...global,
    layout: {
      ...currentLayout,
      ...layoutUpdate,
    },
  };
}

export function setAgentColumnState<T extends GlobalState>(
  global: T,
  state: 'expanded' | 'minimized' | 'collapsed',
): T {
  return updateLayout(global, { agentColumnState: state });
}

export function setAgentColumnWidth<T extends GlobalState>(
  global: T,
  width: number,
): T {
  const clampedWidth = Math.max(300, Math.min(580, width));
  return updateLayout(global, { agentColumnWidth: clampedWidth });
}

export function setContentMode<T extends GlobalState>(
  global: T,
  mode: 'chat' | 'split' | 'info',
): T {
  return updateLayout(global, { contentMode: mode });
}

export function setLayoutPinned<T extends GlobalState>(
  global: T,
  isPinned: boolean,
): T {
  return updateLayout(global, { isPinned });
}

export function toggleAgentColumn<T extends GlobalState>(global: T): T {
  const currentLayout = global.layout || DEFAULT_LAYOUT;
  const currentState = currentLayout.agentColumnState;

  let newState: 'expanded' | 'minimized' | 'collapsed';

  switch (currentState) {
    case 'collapsed':
      newState = 'expanded';
      break;
    case 'expanded':
      newState = 'minimized';
      break;
    case 'minimized':
      newState = 'collapsed';
      break;
    default:
      newState = 'expanded';
  }

  return setAgentColumnState(global, newState);
}

export function loadLayoutPreferences<T extends GlobalState>(global: T): T {
  const savedAgentState =
    localStorage.getItem('alphaHuman.agentColumnState') as 'expanded' | 'minimized' | 'collapsed' | null;
  const savedWidth = localStorage.getItem('alphaHuman.agentColumnWidth');
  const savedContentMode = localStorage.getItem('alphaHuman.contentMode') as 'chat' | 'split' | 'info' | null;
  const savedPinned = localStorage.getItem('alphaHuman.layoutPinned');

  const currentLayout = global.layout || DEFAULT_LAYOUT;

  const layoutUpdate: Partial<GlobalState['layout']> = {
    agentColumnState: savedAgentState || currentLayout.agentColumnState,
    agentColumnWidth: savedWidth ? Number(savedWidth) : currentLayout.agentColumnWidth,
    contentMode: savedContentMode || currentLayout.contentMode,
    isPinned: savedPinned ? savedPinned === 'true' : currentLayout.isPinned,
  };

  return updateLayout(global, layoutUpdate);
}
