# File Configuration Upload

## Purpose

This document describes the file-configuration upload and download workflow of `web.template`.

The feature allows users to discover, download and upload backend configuration files through the settings API.

The architecture follows:

```text
Application --> Template --> Core
```

The current file-configuration feature is standard Base Template functionality and is therefore Template-owned.

It is not treated as transitional Agent.Workbench Application functionality.

---

# 1. Scope

The file-configuration feature supports:

* discovering available backend configuration types
* selecting a configuration type
* downloading the current configuration
* selecting a local configuration file
* web drag and drop
* uploading configuration files
* handling backend warnings and errors
* inspecting Jetty configuration
* detecting relevant server-address changes
* showing restart and progress information
* coordinating connectivity after backend restart

The current workflow is primarily browser-oriented.

---

# 2. Architectural Ownership

The ownership model is:

```text
Template
|
+-- file-configuration settings screen
+-- upload/download orchestration
+-- upload Redux state
+-- web file-drop integration
+-- warning/error presentation
+-- Jetty configuration workflow
+-- progress presentation integration
+-- localization
+-- server/session coordination

Core
|
+-- reusable technical authentication capabilities
+-- reusable server normalization
+-- reusable server validation/checks

Application
|
+-- concrete product-only extensions when genuinely required
```

Standard Agent.Workbench settings functionality belongs to Template under the current architecture.

The existence of Agent.Workbench-oriented backend endpoints does not by itself make the feature Application-owned.

---

# 3. Important Files

Current important files include:

| File                                                                         | Purpose                                              |
| ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| `src/template/screens/settings/AppSettingsFileUploadScreen.tsx`              | Main UI and upload/download orchestration.           |
| `src/template/state/settings/appSettingsFileUploadSlice.ts`                  | Redux upload state and asynchronous upload behavior. |
| `src/template/hooks/useFileDropWeb.ts`                                       | Reusable browser drag-and-drop behavior.             |
| `src/template/components/design-system/ui-elements/UpdateProgressDialog.tsx` | Shared progress presentation.                        |
| `assets/locales/*/FileConfiguration.json`                                    | File-configuration translation resources.            |

Historical paths such as root-level `src/screens` or `src/hooks` must not be documented as current architecture.

---

# 4. Redux Ownership

File-configuration upload state belongs to Template.

The current slice is:

```text
src/template/state/settings/appSettingsFileUploadSlice.ts
```

It participates in Template Redux infrastructure.

This state is not concrete Application state.

The ownership rule is:

```text
standard Base Template / Agent.Workbench settings state
    -> Template

concrete consumer-only settings state
    -> Application
```

The feature must not be moved into `applicationReducers.ts` merely because it communicates with Agent.Workbench-oriented backend behavior.

---

# 5. Configuration Type Discovery

Available backend configuration types are loaded through:

```text
GET /api/app/settings/get
X-Performative: FILE.CONFIGURATION
```

The response is inspected for entries whose key starts with:

```text
configurationtype
```

The first available configuration type can be selected as the initial value.

The current workflow may fall back to:

```text
JettyConfiguration
```

when configuration-type discovery does not provide a usable value.

Configuration-type discovery belongs to the file-configuration workflow.

---

# 6. Download Flow

The selected backend configuration is downloaded through:

```text
GET /api/app/settings/download
X-Performative: <selected configuration type>
```

Conceptually:

```text
User selects configuration type
        |
        v
Request current configuration
        |
        v
Receive file/blob
        |
        v
Determine filename
        |
        v
Start browser download
```

When provided by the backend, the filename may be derived from the HTTP:

```text
Content-Disposition
```

header.

Browser file-download behavior is web-specific.

---

# 7. Upload Flow

Configuration files are uploaded through:

```text
POST /api/app/settings/upload
X-Performative: <selected configuration type>
Content-Type: multipart/form-data
```

The selected file is sent through a `FormData` field named:

```text
file
```

Conceptually:

```text
Select file
    |
    v
Inspect or validate when required
    |
    v
Create FormData
    |
    v
Upload configuration
    |
    v
Evaluate backend response
```

Upload state is handled through:

```text
src/template/state/settings/appSettingsFileUploadSlice.ts
```

---

# 8. Authentication

The file-configuration workflow must reuse the authentication mechanism of the active server.

For JWT-based authentication, communication uses the active JWT.

Conceptually:

```text
Authorization: Bearer <jwt>
```

For browser OIDC sessions, requests use browser credentials where required.

Conceptually:

```text
credentials: include
```

The feature must not implement separate login, token-management or session infrastructure.

Authentication ownership remains:

```text
technical authentication capability
    -> Core

authentication/session orchestration
    -> Template
```

---

# 9. File Selection UI

The main UI is implemented in:

```text
src/template/screens/settings/AppSettingsFileUploadScreen.tsx
```

The screen coordinates:

* configuration-type selection
* local file selection
* drag and drop
* uploads
* downloads
* warning and error handling
* Jetty configuration inspection
* server-address decisions
* progress presentation
* post-upload coordination

The screen should consume reusable infrastructure rather than duplicate generic behavior.

---

# 10. Web Drag and Drop

Reusable web drag-and-drop behavior is implemented in:

```text
src/template/hooks/useFileDropWeb.ts
```

Conceptually:

```text
Browser drag event
        |
        v
useFileDropWeb
        |
        v
Selected files
        |
        v
File configuration screen
```

The hook is reusable Template functionality.

Screens should not duplicate browser drag-and-drop handling when the shared hook already provides it.

---

# 11. Backend Result Handling

The upload response may contain information such as:

```ts
messageType: "INFO" | "WARNING" | "ERROR";
message: string;
```

The workflow must evaluate the response before continuing with restart, reconnection or authentication-related follow-up behavior.

Conceptually:

```text
Upload result
    |
    +-- INFO
    |     |
    |     v
    |   continue successful workflow
    |
    +-- WARNING
    |     |
    |     v
    |   show warning and stop inappropriate follow-up
    |
    +-- ERROR
          |
          v
        show error and stop follow-up
```

An invalid configuration must not unnecessarily trigger logout or restart handling.

---

# 12. Jetty Configuration

Jetty configuration files may require additional inspection before upload.

Relevant settings include:

```text
http.enabled
http.port
https.enabled
https.port
http.to.https
```

When the selected file represents Jetty configuration, the workflow may inspect the XML to determine whether the effective backend address changes.

Changes to HTTP/HTTPS configuration or ports can affect the URL the frontend must use after backend restart.

Jetty-specific handling is part of the standard Template settings workflow under the current architecture.

---

# 13. Server Address Changes

When an uploaded Jetty configuration changes the backend address, the workflow may allow the user to choose between:

```text
Use detected new server address
```

and:

```text
Keep current server address
```

If the current address should remain active, the browser workflow may adjust relevant configuration values before upload.

Shared server infrastructure must be reused.

Reusable technical server logic belongs under:

```text
src/core/server/
```

The file-configuration feature must not create an independent server-normalization or validation architecture.

---

# 14. Successful Upload and Restart

A successful configuration upload may require backend restart coordination.

Conceptually:

```text
Configuration uploaded
        |
        v
Show progress
        |
        v
Backend may restart
        |
        v
Synchronize server address if required
        |
        v
Wait for connectivity
        |
        v
Reevaluate session/authentication state
        |
        v
Continue with active server
```

The exact behavior depends on the uploaded configuration and the active authentication mechanism.

The workflow must reuse existing server, connectivity and authentication infrastructure.

---

# 15. Connectivity Is Not Authentication

Temporary backend unavailability during restart is a connectivity event.

It must not automatically be treated as:

```text
authentication failure
```

The architecture rule is:

```text
Connectivity failure != authentication failure
```

Reusable connectivity state belongs to Template.

Technical server checks belong to Core.

Related documentation:

```text
doc/server-check-and-switching.md
doc/authentication.md
```

---

# 16. Progress Dialog

The feature uses the shared progress component:

```text
src/template/components/design-system/ui-elements/UpdateProgressDialog.tsx
```

The same reusable component is also used by update workflows such as:

```text
src/template/screens/update/tabs/UpdateBackendTab.tsx
src/template/screens/update/tabs/UpdateWebAppTab.tsx
```

This reuse is intentional.

The progress dialog owns presentation.

The file-configuration feature owns file-configuration workflow decisions.

---

# 17. Design System Ownership

`UpdateProgressDialog` belongs to the Template design system because it is reusable presentation shared by multiple workflows.

Conceptually:

```text
File configuration workflow
        |
        +------------------+
                           |
Backend/WebApp update -----+
                           |
                           v
                UpdateProgressDialog
```

Generic presentation belongs to the design system.

Feature-specific decisions remain with the owning feature.

---

# 18. Browser-Specific Behavior

Several parts of the current workflow depend on browser APIs:

* file picker behavior
* drag and drop
* browser downloads
* Blob handling
* Blob URLs
* XML parsing
* browser redirection

Do not assume these APIs are available on every React Native platform.

If the workflow is later required on native platforms, adapters or platform-specific implementations may be necessary.

---

# 19. Localization

User-facing text uses the `FileConfiguration` translation namespace.

Resources are located under:

```text
assets/locales/*/FileConfiguration.json
```

User-visible text should use existing translation infrastructure.

Do not introduce hard-coded messages when an appropriate translation key exists or should be added.

---

# 20. Relationship to Application Configuration

Backend file configuration must not be confused with the developer-facing Application configuration architecture.

Developer-facing Application configuration uses:

```text
src/application/config/application.properties
src/application/config/features.properties
src/application/config/navigation.properties
```

The file-configuration feature documented here handles backend configuration files at runtime.

These are separate concerns:

```text
Application .properties configuration
    -> build/composition configuration

File Configuration Upload
    -> runtime backend settings workflow
```

Do not mix the two configuration systems.

---

# 21. Agent.Workbench Ownership

The previous architecture treated Agent.Workbench-oriented behavior as a possible future Application extraction candidate.

That is no longer the selected architecture.

The current rule is:

```text
standard Agent.Workbench functionality
    -> Template
```

Therefore the following is not planned:

```text
move File Configuration Upload into a separate Agent.Workbench Application
move its Redux state into Agent.Workbench applicationReducers
create an Agent.Workbench-specific settings repository layer
```

The feature remains Template-owned as standard Base Template settings functionality.

---

# 22. Concrete Application Extensions

A concrete Application such as HEMS may provide additional settings or configuration workflows when they are genuinely product-specific.

Such behavior should remain Application-owned.

Conceptually:

```text
Template
|
+-- standard file-configuration workflow
+-- reusable file-drop behavior
+-- shared progress UI
+-- standard Agent.Workbench settings behavior

HEMS Application
|
+-- HEMS-only configuration behavior if required
```

Concrete product extensions must not require Template to import Application implementation.

---

# 23. API Ownership

The current workflow communicates with:

```text
/api/app/settings/*
```

API ownership must follow responsibility rather than endpoint naming alone.

Under the current architecture:

```text
reusable technical communication
    -> Core where appropriate

standard Base Template / Agent.Workbench settings integration
    -> Template

concrete product-only backend integration
    -> Application
```

Do not classify an endpoint as Application-owned solely because it is currently associated with Agent.Workbench backend behavior.

---

# 24. Current Status

## Implemented

The current documented implementation includes:

```text
Template-owned file-configuration screen
configuration-type discovery
configuration download
configuration upload
JWT/OIDC-aware communication
browser file selection
web drag and drop
Template Redux upload state
warning/error handling
Jetty configuration inspection
server-address coordination
shared progress-dialog reuse
localization
```

## Established Ownership

```text
file-configuration workflow
    -> Template

upload Redux state
    -> Template

web file-drop hook
    -> Template

shared progress presentation
    -> Template design system

technical server/authentication capabilities
    -> Core
```

## Future Extensions

Future concrete Applications may add product-specific configuration behavior when required.

Such extensions do not change ownership of the standard Base Template workflow.

---

# 25. Architecture Rules

Changes to this feature must preserve these rules:

1. Core must not import Template UI.
2. Core must not import Application.
3. Template must not import a concrete Application.
4. Standard Agent.Workbench file-configuration behavior remains Template-owned.
5. Generic UI belongs to the Template design system.
6. Upload Redux state remains with the feature owner.
7. Authentication must reuse existing authentication infrastructure.
8. Connectivity must remain separate from authentication.
9. Server normalization and technical checks must reuse Core infrastructure.
10. Browser-only APIs must not silently become cross-platform assumptions.
11. Warning and error responses must stop inappropriate follow-up workflows.
12. Screens must not duplicate reusable file-drop or progress UI.
13. Concrete product-only extensions belong to Application.
14. Generated API code must not be modified during unrelated cleanup.
15. Runtime backend configuration must not be confused with developer-facing Application `.properties` configuration.

---

# 26. Validation

After changing the file-configuration feature, search relevant dependencies:

```bash
git grep -n "AppSettingsFileUploadScreen" -- src test
git grep -n "appSettingsFileUploadSlice" -- src test
git grep -n "useFileDropWeb" -- src test
git grep -n "UpdateProgressDialog" -- src test
```

Run configuration generation when relevant:

```bash
npm run config:generate
```

Run TypeScript validation:

```bash
npx tsc --noEmit
```

Run affected tests.

Validate the patch:

```bash
git diff --check
git status --short
```

When runtime behavior changes, use the normal npm startup path:

```bash
npm start
```

For a cleared Expo cache while preserving npm lifecycle hooks:

```bash
npm start -- --clear
```

---

# 27. Incorrect Legacy Statements

The following statements are no longer correct:

```text
"The file-configuration workflow may later move into the Agent.Workbench Application."

"Agent.Workbench configuration workflow belongs to Application."

"The file-configuration Redux state is transitional."

"The feature must be extracted before repository separation."

"Agent.Workbench-oriented backend settings endpoints make the feature Application-owned."
```

The current ownership is:

```text
standard file-configuration workflow
    -> Template

technical server/authentication capabilities
    -> Core

concrete consumer-only configuration behavior
    -> Application
```

---

# 28. Success Criteria

The file-configuration architecture is correct when:

1. The documented source paths match the current Template structure.
2. Standard file-configuration functionality remains Template-owned.
3. Upload state remains clearly owned by Template.
4. Shared progress presentation is reused.
5. Web file-drop behavior is not duplicated.
6. JWT and OIDC communication remain compatible with shared authentication infrastructure.
7. Backend restart handling keeps connectivity separate from authentication failure.
8. Jetty handling reuses shared server infrastructure.
9. Concrete consumer-specific extensions can remain Application-owned.
10. Template does not import concrete Application implementation.
11. Runtime backend configuration remains separate from developer-facing Application configuration.
12. Architecture ownership remains consistent with `Application --> Template --> Core`.

---

# 29. Summary

The file-configuration workflow is part of the reusable Base Template.

Its architecture
