# Plan: Real-Time Listening to a Single Peer Chat

## Overview
This document outlines the plan to implement real-time listening for a single peer chat, allowing components to subscribe to updates for a specific chat ID and receive filtered updates in real-time.

## Current Architecture Analysis

### Update Flow
1. **Telegram API → Web Worker**: Updates arrive via MTProto protocol
2. **Update Manager** (`src/api/gramjs/updates/updateManager.ts`):
   - Queues and processes updates
   - Handles PTS (points) and SEQ (sequence) ordering
   - Manages channel-specific and common box updates
3. **MTP Update Handler** (`src/api/gramjs/updates/mtpUpdateHandler.ts`):
   - Converts GramJS updates to internal API updates
   - Emits updates via `sendApiUpdate()`
4. **API Update Emitter** (`src/api/gramjs/updates/apiUpdateEmitter.ts`):
   - Throttles and queues updates
   - Calls registered `onUpdate` callback
5. **Action Handlers** (`src/global/actions/apiUpdaters/`):
   - Multiple handlers process different update types
   - All handlers listen to `'apiUpdate'` action
   - Updates are processed and state is updated

### Current Update Types for Chats
- `newMessage`: New message in a chat
- `updateMessage`: Message edited/updated
- `updateChat`: Chat metadata changed
- `updateChatTypingStatus`: User typing status
- `updateChatInbox`: Read receipts
- `deleteMessages`: Messages deleted
- `updateMessageReactions`: Reactions changed
- And many more...

## Implementation Plan

### Phase 1: Create Update Subscription System

#### 1.1 Create Update Subscription Manager
**File**: `src/util/updateSubscription.ts`

**Purpose**: Manage subscriptions to updates for specific chats

**API**:
```typescript
type UpdateSubscriptionCallback = (update: ApiUpdate) => void;

interface UpdateSubscription {
  id: string;
  chatId: string;
  callback: UpdateSubscriptionCallback;
  filter?: (update: ApiUpdate) => boolean;
}

class UpdateSubscriptionManager {
  private subscriptions: Map<string, UpdateSubscription[]> = new Map();
  
  subscribe(
    chatId: string,
    callback: UpdateSubscriptionCallback,
    filter?: (update: ApiUpdate) => boolean
  ): () => void; // Returns unsubscribe function
  
  notify(update: ApiUpdate): void;
  
  clear(chatId?: string): void;
}
```

**Implementation Details**:
- Store subscriptions by chatId
- Support custom filters for fine-grained control
- Return unsubscribe function for cleanup
- Integrate with existing update flow

#### 1.2 Create Hook for Components
**File**: `src/hooks/usePeerChatUpdates.ts`

**Purpose**: React-like hook for components to subscribe to chat updates

**API**:
```typescript
function usePeerChatUpdates(
  chatId: string | undefined,
  options?: {
    enabled?: boolean;
    filter?: (update: ApiUpdate) => boolean;
    onUpdate?: (update: ApiUpdate) => void;
  }
): {
  updates: ApiUpdate[];
  clearUpdates: () => void;
  isSubscribed: boolean;
}
```

**Implementation Details**:
- Use Teact hooks (useEffect equivalent)
- Automatically subscribe/unsubscribe on mount/unmount
- Store updates in component state
- Support filtering and callbacks
- Handle chatId changes

### Phase 2: Integrate with Existing Update Flow

#### 2.1 Modify API Update Emitter
**File**: `src/api/gramjs/updates/apiUpdateEmitter.ts`

**Changes**:
- Import subscription manager
- Call `notify()` on subscription manager when updates are emitted
- Ensure subscriptions are notified before throttled updates

**Code Changes**:
```typescript
import { updateSubscriptionManager } from '../../../util/updateSubscription';

export function sendApiUpdate(update: ApiUpdate) {
  // Notify subscriptions immediately (before throttling)
  updateSubscriptionManager.notify(update);
  
  queueUpdate(update);
}
```

#### 2.2 Create Default Chat Update Filters
**File**: `src/util/updateSubscription.ts` (extend)

**Purpose**: Provide common filters for chat-specific updates

**Filters**:
```typescript
export const chatUpdateFilters = {
  // Only messages for this chat
  messagesOnly: (chatId: string) => (update: ApiUpdate) => {
    return (
      (update['@type'] === 'newMessage' || update['@type'] === 'updateMessage') &&
      'chatId' in update && update.chatId === chatId
    );
  },
  
  // All updates for this chat
  allChatUpdates: (chatId: string) => (update: ApiUpdate) => {
    return 'chatId' in update && update.chatId === chatId;
  },
  
  // Messages and typing status
  messagesAndTyping: (chatId: string) => (update: ApiUpdate) => {
    if ('chatId' in update && update.chatId === chatId) {
      return ['newMessage', 'updateMessage', 'updateChatTypingStatus'].includes(update['@type']);
    }
    if (update['@type'] === 'updateChatTypingStatus' && 'id' in update && update.id === chatId) {
      return true;
    }
    return false;
  },
};
```

### Phase 3: Implementation Details

#### 3.1 Update Subscription Manager Implementation

**Key Features**:
1. **Efficient Lookup**: Use Map for O(1) chatId lookup
2. **Filter Support**: Allow custom filters per subscription
3. **Memory Management**: Auto-cleanup on component unmount
4. **Performance**: Minimal overhead on update path

**Implementation**:
```typescript
// src/util/updateSubscription.ts
import type { ApiUpdate } from '../api/types';

type UpdateSubscriptionCallback = (update: ApiUpdate) => void;
type UpdateFilter = (update: ApiUpdate) => boolean;

interface UpdateSubscription {
  id: string;
  chatId: string;
  callback: UpdateSubscriptionCallback;
  filter?: UpdateFilter;
}

class UpdateSubscriptionManager {
  private subscriptions: Map<string, UpdateSubscription[]> = new Map();
  private nextId = 0;

  subscribe(
    chatId: string,
    callback: UpdateSubscriptionCallback,
    filter?: UpdateFilter
  ): () => void {
    const id = `sub_${this.nextId++}`;
    const subscription: UpdateSubscription = {
      id,
      chatId,
      callback,
      filter,
    };

    const chatSubs = this.subscriptions.get(chatId) || [];
    chatSubs.push(subscription);
    this.subscriptions.set(chatId, chatSubs);

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(chatId);
      if (subs) {
        const index = subs.findIndex(sub => sub.id === id);
        if (index !== -1) {
          subs.splice(index, 1);
          if (subs.length === 0) {
            this.subscriptions.delete(chatId);
          }
        }
      }
    };
  }

  notify(update: ApiUpdate): void {
    // Extract chatId from update
    const chatId = this.extractChatId(update);
    if (!chatId) return;

    const subscriptions = this.subscriptions.get(chatId);
    if (!subscriptions || subscriptions.length === 0) return;

    // Notify all subscriptions for this chat
    subscriptions.forEach(sub => {
      if (!sub.filter || sub.filter(update)) {
        try {
          sub.callback(update);
        } catch (error) {
          console.error('[UpdateSubscription] Error in callback:', error);
        }
      }
    });
  }

  private extractChatId(update: ApiUpdate): string | undefined {
    // Handle different update types
    if ('chatId' in update) {
      return update.chatId;
    }
    if ('id' in update && update['@type'] === 'updateChatTypingStatus') {
      return update.id;
    }
    if ('channelId' in update) {
      return update.channelId;
    }
    return undefined;
  }

  clear(chatId?: string): void {
    if (chatId) {
      this.subscriptions.delete(chatId);
    } else {
      this.subscriptions.clear();
    }
  }

  getSubscriptionCount(chatId?: string): number {
    if (chatId) {
      return this.subscriptions.get(chatId)?.length || 0;
    }
    return Array.from(this.subscriptions.values())
      .reduce((sum, subs) => sum + subs.length, 0);
  }
}

export const updateSubscriptionManager = new UpdateSubscriptionManager();
```

#### 3.2 Hook Implementation

**Implementation**:
```typescript
// src/hooks/usePeerChatUpdates.ts
import { useEffect, useRef, useState } from '../lib/teact/teact';
import type { ApiUpdate } from '../api/types';
import { updateSubscriptionManager } from '../util/updateSubscription';

interface UsePeerChatUpdatesOptions {
  enabled?: boolean;
  filter?: (update: ApiUpdate) => boolean;
  onUpdate?: (update: ApiUpdate) => void;
}

export default function usePeerChatUpdates(
  chatId: string | undefined,
  options: UsePeerChatUpdatesOptions = {}
): {
  updates: ApiUpdate[];
  clearUpdates: () => void;
  isSubscribed: boolean;
} {
  const { enabled = true, filter, onUpdate } = options;
  const [updates, setUpdates] = useState<ApiUpdate[]>([]);
  const unsubscribeRef = useRef<(() => void) | undefined>();

  useEffect(() => {
    if (!chatId || !enabled) {
      return;
    }

    const handleUpdate = (update: ApiUpdate) => {
      setUpdates(prev => [...prev, update]);
      onUpdate?.(update);
    };

    unsubscribeRef.current = updateSubscriptionManager.subscribe(
      chatId,
      handleUpdate,
      filter
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = undefined;
      }
    };
  }, [chatId, enabled, filter, onUpdate]);

  const clearUpdates = () => {
    setUpdates([]);
  };

  return {
    updates,
    clearUpdates,
    isSubscribed: !!unsubscribeRef.current,
  };
}
```

### Phase 4: Usage Examples

#### 4.1 Basic Usage in Component
```typescript
import usePeerChatUpdates from '../hooks/usePeerChatUpdates';
import { chatUpdateFilters } from '../util/updateSubscription';

function ChatMonitor({ chatId }: { chatId: string }) {
  const { updates, clearUpdates } = usePeerChatUpdates(
    chatId,
    {
      filter: chatUpdateFilters.messagesOnly(chatId),
      onUpdate: (update) => {
        console.log('New message update:', update);
      },
    }
  );

  return (
    <div>
      <p>Updates received: {updates.length}</p>
      <button onClick={clearUpdates}>Clear</button>
    </div>
  );
}
```

#### 4.2 Advanced Usage with Custom Filter
```typescript
function CustomChatListener({ chatId }: { chatId: string }) {
  const { updates } = usePeerChatUpdates(chatId, {
    filter: (update) => {
      // Only listen to message reactions
      return (
        update['@type'] === 'updateMessageReactions' &&
        'chatId' in update &&
        update.chatId === chatId
      );
    },
    onUpdate: (update) => {
      // Handle reaction updates
      if (update['@type'] === 'updateMessageReactions') {
        console.log('Reaction update:', update);
      }
    },
  });

  return <div>Reaction updates: {updates.length}</div>;
}
```

#### 4.3 Direct Subscription (Non-Component Usage)
```typescript
import { updateSubscriptionManager } from '../util/updateSubscription';

// Subscribe
const unsubscribe = updateSubscriptionManager.subscribe(
  chatId,
  (update) => {
    console.log('Update received:', update);
  },
  (update) => update['@type'] === 'newMessage'
);

// Later, unsubscribe
unsubscribe();
```

### Phase 5: Testing Strategy

#### 5.1 Unit Tests
- Test subscription manager: add, remove, notify
- Test chatId extraction from different update types
- Test filter functions
- Test hook lifecycle (mount/unmount)

#### 5.2 Integration Tests
- Test integration with existing update flow
- Test performance with multiple subscriptions
- Test memory cleanup

#### 5.3 Manual Testing
- Subscribe to a chat and verify updates are received
- Test with different update types
- Test unsubscribe functionality
- Test with multiple components subscribing to same chat

### Phase 6: Performance Considerations

#### 6.1 Optimization Strategies
1. **Lazy Evaluation**: Only extract chatId when subscriptions exist
2. **Early Exit**: Skip processing if no subscriptions for chatId
3. **Debouncing**: Consider debouncing rapid updates (optional)
4. **Memory Management**: Ensure proper cleanup on unmount

#### 6.2 Monitoring
- Track subscription counts
- Monitor update processing time
- Log warnings for memory leaks

### Phase 7: Edge Cases & Error Handling

#### 7.1 Edge Cases
- ChatId changes while subscribed
- Component unmounts during update processing
- Invalid chatId
- Updates without chatId
- Multiple subscriptions to same chat

#### 7.2 Error Handling
- Wrap callbacks in try-catch
- Log errors without breaking update flow
- Graceful degradation if subscription manager fails

## Implementation Checklist

- [ ] Create `src/util/updateSubscription.ts` with UpdateSubscriptionManager
- [ ] Create `src/hooks/usePeerChatUpdates.ts` hook
- [ ] Modify `src/api/gramjs/updates/apiUpdateEmitter.ts` to notify subscriptions
- [ ] Add default filters in `src/util/updateSubscription.ts`
- [ ] Create example component demonstrating usage
- [ ] Write unit tests for subscription manager
- [ ] Write unit tests for hook
- [ ] Add TypeScript types
- [ ] Update documentation
- [ ] Performance testing
- [ ] Integration testing

## Files to Create/Modify

### New Files
1. `src/util/updateSubscription.ts` - Subscription manager
2. `src/hooks/usePeerChatUpdates.ts` - React hook
3. `.cursor/PLAN_REALTIME_PEER_CHAT.md` - This document

### Modified Files
1. `src/api/gramjs/updates/apiUpdateEmitter.ts` - Add subscription notification
2. `src/api/types/index.ts` - Add types if needed (check existing)

## Dependencies

- Existing update system (no new dependencies)
- Teact hooks (already in project)
- TypeScript types (already defined)

## Timeline Estimate

- **Phase 1**: 2-3 hours (Subscription manager + hook)
- **Phase 2**: 1 hour (Integration)
- **Phase 3**: 2 hours (Implementation details)
- **Phase 4**: 1 hour (Examples)
- **Phase 5**: 2-3 hours (Testing)
- **Total**: ~8-10 hours

## Future Enhancements

1. **Batch Updates**: Support batching multiple updates
2. **Update History**: Store last N updates per subscription
3. **Selective Updates**: Subscribe to specific update types only
4. **Performance Metrics**: Built-in performance monitoring
5. **DevTools Integration**: Visualize subscriptions in dev tools

## Notes

- This implementation is non-breaking - existing update flow continues unchanged
- Subscriptions are opt-in - components must explicitly subscribe
- Memory is managed automatically via unsubscribe functions
- Performance impact is minimal (only processes updates when subscriptions exist)
