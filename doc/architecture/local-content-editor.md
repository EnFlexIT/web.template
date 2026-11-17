# Local Content and Menu Editor Architecture

## 1. Purpose and Status

This document describes the local content and menu editor
implemented in `web.template`.

Implementation reference:

- Branch: `feature/content-menu-editor`
- Feature commit: `cc72f8a`
- Implementation baseline: 2026-10-26
- Validation: 61 Jest suites, 392 tests passed
- TypeScript: `npx tsc --noEmit` passed

The editor is part of the reusable Template layer.

It allows local content drafts and menu structures to be
created, modified, previewed and validated.

Local editing and previewing do not publish content
to a backend.

## 2. Architectural Ownership

The architectural dependency direction remains:

```text
Application --> Template --> Core
```

The Template owns the editor implementation and reusable
menu infrastructure.

The concrete Application selects features, supplies
configuration and composes Application-specific content.

Developer-facing Application configuration remains based
on `.properties` files. Generated TypeScript is an
implementation artifact, not the primary developer-facing
configuration format.

The local editor is located under:

```text
src/template/editor/
```

Its main responsibility groups are:

- `adapters/`: preview and content data transformations
- `authorization/`: local editing permission checks
- `components/`: editing forms, panels, and viewers
- `config/`: development preview controls
- `context/`: shared editor and preview state
- `hooks/`: draft and preview lifecycle
- `model/`: draft and menu data types
- `screens/`: editor and preview screens
- `storage/`: local draft persistence and save coordination
- `utils/`: immutable draft transformation helpers
- `validation/`: draft and menu placement validation

## 3. Menu and Content Editing

The implementation provides functionality for:

- creating content folders and pages
- renaming, moving and deleting local content entries
- editing page titles and text blocks
- adding and deleting text blocks
- applying or discarding page changes
- previewing local content alongside the editor

Menu transformations and validation are separated from
presentation components.

Menu integration also includes navigation adapters
and filtering of invalid dynamic menu hierarchies.

## 4. Draft Model and Local Persistence

Draft persistence is implemented in:

```text
src/template/editor/storage/localEditorDraftStorage.ts
```

Storage uses `@react-native-async-storage/async-storage`.

The supported storage scopes are:

```text
preview
regular
```

The key format is:

```text
content-menu-editor:<scope>:v1:<applicationId>
```

Stored drafts are treated as untrusted until validated.

Draft loading, restoration, save ordering and save failure
handling are implemented separately.

The local operation queue serializes operations for the
same Application and storage scope within a JS runtime.

It does not provide cross-tab locking.

This mechanism is not a backend content repository,
publishing workflow or multi-user synchronization layer.

## 5. Live Preview

The editor uses shared context for local content
preview state and an additional live-page context
for unsaved page changes.

The page edit form publishes its working page for
immediate preview.

The preview screen uses the live page when its ID matches
the requested page. Otherwise it uses the existing
page rendering and editing path.

The working page and baseline page are distinct.
Changes can be discarded or applied.

The live preview must not be interpreted as a
confirmed backend save.

## 6. Editor Panel and Developer Console

The editor panel is controlled by:

```text
src/template/editor/context/LocalContentEditorPanelContext.tsx
```

Supported requests include:

- creating a folder or page
- managing an existing entry
- closing the editor
- switching to the Developer Console

The context tracks uncommitted page-form changes.

For guarded transitions, the user may continue editing
or discard changes and proceed.

The editor panel and Developer Console are coordinated
to avoid normal simultaneous display.

The panel width and scrolling belong to presentation
layout, not the content storage model.

## 7. Current Authorization

The currently implemented Base Template roles are:

```text
USER
EDITOR
ADMIN
```

`canEditLocalContent` allows local editing for effective
`EDITOR` or `ADMIN` roles and denies access otherwise.

The current Application access configuration includes:

```properties
access.settings.contentMenuEditor.roles=EDITOR,ADMIN
```

The feature selection includes:

```properties
feature.settings.contentMenuEditor.enabled=true
```

These are current frontend and configuration controls.
They are not a replacement for backend authorization.

Any future role or permission model must be documented
as a separate contract change, not silently described
as already implemented.

## 8. Development Preview Switch

The local sidebar preview is enabled only when:

```text
__DEV__ === true
```

and:

```text
EXPO_PUBLIC_CONTENT_MENU_PREVIEW=true
```

The switch is implemented in:

```text
src/template/editor/config/localContentPreviewConfig.ts
```

This switch is not an authorization mechanism.

## 9. Validation and Content Safety

Editor operations use validation and draft guards.

HTML content handling includes sanitization and
compatibility/security tests.

Preview data and restored local storage content must
not be assumed trustworthy solely because they are
stored locally.

Frontend permissions, local validation and HTML
sanitization do not eliminate the need for server-side
authorization and validation in a future backend
write/publishing integration.

## 10. Testing

The implementation was validated on 2026-10-26:

```text
Jest suites: 61 passed / 61 total
Jest tests:  392 passed / 392 total
TypeScript: 0 errors
```

Tests cover menu transformations, preview adapters,
draft storage, write queue behavior, authorization
integration, HTML safety and component rendering.

Browser checks additionally confirmed live page preview,
text block deletion, discarding changes and persistence
across reload for the local workflow.

These results describe the tested implementation
baseline and must be updated when the behavior changes.

## 11. Known Boundaries and Follow-up

The following are not established by this implementation:

- backend publication of edited content
- server-side permission enforcement for draft writes
- cross-tab or multi-user editing synchronization
- a finalized backend-driven role contract
- completed release or integration of external consumers

Before production use, backend contracts, authorization,
persistence and deployment behavior must be validated
separately.

The separate API definition submodule reference was not
included in feature commit `cc72f8a`.

## 12. Related Architecture Documents

- `doc/architecture/05-current-state.md`
- `doc/architecture/application-contract.md`
- `doc/architecture/application-navigation.md`
- `doc/architecture/authorization-architecture.md`
- `doc/components.md`

The editor extends the existing Template architecture.
It does not reverse the Application-to-Template-to-Core
dependency direction.
