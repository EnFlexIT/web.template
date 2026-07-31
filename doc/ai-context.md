# AI Context for EnFlexIT/web.template

> **Purpose**
>
> This is the primary project context for AI assistants working on the
> `EnFlexIT/web.template` repository.
>
> It describes the architecture, migration rules, development workflow,
> important modules and current open decisions.

## Project overview

`web.template` is a reusable React Native / Expo Web / TypeScript foundation for
EnFlex.IT web applications.

It provides common infrastructure for:

- JWT and OpenID Connect authentication
- session handling and JWT renewal
- server selection and availability checks
- generated Agent.Workbench API clients
- update and release handling
- notifications
- navigation and feature flags
- theming and localization
- reusable UI components
- configuration and settings

The repository is being changed from a single large template into a layered
foundation for multiple products.

## Architecture

```text
application
    ↓
template
    ↓
core
```

### Core

`src/core` contains reusable technical capabilities and shared types.

Core may contain:

- authentication transport and session logic
- server validation
- update infrastructure
- networking
- storage abstractions
- shared technical types and utilities

Core must not import from `template` or `application`.

### Template

`src/template` contains reusable shell UI and reusable feature infrastructure.

Template may contain:

- design system
- header, footer and navigation
- reusable screens
- notifications
- localization and theme state
- server-selection UI state
- reusable hooks
- feature flags and registries

Template may import from Core, but never from Application.

### Application

`src/application` is the concrete product layer.

Application may contain:

- product-specific business logic
- product-specific screens and state
- concrete feature selection
- branding and application configuration
- final store and navigation composition

Application may use Template and Core.

## Current migration status

### Completed or established

- Design system moved to `src/template/components/design-system`.
- Public design-system alias added as `@design-system`.
- Reusable template hooks moved to `src/template/hooks`.
- Typed Redux hooks currently live in `src/core/hooks`.
- Navigation registries moved to `src/template/navigation`.
- Menu state moved to `src/template/state/navigation`.
- Language state moved to `src/template/state/localization`.
- Theme state moved to `src/template/state/theme`.
- Server and server-status state moved to `src/template/state/server`.
- Connectivity state moved to `src/template/state/connectivity`.
- Notification state moved to `src/template/state/notifications`.
- Password-change prompt state moved to
  `src/template/state/authentication`.
- `AuthMethod` moved to `src/core/authentication/types.ts`.
- `ServerEnvironment` moved to `src/core/server/types.ts`.
- Legacy duplicate connectivity state was removed.
- Reusable feature state was moved from `src/redux/slices` into focused
  `src/template/state` modules.
- Update watchers were moved to `src/application/bootstrap/watchers`.
- The duplicate frontend reload helper was removed; the canonical
  implementation lives in `src/core/update`.
- Jest uses the `test` folder and `test/jest.setup.ts`.

### Transitional

- `src/redux/store.ts` and `src/redux/rootReducer.ts` still compose all state.
- `apiSlice.tsx` still mixes API, authentication, server, persistence and
  template menu responsibilities.
- `sessionTimeSlice.tsx` still mixes state, HTTP requests and active server
  selection.
- Some screens and components remain in legacy top-level folders.
- Only `apiSlice.tsx` and `sessionTimeSlice.tsx` remain under `src/redux/slices` as explicit transition modules.
- Public APIs and aliases for the three layers are not finished.

## Important current paths

### Core

```text
src/core/authentication
src/core/server
src/core/update
src/core/hooks
```

### Template

```text
src/template/components/design-system
src/template/components/layout
src/template/components/notifications
src/template/hooks
src/template/navigation
src/template/screens
src/template/state
```

### Redux composition

```text
src/redux/store.ts
src/redux/rootReducer.ts
src/redux/selectors
src/redux/slices
```

### Tests

```text
test
test/jest.setup.ts
```

## Design system

Reusable UI lives under:

```text
src/template/components/design-system
```

Preferred public import:

```ts
import {
  ActionButton,
  Card,
  ConfirmDialog,
  ThemedText,
} from "@design-system";
```

Before creating a new component, search the design system for an existing
solution.

## Navigation

Navigation configuration:

```text
src/template/navigation/menu
src/template/navigation/tabs
```

Redux menu state:

```text
src/template/state/navigation/menuSlice.tsx
```

Important distinction:

- `staticMenu` and `staticTabs` are registries
- feature-flag files contain configuration rules
- `menuSlice` contains state
- `withAutoTabs` is a navigation helper

## Authentication

Canonical shared type:

```text
src/core/authentication/types.ts
```

Reusable implementation:

```text
src/core/authentication/http
src/core/authentication/jwt
src/core/authentication/logout
src/core/authentication/session
```

Reusable authentication behavior belongs in Core. Login screens and dialogs
belong in Template.

Known exception: Core session modules still consume the transitional
`sessionTimeSlice`, which depends on the concrete Redux store and `apiSlice`.
Do not hide this dependency; separate it deliberately in a future refactor.

## Server management

Reusable logic and types:

```text
src/core/server
```

Reusable shell state:

```text
src/template/state/server
src/template/state/connectivity
```

Connectivity checks answer only whether the backend is reachable. They must
never perform logout.

## Redux

Redux is not a layer. Place state according to responsibility:

- technical reusable state → Core
- reusable shell/UI state → Template
- product business state → Application
- reducer composition → Application composition

Do not move `apiSlice` or `sessionTimeSlice` only to make the folder tree look
clean. First separate their responsibilities.

## API

```text
src/api
├── config
├── definition
├── implementation
└── services
```

Generated API clients live under `src/api/implementation`.

Do not manually refactor generated code.

## Localization

Translations live under:

```text
assets/locales
```

Supported languages currently include German and English.

Prefer feature namespaces and existing translation keys. Do not hard-code UI
text when the surrounding feature uses i18next.

## Working method

The project uses small, verifiable refactoring batches.

For each move:

1. Search all references:
   ```bash
   git grep -n "<name-or-path>" -- .
   ```
2. Inspect internal imports.
3. Stabilize cross-folder imports with aliases where appropriate.
4. Move one coherent file group.
5. Apply exact global search-and-replace.
6. Search for all old path variants.
7. Run:
   ```bash
   npx tsc --noEmit
   ```
8. Run targeted Jest tests:
   ```bash
   npx jest --runTestsByPath <test-file>
   ```
9. Start Expo:
   ```bash
   npx expo start --clear
   ```
10. Commit the completed batch.

Do not wait for Metro to reveal stale imports one at a time.

## Coding rules

AI assistants should:

- inspect the existing implementation before changing it
- reuse existing components, hooks, selectors and services
- respect the dependency direction
- prefer focused changes over large rewrites
- preserve behavior during architecture moves
- use exact, repository-wide import searches
- update tests and documentation with code moves
- identify transitional architecture honestly

Avoid:

- creating duplicate utilities
- adding a second URL normalization implementation
- moving a mixed module without separating responsibilities
- introducing upward imports
- changing generated API code manually
- redesigning authentication, navigation or updates without explicit scope
- putting product-specific logic into Core or Template

## Documentation strategy

`README.md` should remain a concise project entry point.

Detailed documentation belongs in `doc/`, including:

- project structure
- Redux/state architecture
- authentication
- server switching
- update system
- components/design system
- releases
- architecture decisions
- AI context

Documentation must distinguish:

- current implementation
- target architecture
- transitional exceptions
- open TODOs

## Commit convention

Examples:

```text
feat(login): add OpenID redirect
fix(update): prevent duplicate update check
docs: update layered architecture
refactor(state): move notification state into template
```

## Current roadmap

### Immediate

1. Keep architecture documentation synchronized with code moves.
2. Separate the responsibilities currently combined inside `apiSlice.tsx`.
3. Extract session HTTP communication from `sessionTimeSlice.tsx`.
4. Move store and root-reducer composition into the Application layer.
5. Define public APIs, aliases and automated dependency-boundary checks.

### Next architecture phase

1. Define public APIs for Core, Template and Application.
2. Add aliases after physical structure is stable.
3. Move store/root-reducer composition to Application.
4. Add automated dependency-boundary checks.
5. Consolidate Core utilities such as server URL normalization.

### Future platform capabilities

- application configuration
- feature management
- dynamic branding
- dynamic navigation and content
- application registry
- version history
- automatic release notes

## Prompt for a new AI conversation

```text
I am working on the EnFlexIT/web.template repository.

Use doc/ai-context.md as the primary project context.

Respect this dependency direction:

application -> template -> core

Before changing code:
- search all references
- inspect existing reusable modules
- explain the architectural impact
- make a small coherent change
- update imports globally
- run TypeScript, targeted tests and Expo
- update documentation when paths or responsibilities change

Current task:

[INSERT CURRENT TASK HERE]
```
