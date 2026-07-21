# File Configuration Upload

The file configuration upload screen allows users to download and upload backend configuration files through the Agent.Workbench settings API.

## Central files

| File | Purpose |
| --- | --- |
| `src/screens/settings/AppSettingsFileUploadScreen.tsx` | UI and upload/download flow. |
| `src/redux/slices/appSettingsFileUploadSlice.ts` | Upload thunk and upload state. |
| `src/hooks/useFileDropWeb.ts` | Drag-and-drop support for web. |
| `src/screens/update/Dialog/BackendUpdateProgressDialog.tsx` | Progress dialog reused for configuration upload/restart/logout phases. |
| `assets/locales/*/FileConfiguration.json` | Translation namespace. |

## Configuration type discovery

The screen loads available configuration types with:

```text
GET /api/app/settings/get
X-Performative: FILE.CONFIGURATION
```

The response is inspected for entries whose key starts with:

```text
configurationtype
```

The first available configuration type is selected by default. If loading fails, the screen falls back to:

```text
JettyConfiguration
```

## Download flow

Current configuration files are downloaded with:

```text
GET /api/app/settings/download
X-Performative: <selected configuration type>
```

The browser receives a blob and creates a temporary download link. The filename is taken from the `Content-Disposition` header when available.

## Upload flow

Configuration files are uploaded with:

```text
POST /api/app/settings/upload
X-Performative: <selected configuration type>
Content-Type: multipart/form-data
```

The upload thunk sends the selected file as `FormData` field:

```text
file
```

For JWT authentication, the `Authorization: Bearer <jwt>` header is added. For OIDC, the request uses browser cookies with `credentials: include`.

## Backend warning/error handling

The upload result may contain:

```ts
messageType: "INFO" | "WARNING" | "ERROR"
message: string
```

`WARNING` and `ERROR` are treated as rejected configuration uploads. In this case, the user gets a warning dialog and the frontend does not continue with logout/restart handling. This prevents invalid configuration files from forcing an unwanted logout.

## Jetty configuration port handling

When the selected file is XML or the selected configuration type is `JettyConfiguration`, the screen tries to inspect Jetty port settings:

```text
http.enabled
http.port
https.enabled
https.port
http.to.https
```

If the file would change the server base URL, the user is asked whether to use the detected new address or keep the current address. If the current address should be kept, the XML file is rewritten in the browser before upload.

## After successful upload

After a successful configuration upload:

1. A progress dialog is shown.
2. The user is informed that the server may restart.
3. The frontend logs out.
4. The selected server base URL is synchronized if needed.
5. The active API base URL is updated.
6. In release/browser mode, the browser can be redirected to the server login URL.

## Web-only behavior

File dialog, drag-and-drop, XML parsing and browser downloads are web-specific features. Native behavior should be handled separately if needed.
