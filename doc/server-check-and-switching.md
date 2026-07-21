# Server Check and Server Switching

The template can manage multiple Agent.Workbench backend servers and switch between them at runtime.

## Central files

| File | Purpose |
| --- | --- |
| `src/redux/slices/serverSlice.ts` | Stores configured servers and active environment. |
| `src/redux/slices/apiSlice.tsx` | Switches API base URL and authentication state. |
| `src/screens/login/serverCheck.ts` | Checks server reachability and authentication state. |
| `src/redux/slices/connectivitySlice.tsx` | Periodic `/api/alive` connectivity state. |
| `src/redux/slices/serverStatusSlice.ts` | Per-server UI status tone and subtitle. |
| `src/components/Footer.tsx` | Server dropdown, notification button and test-release badge. |
| `src/screens/ServerSettings.tsx` | Server configuration UI. |
| `src/screens/ServerSwitchOverlay.tsx` | Visual overlay during server switch. |
| `src/screens/OfflineOverlay.tsx` | Visual overlay when the active server is unreachable. |

## Stored server model

A saved server has this shape:

```ts
type SavedServer = {
  id: string;
  name: string;
  baseUrl: string;
  environment: "DEV" | "TEST" | "PROD";
};
```

The server list is persisted in AsyncStorage under:

```text
servers
```

If no server list exists, the application creates a default `local` server. In a real deployed web environment, the runtime origin can replace `localhost` as default backend URL.

## Reachability check

Reachability is checked through:

```text
GET /api/alive
```

The connectivity check is intentionally lightweight. Any HTTP response means that the server is reachable. This includes authentication errors, redirects and server errors. Connectivity only answers the question: “Can the frontend reach the backend?” It does not decide whether the user should be logged out.

## Authentication check

Authentication state is checked through:

```text
GET /api/app/settings/get
```

The result is parsed for authentication mode, authenticated state and web-app release type.

## Server switching flow

1. User selects a server in the footer dropdown.
2. The frontend normalizes the selected base URL.
3. Existing JWT for this server is loaded from storage.
4. The server authentication state is checked.
5. If the server is already authenticated, `switchServer` updates the active server and rebuilds the API clients.
6. If the server needs JWT authentication, a server login modal is shown outside the login page.
7. If the server is OIDC or unknown, the selected server is switched without JWT.
8. If logged in, the menu is reloaded from static and dynamic menu sources.

## Server status metadata

`serverStatusSlice` stores UI metadata by server ID:

```ts
type ServerStatusMeta = {
  tone: "green" | "yellow" | "red";
  subtitle: string;
};
```

The footer dropdown can display these tones to show whether a server is logged in, pending or unavailable.

## Offline behavior

`connectivitySlice` runs repeated `/api/alive` checks after login. The root app triggers a silent check every 40 seconds and when the browser window receives focus. The `OfflineOverlay` reads this Redux state and displays the offline condition.
