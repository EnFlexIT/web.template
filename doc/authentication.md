# Authentication

The template supports two authentication modes against an Agent.Workbench backend:

- JWT / basic-login based authentication
- OIDC / browser-cookie based authentication

The active authentication method is detected from the backend settings and
stored in Redux.

The reusable authentication infrastructure is being migrated incrementally into
the dedicated `src/core` directory. Authentication screens remain responsible
for presentation and user interaction, while reusable authentication logic is
implemented inside the Core.

---

# Central files

| File | Purpose |
| --- | --- |
| `src/redux/slices/apiSlice.tsx` | Main authentication state, API clients, login/logout and server switching. |
| `src/screens/login/Login.tsx` | Login screen for JWT and OIDC authentication. |
| `src/core/server/serverCheck.ts` | Server reachability, authentication detection and backend settings parsing. |
| `src/core/server/types.ts` | Shared server check result types. |
| `src/core/authentication/http/attachAuthInterceptors.tsx` | Registers authentication interceptors for API communication. |
| `src/core/authentication/jwt/jwtRenewSlice.tsx` | JWT renewal for JWT based sessions. |
| `src/core/authentication/session/useSessionActivityWeb.tsx` | Extends OIDC sessions after meaningful user activity. |
| `src/core/authentication/session/useOidcSessionTimerWeb.ts` | OIDC session timer and expiration handling. |
| `src/core/authentication/session/useJwtSessionTimerWeb.ts` | JWT session timer and automatic renewal handling. |
| `src/core/authentication/session/AppSessionGuard.tsx` | Guards the application against invalid sessions. |
| `src/core/authentication/logout/logoutFlowGuard.ts` | Prevents unwanted renewal and logout side effects during logout flows. |
| `src/core/authentication/logout/logoutServers.ts` | Shared multi-server logout orchestration. |

---

# Authentication method detection

`apiSlice` together with the reusable Core server module inspects

```text
/api/app/settings/get
```

Relevant backend settings include:

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

The frontend normalizes the backend response to:

```ts
"jwt" | "oidc" | "unknown"
```

---

# JWT Login

JWT authentication uses:

```text
GET /api/user/login
Authorization: Basic <base64(username:password)>
```

A bearer token can be returned either through a response header or inside the
response body.

The frontend extracts the returned `Bearer ...` token and stores it per server.

JWT tokens are managed through the `jwtByServer` map. This allows switching
between configured servers without losing already authenticated JWT sessions on
other servers.

---

# OIDC Login

OIDC authentication starts via:

```text
<server-base-url>/login
```

For same-origin deployments the browser navigates directly to the server login.

For Expo Web development a popup window is opened while the frontend polls the
backend until the OIDC session becomes authenticated.

OIDC authentication uses browser cookies instead of frontend-managed JWT
tokens. Whenever OIDC is active the frontend clears any JWT information for the
selected server.

---

# Logout behavior

JWT logout calls the backend logout endpoint and then clears the local frontend
authentication state.

OIDC logout is handled through browser navigation to:

```text
<server-base-url>/api/user/logout
```

This allows the identity provider to complete its logout flow including
possible browser redirects.

The reusable logout orchestration has been extracted into the Core
Authentication module.

The Logout UI is responsible only for user interaction. Server selection,
logout execution and multi-server logout handling are implemented as reusable
Core functionality.

---

# Session handling

OIDC session information is loaded from:

```text
GET /api/user/sessionTime
```

The session can be extended using:

```text
GET /api/user/sessionTime/extend
```

`useSessionActivityWeb` extends the session only after meaningful user
interaction such as:

- button clicks
- navigation
- keyboard input

Logout dialogs and logout controls can intentionally be excluded from automatic
session extension.

---

# Important behavior

- Connectivity checks never perform logout.
- OIDC redirects are treated as authentication events rather than connectivity failures.
- JWT renewal is disabled whenever the active server uses OIDC authentication.
- Server switching rebuilds the generated API clients using the selected server and the correct authentication headers.
- Authentication infrastructure is separated from UI components whenever reusable functionality is identified.
- Shared authentication logic is implemented inside `src/core/authentication`.

---

# Current Architecture

The current reusable Authentication Core consists of:

```text
src/core/authentication
├── http
│   └── attachAuthInterceptors.tsx
├── jwt
│   └── jwtRenewSlice.tsx
├── logout
│   ├── logoutFlowGuard.ts
│   └── logoutServers.ts
└── session
    ├── AppSessionGuard.tsx
    ├── useJwtSessionTimerWeb.ts
    ├── useOidcSessionTimerWeb.ts
    └── useSessionActivityWeb.tsx
```

The authentication architecture follows a clear separation of
responsibilities:

- UI components handle presentation and user interaction.
- Core modules implement reusable authentication infrastructure.
- Authentication functionality is migrated incrementally while preserving
  application behavior.