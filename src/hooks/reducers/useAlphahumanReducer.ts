import type {
  GetMeResponse,
  Highlight,
  AlphahumanThread,
} from '../../lib/alphahuman/rest';
import type { AlphahumanThreadMessage } from '../../lib/alphahuman/types';
import type { Dispatch, StateReducer } from '../useReducer';

import useReducer from '../useReducer';

export type AlphahumanState = {
  // User data
  me: GetMeResponse | undefined;
  meLoading: boolean;
  meError: Error | undefined;

  // Threads data
  threads: AlphahumanThread[];
  threadsCount: number;
  threadsLoading: boolean;
  threadsError: Error | undefined;

  // Thread messages cache (keyed by threadId)
  threadMessages: Record<string, {
    messages: AlphahumanThreadMessage[];
    count: number;
  }>;
  threadMessagesLoading: Record<string, boolean>;
  threadMessagesError: Record<string, Error | undefined>;

  // Highlights data (keyed by timeframe)
  highlights: Record<'daily' | 'weekly', Highlight[]>;
  highlightsLoading: Record<'daily' | 'weekly', boolean>;
  highlightsError: Record<'daily' | 'weekly', Error | undefined>;
};

export type AlphahumanActions = (
  | 'setMe'
  | 'setMeLoading'
  | 'setMeError'
  | 'setThreads'
  | 'setThreadsLoading'
  | 'setThreadsError'
  | 'setThreadMessages'
  | 'setThreadMessagesLoading'
  | 'setThreadMessagesError'
  | 'setHighlights'
  | 'setHighlightsLoading'
  | 'setHighlightsError'
  | 'clearThreadMessages'
  | 'clearHighlights'
);

export type AlphahumanDispatch = Dispatch<AlphahumanState, AlphahumanActions>;

const INITIAL_STATE: AlphahumanState = {
  me: undefined,
  meLoading: false,
  meError: undefined,
  threads: [],
  threadsCount: 0,
  threadsLoading: false,
  threadsError: undefined,
  threadMessages: {},
  threadMessagesLoading: {},
  threadMessagesError: {},
  highlights: {
    daily: [],
    weekly: [],
  },
  highlightsLoading: {
    daily: false,
    weekly: false,
  },
  highlightsError: {
    daily: undefined,
    weekly: undefined,
  },
};

const alphahumanReducer: StateReducer<AlphahumanState, AlphahumanActions> = (
  state,
  action,
): AlphahumanState => {
  switch (action.type) {
    case 'setMe':
      return {
        ...state,
        me: action.payload,
        meError: undefined,
      };
    case 'setMeLoading':
      return {
        ...state,
        meLoading: action.payload,
      };
    case 'setMeError':
      return {
        ...state,
        meError: action.payload,
        meLoading: false,
      };
    case 'setThreads':
      return {
        ...state,
        threads: action.payload.threads || [],
        threadsCount: action.payload.count || 0,
        threadsError: undefined,
      };
    case 'setThreadsLoading':
      return {
        ...state,
        threadsLoading: action.payload,
      };
    case 'setThreadsError':
      return {
        ...state,
        threadsError: action.payload,
        threadsLoading: false,
      };
    case 'setThreadMessages': {
      const { threadId, messages, count } = action.payload;
      return {
        ...state,
        threadMessages: {
          ...state.threadMessages,
          [threadId]: { messages, count },
        },
        threadMessagesError: {
          ...state.threadMessagesError,
          [threadId]: undefined,
        },
      };
    }
    case 'setThreadMessagesLoading': {
      const { threadId, loading } = action.payload;
      return {
        ...state,
        threadMessagesLoading: {
          ...state.threadMessagesLoading,
          [threadId]: loading,
        },
      };
    }
    case 'setThreadMessagesError': {
      const { threadId, error } = action.payload;
      return {
        ...state,
        threadMessagesError: {
          ...state.threadMessagesError,
          [threadId]: error,
        },
        threadMessagesLoading: {
          ...state.threadMessagesLoading,
          [threadId]: false,
        },
      };
    }
    case 'setHighlights': {
      const { timeframe, highlights } = action.payload;
      return {
        ...state,
        highlights: {
          ...state.highlights,
          [timeframe]: highlights,
        },
        highlightsError: {
          ...state.highlightsError,
          [timeframe]: undefined,
        },
      };
    }
    case 'setHighlightsLoading': {
      const { timeframe, loading } = action.payload;
      return {
        ...state,
        highlightsLoading: {
          ...state.highlightsLoading,
          [timeframe]: loading,
        },
      };
    }
    case 'setHighlightsError': {
      const { timeframe, error } = action.payload;
      return {
        ...state,
        highlightsError: {
          ...state.highlightsError,
          [timeframe]: error,
        },
        highlightsLoading: {
          ...state.highlightsLoading,
          [timeframe]: false,
        },
      };
    }
    case 'clearThreadMessages': {
      const threadId = action.payload;
      const newThreadMessages = { ...state.threadMessages };
      const newThreadMessagesLoading = { ...state.threadMessagesLoading };
      const newThreadMessagesError = { ...state.threadMessagesError };
      delete newThreadMessages[threadId];
      delete newThreadMessagesLoading[threadId];
      delete newThreadMessagesError[threadId];
      return {
        ...state,
        threadMessages: newThreadMessages,
        threadMessagesLoading: newThreadMessagesLoading,
        threadMessagesError: newThreadMessagesError,
      };
    }
    case 'clearHighlights': {
      const timeframe = action.payload;
      return {
        ...state,
        highlights: {
          ...state.highlights,
          [timeframe]: [],
        },
        highlightsError: {
          ...state.highlightsError,
          [timeframe]: undefined,
        },
      };
    }
    default:
      return state;
  }
};

const useAlphahumanReducer = () => {
  return useReducer(alphahumanReducer, INITIAL_STATE);
};

export default useAlphahumanReducer;
