# Update System

The update system provides frontend and backend update checks through Agent.Workbench app settings performatives.

## Central files

| File | Purpose |
| --- | --- |
| `src/redux/slices/updateSlice.ts` | Redux state and thunks for update settings, checks and execution. |
| `src/screens/update/tabs/UpdateGeneralTab.tsx` | Auto-update setting and summary status. |
| `src/screens/update/tabs/UpdateWebAppTab.tsx` | Web app update check and execution. |
| `src/screens/update/tabs/UpdateBackendTab.tsx` | Backend update check, version lists and restart/logout flow. |
| `src/screens/update/Dialog/BackendUpdateProgressDialog.tsx` | Progress dialog for update/configuration flows. |
| `src/hooks/useUpdateNotifierWeb.ts` | Creates notifications when a new frontend version is available. |
| `src/hooks/usePostLoginAutoReloadWeb.ts` | Optional post-login auto-update/reload for JWT flow. |

## Backend performatives

The update system uses `getAppSettings` and `setAppSettings` with these performatives:

| Performative | Purpose |
| --- | --- |
| `UPDATE.STRATEGY` | Load/save auto-update strategy. |
| `UPDATE.FRONTEND.CHECK` | Check if a frontend update is available. |
| `UPDATE.FRONTEND.EXECUTE` | Execute frontend update. |
| `UPDATE.BACKEND.CHECK` | Check if a backend update is available. |
| `UPDATE.BACKEND.EXECUTE` | Execute backend update. |

## Update state

`updateSlice` stores:

```ts
{
  autoUpdate: boolean;
  loading: boolean;
  lastLoadedAt: number | null;
  frontend: {
    isPending: boolean;
    isAvailable: boolean;
    lastCheck: string;
    version: string;
    newVersion: string;
    currentVersion: string;
  };
  backend: {
    isPending: boolean;
    isAvailable: boolean;
    lastCheck: string;
    status: string;
    progress: number;
  };
}
```

## Cache behavior

`loadUpdateSettingsIfNeeded` caches update settings in `localStorage`:

```text
update:lastLoadedAt
update:settingsCache
```

The default maximum age is 30 minutes. A forced load bypasses the cache.

## Frontend update flow

1. User opens the Web-App update tab or the notifier runs in the background.
2. The frontend calls `UPDATE.FRONTEND.CHECK`.
3. The update state is refreshed.
4. If an update is available, the user can execute it through `UPDATE.FRONTEND.EXECUTE`.
5. After successful execution, the browser reloads with `window.location.reload()`.

## Backend update flow

1. The backend tab calls `UPDATE.BACKEND.CHECK`.
2. It also loads installed features and bundles via:

```text
GET /api/version?type=FEATURE
GET /api/version?type=BUNDLE_OF_FEATURE&filter=<featureId>
```

3. If a backend update is available, `UPDATE.BACKEND.EXECUTE` is triggered.
4. The frontend shows a progress dialog.
5. The frontend waits until the server becomes reachable again using the server check.
6. After reconnecting, the frontend logs out and redirects the user back to the login flow.

## Notifications

`useUpdateNotifierWeb` can create a local notification when the active server reports a new frontend version. The notification action points to menu ID `3014`, which is the update/app-info area.
