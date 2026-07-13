# Redux State Management

The application uses Redux Toolkit. The store is defined in:

```text
src/redux/store.ts
```

Typed hooks are provided in:

```text
src/hooks/useAppDispatch.ts
src/hooks/useAppSelector.ts
```

## Store slices

| State key | Slice file | Responsibility |
| --- | --- | --- |
| `language` | `languageSlice.tsx` | Current UI language and i18n synchronization. |
| `theme` | `themeSlice.tsx` | Theme selection. |
| `api` | `apiSlice.tsx` | API clients, active server URL, auth method, JWT/OIDC login state. |
| `dataPermissions` | `dataPermissionsSlice.tsx` | Data permission dialog state. |
| `menu` | `menuSlice.tsx` | Static/dynamic menu tree and active menu ID. |
| `organizations` | `organizationsSlice.tsx` | Organization data. |
| `ready` | `readySlice.tsx` | Global readiness flag. |
| `baseMode` | `baseModeSlice.ts` | Base/customer mode related state. |
| `servers` | `serverSlice.ts` | Saved servers and active environment. |
| `connectivity` | `connectivitySlice.tsx` | Active server online/offline state. |
| `dbSettings` | `dbSettingsSlice.ts` | Database configuration state. |
| `passwordChangePrompt` | `passwordChangePromptSlice.ts` | Initial password-change dialog state. |
| `notifications` | `notificationSlice.ts` | Local per-server notifications. |
| `execSettings` | `execSettingsSlice.tsx` | Agent Workbench execution settings. |
| `dataAnalysis` | `dataAnalysisSlice.ts` | Background platform analysis data. |
| `update` | `updateSlice.ts` | Frontend/backend update state. |
| `sessionTime` | `sessionTimeSlice.tsx` | OIDC session timing and extension state. |
| `serverStatus` | `serverStatusSlice.ts` | Per-server UI status metadata. |
| `appSettingsFileUpload` | `appSettingsFileUploadSlice.ts` | File upload state. |
| `appRelease` | `appReleaseSlice.tsx` | Web app production/test release type. |
| `userProfile` | `userProfileSlice.ts` | OIDC user profile data. |

## Initialization flow

The root app initializes the application in this order:

1. `initializeServers`
2. `initializeLanguage`
3. `initializeTheme`
4. `initializeApi`
5. `initializeDataPermissions`
6. `initializeOrganizations`
7. `initializeMenu`

This makes the selected server and API clients available before dynamic menu loading.

## API client rebuilds

`apiSlice` builds generated API clients from the active base URL and auth state. When the user switches server or logs in, the API clients are rebuilt with the new configuration.

For JWT, generated API calls receive an `Authorization: Bearer <jwt>` header. For OIDC, generated API calls use `withCredentials: true` and no frontend JWT.

## Menu state

`menuSlice` combines static menu items from `staticMenu.tsx` with dynamic menu items from the backend Dynamic Content API. It builds both a flat raw list and a tree representation.

The active menu ID is used by navigation, breadcrumbs and the generic tab screen.

## Notifications

Notifications are stored locally and grouped by normalized server key. The footer displays the unread count only for the active server.
