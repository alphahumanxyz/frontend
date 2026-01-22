# Project Architecture Overview

## Table of Contents
1. [Entry Points](#entry-points)
2. [State Management](#state-management)
3. [API Layer](#api-layer)
4. [Hooks System](#hooks-system)
5. [Local Storage & Caching](#local-storage--caching)
6. [Component Structure](#component-structure)
7. [Code Splitting & Bundles](#code-splitting--bundles)
8. [Key Utilities](#key-utilities)

---

## Entry Points

### Main Entry: `src/index.tsx`
The application's primary entry point that orchestrates initialization:

1. **Error Handling Setup**: `./util/handleError`
2. **Service Worker**: `./util/setupServiceWorker`
3. **Global State Init**: `./global/init`
4. **Framework Setup**: TeactDOM (custom React-like framework)
5. **Initialization Flow**:
   - Checks compatibility
   - Sets up multi-tab coordination
   - Initializes global state
   - Loads localization
   - Renders `<App />` component

### App Component: `src/components/App.tsx`
Root component that manages application screens:
- **Auth Screen**: Phone number, code, password, QR code
- **Main Screen**: Main application interface
- **Lock Screen**: Passcode protection
- **Inactive Screen**: When another client is active

**Key Features**:
- Screen transitions based on auth state
- Multi-account support
- Theme management
- Background mode detection

---

## State Management

### Architecture: Custom State Management (TeactN)

The project uses a custom state management system built on top of Teact (React-like framework).

### Core Files:
- **`src/global/index.ts`**: Main state management API
  - `getGlobal()`: Get current global state
  - `setGlobal()`: Update global state
  - `getActions()`: Get action dispatchers
  - `addActionHandler()`: Register action handlers

### State Structure:

#### 1. **Global State** (`src/global/types/globalState.ts`)
Contains application-wide state:
- `auth`: Authentication state
- `users`: User data indexed by ID
- `chats`: Chat/conversation data
- `messages`: Messages organized by chat
- `settings`: User preferences
- `passcode`: Screen lock state
- `byTabId`: Per-tab state (multi-tab support)
- `sharedState`: Shared across tabs (theme, language, etc.)

#### 2. **Tab State** (`src/global/types/tabState.ts`)
Per-tab UI state:
- `messageLists`: Active chat threads
- `leftColumn`: Left sidebar state
- `globalSearch`: Search state
- `mediaViewer`: Media viewer state
- `notifications`: Local notifications

#### 3. **Shared State** (`src/global/types/sharedState.ts`)
Shared across all tabs:
- `settings`: Theme, language, animation level
- `isInitial`: Initialization flag

### Action System:

Actions are organized into three categories:

1. **API Actions** (`src/global/actions/api/`):
   - Trigger API calls
   - Examples: `loadChats`, `sendMessage`, `loadUser`

2. **UI Actions** (`src/global/actions/ui/`):
   - Update UI state
   - Examples: `openChat`, `toggleLeftColumn`, `openMediaViewer`

3. **API Updaters** (`src/global/actions/apiUpdaters/`):
   - Handle API update events
   - Examples: `onUpdateNewMessage`, `onUpdateChat`, `onUpdateUser`

### Reducers: `src/global/reducers/`
Pure functions that transform state:
- `chats.ts`: Chat state updates
- `messages.ts`: Message state updates
- `users.ts`: User state updates
- `tabs.ts`: Tab state updates
- `settings.ts`: Settings updates

### Selectors: `src/global/selectors/`
Computed state getters:
- `selectChat()`, `selectUser()`, `selectMessage()`
- Memoized for performance
- Used in components via `withGlobal()` HOC

### Initialization: `src/global/init.ts`
- Sets up initial tab state
- Restores viewport positions
- Handles multi-tab coordination
- Loads cached state

---

## API Layer

### Architecture: Web Worker + GramJS

The API layer runs in a Web Worker for performance isolation.

### Core Files:

#### 1. **API Connector**: `src/api/gramjs/worker/connector.ts`
- Manages communication with Web Worker
- Handles request/response lifecycle
- Manages multi-tab coordination (only master tab communicates with worker)

**Key Functions**:
- `initApi()`: Initialize API connection
- `callApi()`: Make API calls
- `cancelApiProgress()`: Cancel ongoing requests

#### 2. **API Worker**: `src/api/gramjs/worker/worker.ts`
- Runs in separate thread
- Uses GramJS library for Telegram API
- Handles MTProto protocol
- Manages connection state

#### 3. **API Methods**: `src/api/gramjs/methods/`
Organized by domain:
- `auth.ts`: Authentication
- `chats.ts`: Chat operations
- `messages.ts`: Message operations
- `users.ts`: User operations
- `media.ts`: Media upload/download
- `settings.ts`: Settings sync
- `payments.ts`: Payment operations
- `calls.ts`: Voice/video calls

#### 4. **API Builders**: `src/api/gramjs/apiBuilders/`
Convert GramJS types to internal API types:
- `chats.ts`: Chat type conversion
- `messages.ts`: Message type conversion
- `users.ts`: User type conversion

#### 5. **Update System**: `src/api/gramjs/updates/`
Handles real-time updates from Telegram:
- `updateManager.ts`: Update queue management
- `mtpUpdateHandler.ts`: MTProto update handling
- `apiUpdateEmitter.ts`: Emits updates to UI

### API Types: `src/api/types/`
TypeScript definitions for API entities:
- `chats.ts`, `messages.ts`, `users.ts`, `media.ts`, etc.

### Local Database: `src/api/gramjs/localDb.ts`
In-memory cache for API entities:
- Caches users, chats, messages, documents
- Reduces redundant API calls
- Synced with IndexedDB

---

## Hooks System

### Location: `src/hooks/`

The project has 120+ custom hooks organized by category:

### Categories:

#### 1. **Data Hooks** (`hooks/data/`):
- `useAsync.ts`: Async data fetching
- `useEnsureMessage.ts`: Ensure message is loaded
- `useEnsureStory.ts`: Ensure story is loaded

#### 2. **UI Hooks** (`hooks/`):
- `useAppLayout.ts`: Responsive layout detection
- `useShowTransition.ts`: Animation transitions
- `useMenuPosition.ts`: Context menu positioning
- `useKeyboardListNavigation.ts`: Keyboard navigation

#### 3. **Media Hooks** (`hooks/media/`):
- `useAudioPlayer.ts`: Audio playback
- `useImageLoader.ts`: Image loading
- `useMedia.ts`: Media handling
- `useVideoCleanup.ts`: Video cleanup

#### 4. **Scroll Hooks** (`hooks/scroll/`):
- `useInfiniteScroll.ts`: Infinite scrolling
- `useScrolledState.ts`: Scroll position tracking

#### 5. **Event Hooks** (`hooks/events/`):
- `useLongPress.ts`: Long press detection
- `useFastClick.ts`: Fast click handling
- `useHotkeys.ts`: Keyboard shortcuts

#### 6. **Animation Hooks** (`hooks/animations/`):
- `useHeavyAnimation.ts`: Heavy animation detection
- `useShowTransition.ts`: Transition animations

#### 7. **Window Hooks** (`hooks/window/`):
- `useBackgroundMode.ts`: Background/foreground detection
- `useResize.ts`: Window resize handling

#### 8. **Scheduler Hooks** (`hooks/schedulers/`):
- `useDebouncedCallback.ts`: Debounced callbacks
- `useThrottledCallback.ts`: Throttled callbacks

#### 9. **Module Loading**:
- `useModuleLoader.ts`: Lazy load code bundles

### Key Patterns:
- Hooks use Teact's hooks API (similar to React)
- Many hooks integrate with global state
- Performance-optimized with memoization

---

## Local Storage & Caching

### Storage Strategy: Multi-Layer Caching

#### 1. **IndexedDB** (Primary Cache)
**Location**: `src/global/cache.ts`

**Stored Data**:
- Global state (`tt-global-state`)
- Shared state (`tt-shared-state`)
- Media cache (`tt-media`, `tt-media-avatars`)
- Language packs (`tt-lang-packs-v50`)
- Assets (`tt-assets`)

**Cache Management**:
- **Throttled Updates**: Updates throttled to 5 seconds
- **Reduction**: Only essential data cached (limited lists)
- **Migration**: Automatic cache migration on version changes
- **Encryption**: Encrypted when passcode is enabled

**Cache Limits**:
- Users: 500
- Chats: 200
- Archived chats: 10
- Custom emojis: 150

#### 2. **LocalStorage** (Session & Legacy)
**Location**: `src/util/sessions.ts`, `src/util/multiaccount.ts`

**Stored Data**:
- Session keys (`dc{id}_auth_key`)
- Account slots (`account{slot}`)
- Multi-tab coordination (`tt-multitab`)
- Screen lock state (`tt-is-screen-locked`)

**Multi-Account Support**:
- Up to 6 accounts
- Each account has separate session storage
- Account switching via URL hash

#### 3. **Cache Lifecycle**:

**Initialization**:
```typescript
// Loads from IndexedDB
const cache = await loadCache(initialState);
```

**Updates**:
- Automatic on state changes (throttled)
- On window blur
- On before unload
- Manual via `saveSession` action

**Cleanup**:
- Removed on logout
- Cleared on cache version mismatch
- Reduced to essential data only

#### 4. **Passcode Protection**:
- When passcode is set, global state is encrypted
- Encrypted state stored separately
- Decrypted on unlock

---

## Component Structure

### Organization: `src/components/`

#### 1. **Main Sections**:

**`auth/`**: Authentication screens
- Phone number input
- Code verification
- Password entry
- QR code scanning

**`main/`**: Main application
- Main layout
- Lock screen
- Inactive screen

**`left/`**: Left sidebar (Chat list)
- Chat list
- Folder management
- Search

**`middle/`**: Middle section (Messages)
- Message list
- Message composer
- Thread view

**`right/`**: Right sidebar (Info panel)
- Chat info
- User profile
- Group info

**`modals/`**: Modal dialogs
- Settings
- Media viewer
- Payment modals
- Various dialogs

**`common/`**: Shared components
- Buttons
- Inputs
- Loaders
- Notifications

**`ui/`**: UI primitives
- Transitions
- Menus
- Tooltips
- Form controls

#### 2. **Component Patterns**:

**State Connection**:
```typescript
export default withGlobal(
  (global): StateProps => ({
    // Select state
  }),
)(Component);
```

**Async Components**:
- Many components are code-split
- Loaded on demand via `useModuleLoader`

**Performance**:
- Heavy use of memoization
- Virtual scrolling for lists
- Lazy loading for media

---

## Code Splitting & Bundles

### Bundle System: `src/bundles/`

The project uses webpack code splitting with 5 main bundles:

#### 1. **Auth Bundle** (`bundles/auth.ts`)
- Authentication components
- Loaded during auth flow

#### 2. **Main Bundle** (`bundles/main.ts`)
- Main application components
- Loaded after authentication

#### 3. **Extra Bundle** (`bundles/extra.ts`)
- Additional features
- Loaded on demand

#### 4. **Calls Bundle** (`bundles/calls.ts`)
- Voice/video call components
- Loaded when calls are initiated

#### 5. **Stars Bundle** (`bundles/stars.ts`)
- Stars/payment features
- Loaded on demand

### Module Loader: `src/util/moduleLoader.ts`

**API**:
- `loadBundle(bundleName)`: Load bundle
- `loadModule(bundleName)`: Load module
- `getModuleFromMemory()`: Get cached module

**Usage in Components**:
```typescript
const Main = useModuleLoader(Bundles.Main, 'Main');
```

**Benefits**:
- Reduced initial bundle size
- Faster initial load
- On-demand feature loading

---

## Key Utilities

### 1. **Routing**: `src/util/routing.ts`
- Hash-based routing
- Parses location hash for chat/message IDs
- Handles deep linking

### 2. **Multi-Tab Coordination**: `src/util/establishMultitabRole.ts`
- Master/slave tab system
- Only master tab communicates with API
- State synchronization via BroadcastChannel

### 3. **Localization**: `src/util/localization.ts`
- Multi-language support
- Language pack loading
- String interpolation

### 4. **Media Handling**: `src/util/media/`
- Image processing
- Video handling
- File uploads
- Media caching

### 5. **Performance**: `src/lib/fasterdom/`
- Custom DOM manipulation library
- RequestAnimationFrame optimization
- Mutation batching

### 6. **Error Handling**: `src/util/handleError.ts`
- Global error boundary
- Error reporting
- User-friendly error messages

### 7. **Service Worker**: `src/serviceWorker/`
- Offline support
- Background sync
- Push notifications

---

## Data Flow

### 1. **User Action → UI Action → State Update**
```
User clicks → UI Action → Reducer → State Update → Component Re-render
```

### 2. **API Call Flow**
```
UI Action → API Action → Worker Connector → Web Worker → Telegram API
                                                              ↓
Component Update ← State Update ← API Updater ← Update Event
```

### 3. **State Persistence**
```
State Change → Cache Reducer → IndexedDB → Load on Next Session
```

---

## Key Design Patterns

1. **Action-Based State Management**: All state changes go through actions
2. **Selector Pattern**: Computed state via selectors
3. **Reducer Pattern**: Pure functions for state updates
4. **HOC Pattern**: `withGlobal()` for state connection
5. **Code Splitting**: Lazy loading for performance
6. **Worker Pattern**: API in separate thread
7. **Multi-Tab Pattern**: Single master tab for API
8. **Cache-First**: Load from cache, sync with server

---

## Development Workflow

### Entry Point Flow:
1. `index.tsx` → Initialize error handling, service worker
2. `global/init.ts` → Initialize state management
3. `util/init.ts` → Load cached state
4. `components/App.tsx` → Render appropriate screen
5. `api/gramjs/worker/connector.ts` → Initialize API connection

### State Update Flow:
1. User interaction → Component event
2. Component calls `getActions().actionName()`
3. Action handler processes → Calls reducer
4. Reducer returns new state → `setGlobal()`
5. Components re-render via `withGlobal()`
6. Cache updated (throttled)

### API Call Flow:
1. Action calls `callApi()`
2. Request queued if not master tab
3. Master tab sends to Web Worker
4. Worker executes via GramJS
5. Response/update sent back
6. API updater processes update
7. State updated → UI refreshed

---

## Performance Optimizations

1. **Code Splitting**: 5 bundles loaded on demand
2. **Virtual Scrolling**: Large lists use virtual scrolling
3. **Memoization**: Selectors and components memoized
4. **Throttled Updates**: Cache updates throttled
5. **Worker Thread**: API in separate thread
6. **Lazy Loading**: Components and modules loaded on demand
7. **Media Caching**: Images/videos cached in IndexedDB
8. **State Reduction**: Only essential data cached

---

## Security Features

1. **Passcode Protection**: Encrypted state storage
2. **Session Management**: Secure session key storage
3. **Multi-Account Isolation**: Separate storage per account
4. **Screen Lock**: Automatic lock on inactivity
5. **Secure Storage**: Sensitive data in IndexedDB, not localStorage

---

This architecture provides a scalable, performant, and maintainable codebase for a Telegram Web client with multi-account support, offline capabilities, and real-time updates.
