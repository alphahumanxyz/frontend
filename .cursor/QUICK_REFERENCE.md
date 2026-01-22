# Quick Reference Guide

## 🚀 Entry Points

| File | Purpose |
|------|---------|
| `src/index.tsx` | Main entry point, initializes app |
| `src/components/App.tsx` | Root component, manages screens |
| `src/components/main/Main.tsx` | Main application interface |

## 📦 State Management

### Getting State
```typescript
import { getGlobal, getActions } from './global';

const global = getGlobal();
const actions = getActions();
```

### Connecting Component to State
```typescript
import { withGlobal } from './global';

export default withGlobal(
  (global): StateProps => ({
    user: selectUser(global, userId),
    chat: selectChat(global, chatId),
  }),
)(Component);
```

### Dispatching Actions
```typescript
// UI Action
actions.openChat({ chatId: '123' });

// API Action
actions.loadChats();

// With callback
actions.sendMessage({ chatId: '123', text: 'Hello' }, { onUpdate: handleUpdate });
```

## 🔌 API Calls

### Making API Calls
```typescript
import { callApi } from './api/gramjs';

const result = await callApi('messages.sendMessage', {
  peer: chat,
  message: 'Hello',
});
```

### API Methods (src/api/gramjs/methods/)
- `auth.ts` - Authentication
- `chats.ts` - Chat operations
- `messages.ts` - Message operations
- `users.ts` - User operations
- `media.ts` - Media upload/download
- `settings.ts` - Settings
- `payments.ts` - Payments
- `calls.ts` - Voice/video calls

## 🎣 Common Hooks

### State Hooks
```typescript
import useAppLayout from './hooks/useAppLayout';
import useLang from './hooks/useLang';

const { isMobile } = useAppLayout();
const lang = useLang();
```

### Data Hooks
```typescript
import useAsync from './hooks/data/useAsync';
import useEnsureMessage from './hooks/useEnsureMessage';

const message = useEnsureMessage(chatId, messageId);
```

### UI Hooks
```typescript
import useShowTransition from './hooks/useShowTransition';
import useKeyboardListNavigation from './hooks/useKeyboardListNavigation';
```

### Media Hooks
```typescript
import useImageLoader from './hooks/media/useImageLoader';
import useAudioPlayer from './hooks/useAudioPlayer';
```

## 📁 Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/global/` | State management |
| `src/api/` | API layer |
| `src/components/` | React components |
| `src/hooks/` | Custom hooks |
| `src/util/` | Utilities |
| `src/lib/` | Third-party libraries |

## 🗂️ Component Structure

```
components/
├── auth/          # Authentication screens
├── main/          # Main app layout
├── left/          # Left sidebar (chat list)
├── middle/        # Middle section (messages)
├── right/         # Right sidebar (info)
├── modals/        # Modal dialogs
├── common/        # Shared components
└── ui/            # UI primitives
```

## 💾 Storage & Cache

### Cache Keys
- `tt-global-state` - Global state (IndexedDB)
- `tt-shared-state` - Shared state (IndexedDB)
- `tt-media` - Media cache (IndexedDB)
- `account{slot}` - Session data (localStorage)

### Cache Functions
```typescript
import { cacheGlobal, loadCachedGlobal } from './global/cache';

// Save
await cacheGlobal(global);

// Load
const cached = await loadCachedGlobal();
```

## 🔄 Data Flow Patterns

### 1. User Action → State Update
```
User clicks → Component → actions.actionName() → Reducer → setGlobal() → Re-render
```

### 2. API Call
```
actions.loadChats() → callApi() → Worker → Telegram API → Update → State → UI
```

### 3. Real-time Update
```
Telegram Update → Worker → API Updater → Reducer → State → UI
```

## 📦 Code Splitting

### Bundles
- `Bundles.Auth` - Authentication
- `Bundles.Main` - Main app
- `Bundles.Extra` - Extra features
- `Bundles.Calls` - Calls
- `Bundles.Stars` - Stars/payments

### Loading Bundles
```typescript
import { loadBundle, Bundles } from './util/moduleLoader';

await loadBundle(Bundles.Calls);
```

### Using in Components
```typescript
import useModuleLoader from './hooks/useModuleLoader';

const Calls = useModuleLoader(Bundles.Calls, 'PhoneCall');
```

## 🎯 Selectors

### Common Selectors
```typescript
import {
  selectChat,
  selectUser,
  selectMessage,
  selectCurrentMessageList,
  selectTabState,
} from './global/selectors';

const chat = selectChat(global, chatId);
const user = selectUser(global, userId);
const message = selectMessage(global, chatId, messageId);
```

## 🔧 Utilities

### Routing
```typescript
import { parseLocationHash } from './util/routing';

const { chatId, messageId } = parseLocationHash();
```

### Multi-Account
```typescript
import { ACCOUNT_SLOT, getAccountsInfo } from './util/multiaccount';

const accounts = getAccountsInfo();
const currentSlot = ACCOUNT_SLOT;
```

### Sessions
```typescript
import { hasStoredSession, storeSession } from './util/sessions';

if (hasStoredSession()) {
  // User has session
}
```

## 🎨 Styling

### SCSS Modules
```typescript
import styles from './Component.module.scss';

<div className={styles.container} />
```

### Class Building
```typescript
import buildClassName from './util/buildClassName';

<div className={buildClassName('base', isActive && 'active')} />
```

## 🐛 Debugging

### Debug Mode
```typescript
import { DEBUG } from './config';

if (DEBUG) {
  console.log('Debug info');
}
```

### State Inspection
```typescript
// Double-click anywhere in DEBUG mode to see state
// Or in console:
const global = getGlobal();
console.log(global);
```

## 🔐 Security

### Passcode
```typescript
import { checkSessionLocked } from './util/sessions';

if (checkSessionLocked()) {
  // Session is locked
}
```

### Session Storage
- Session keys stored in localStorage
- Global state encrypted when passcode enabled
- Multi-account isolation

## 📱 Multi-Tab Support

### Master Tab
- Only master tab communicates with API
- Other tabs request actions from master
- State synchronized via BroadcastChannel

### Tab State
```typescript
const tabState = selectTabState(global, tabId);
const isMaster = tabState.isMasterTab;
```

## 🚦 Common Patterns

### Loading State
```typescript
const isLoading = !chat || !user;
if (isLoading) return <Loader />;
```

### Error Handling
```typescript
try {
  await actions.loadChat({ chatId });
} catch (error) {
  // Handle error
}
```

### Conditional Rendering
```typescript
{isMobile ? <MobileView /> : <DesktopView />}
```

## 📚 Key Files to Know

| File | Purpose |
|------|---------|
| `src/global/index.ts` | State management API |
| `src/global/initialState.ts` | Initial state definitions |
| `src/global/cache.ts` | Cache management |
| `src/api/gramjs/worker/connector.ts` | API connector |
| `src/util/moduleLoader.ts` | Code splitting |
| `src/util/routing.ts` | Routing utilities |
| `src/util/sessions.ts` | Session management |

## 🎯 Best Practices

1. **Always use selectors** for computed state
2. **Use actions** for state updates (never mutate directly)
3. **Memoize expensive computations**
4. **Lazy load** heavy components
5. **Use IndexedDB** for large data, localStorage for small
6. **Throttle** frequent updates (cache, scroll, etc.)
7. **Handle loading states** in async operations
8. **Use TypeScript** types from `api/types/`

---

For detailed information, see [ARCHITECTURE.md](./ARCHITECTURE.md)
