# Authentication

The template supports two authentication modes against an Agent.Workbench backend:

- JWT / basic-login based authentication
- OIDC / browser-cookie based authentication

The active mode is detected from backend settings and stored in Redux.

## Central files

| File | Purpose |
| --- | --- |
| `src/redux/slices/apiSlice.tsx` | Main authentication state, API clients, login/logout, server switching. |
| `src/screens/login/Login.tsx` | Login screen for JWT and OIDC flows. |
| `src/screens/login/serverCheck.ts` | Reachability/authentication detection and settings parsing. |
| `src/redux/slices/jwtRenewSlice.tsx` | JWT renewal for JWT based sessions. |
| `src/redux/slices/sessionTimeSlice.tsx` | OIDC session time loading and extension. |
| `src/hooks/useSessionActivityWeb.tsx` | Extends OIDC session on meaningful user activity. |
| `src/hooks/useOidcSessionTimerWeb.ts` | OIDC session timer display and expiry behavior. |
| `src/hooks/useJwtSessionTimerWeb.ts` | JWT timer and renewal behavior. |
| `src/redux/slices/logoutFlowGuard.ts` | Prevents unwanted renewal/logout side effects during logout flows. |

## Authentication method detection

`apiSlice` and `serverCheck` inspect `/api/app/settings/get`.

Relevant backend keys include:

```text
_AuthenticationMethod
_ServerWideSecurityConfiguration
_Authenticated
_session.id
_session.pathParameter
_oidc.*
_oidc.bearer
_oidc.access_token
```

The frontend normalizes the backend result to:

```ts
"jwt" | "oidc" | "unknown"
```

## JWT login

JWT login uses:

```text
GET /api/user/login
Authorization: Basic <base64(username:password)>
```

A bearer token can be returned either in a response header or in the response body. The frontend extracts `Bearer ...` and stores the token per server.

JWT tokens are stored by server base URL using the `jwtByServer` map. This allows the user to switch between configured servers without losing an already valid token for another server.

## OIDC login

OIDC login starts through:

```text
<server-base-url>/login
```

For same-origin deployments, the browser navigates directly to the server login URL. For Expo Web development, the login flow opens a popup and polls the server until the backend reports that the OIDC session is authenticated.

OIDC uses browser cookies and does not store a frontend JWT. For OIDC, the frontend clears JWT state for the selected server.

## Logout behavior

JWT logout uses the backend logout endpoint and then clears local frontend state.

OIDC logout is handled through real browser navigation to:

```text
<server-base-url>/api/user/logout
```

This is important because OIDC logout may need visible browser redirects to the identity provider. The frontend intentionally avoids showing a local login screen during this redirect flow.

## Session handling

OIDC session time is loaded from:

```text
GET /api/user/sessionTime
```

The session can be extended through:

```text
GET /api/user/sessionTime/extend
```

`useSessionActivityWeb` extends the session only for meaningful user interaction, such as clicks on interactive elements or relevant keyboard input. Logout controls and dialogs can be excluded from automatic extension.

## Important behavior

- Connectivity checks do not perform logout.
- OIDC redirects are treated as authentication signals, not as general server-offline errors.
- JWT renewal is disabled for the active server when that server is detected as OIDC.
- Server switching rebuilds the generated API clients with the selected base URL and the correct authentication headers.
