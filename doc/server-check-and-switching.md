# Server Check and Server Switching

The template can manage multiple Agent.Workbench backend servers and switch
between them at runtime.

The reusable server validation and server detection logic is being migrated
incrementally into the dedicated `src/core/server` module.

---

# Central files

| File | Purpose |
| --- | --- |
| `src/redux/slices/serverSlice.ts` | Stores configured servers and active environment. |
| `src/redux/slices/apiSlice.tsx` | Switches API base URL and authentication state. |
| `src/core/server/serverCheck.ts` | Shared server reachability checks, authentication detection and backend settings parsing. |
| `src/core/server/types.ts` | Shared server check result types. |
| `src/redux/slices/connectivitySlice.tsx` | Periodic `/api/alive` connectivity state. |
| `src/redux/slices/serverStatusSlice.ts` | Per-server UI status metadata. |
| `src/components/Footer.tsx` | Server selection, notifications and release badge. |
| `src/screens/ServerSettings.tsx` | Server configuration UI. |
| `src/screens/ServerSwitchOverlay.tsx` | Overlay displayed while switching servers. |
| `src/screens/OfflineOverlay.tsx` | Overlay displayed when the active server becomes unreachable. |

---

# Stored Server Model

A configured server has the following structure:

```ts
type SavedServer = {
  id: string;
  name: string;
  baseUrl: string;
  environment: "DEV" | "TEST" | "PROD";
};
```

Configured servers are stored in AsyncStorage under:

```text
servers
```

If no configuration exists, a default local server is created.

For deployed web applications the runtime origin may replace the default
localhost backend.

---

# Reachability Check

Server reachability is verified using:

```text
GET /api/alive
```

The connectivity check is intentionally lightweight.

Any HTTP response indicates that the backend is reachable, including:

- successful responses
- authentication errors
- redirects
- server errors

The connectivity check answers only one question:

> Can the frontend reach the backend?

It never decides whether a user should be logged out.

---

# Authentication Detection

Authentication information is loaded from:

```text
GET /api/app/settings/get
```

The reusable Core server module evaluates backend settings to determine:

- authentication method
- authenticated state
- application release information
- available security configuration

---

# Server Switching Flow

The current server switching workflow is:

1. User selects a server.
2. The base URL is normalized.
3. Existing JWT information is loaded for the selected server.
4. The reusable Core server module checks the server.
5. Authentication information is evaluated.
6. API clients are rebuilt.
7. Authentication state is updated.
8. Menus are reloaded if required.

The reusable server validation is independent from the Login screen and can be
used from different application modules.

---

# Server Status Metadata

`serverStatusSlice` stores status information for every configured server.

```ts
type ServerStatusMeta = {
  tone: "green" | "yellow" | "red";
  subtitle: string;
};
```

This information is displayed inside the server selection UI.

---

# Offline Behavior

`connectivitySlice` periodically executes `/api/alive` checks.

Connectivity checks are triggered:

- after login
- every 40 seconds
- whenever the browser window becomes active again

`OfflineOverlay` displays the offline state using the Redux connectivity
information.

---

# Current Architecture

The reusable server infrastructure currently consists of:

```text
src/core/server
├── serverCheck.ts
└── types.ts
```

The server module is responsible for reusable server-related functionality,
while UI components remain responsible only for user interaction and
presentation.

The migration follows the project's incremental architecture strategy:

```text
Analyze
↓
Extract reusable functionality
↓
Move into Core
↓
Update imports
↓
Test
↓
Commit
↓
Update documentation
```