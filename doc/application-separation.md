# Separation of the Base Template and Applications

## 1. Status

**Status:** Draft  
**Project:** web.template

The fundamental architecture decision is:

- The Base Template will have its own repository.
- Agent.Workbench will have its own application repository.
- HEMS will have its own application repository.
- Future applications will use the same technical template foundation.
- The template must not directly import any concrete application.

---

## 2. Target Architecture

The allowed dependency direction is:

```text
Agent.Workbench ─┐
                 ├──→ Base Template ──→ Core
HEMS ────────────┘
```

In short:

```text
Application → Template → Core
```

The following dependency directions are not allowed:

```text
Template → Application
Core → Template
Core → Application
```

The Base Template must be independently maintainable and releasable
without depending on Agent.Workbench, HEMS, or any other concrete
application.

---

## 3. Repository Separation

### 3.1 Base Template Repository

The Base Template contains the reusable technical foundation:

```text
Base Template
├── TemplateApp
├── createTemplateApp
├── ApplicationConfig
├── ApplicationConfigContext
├── Navigation Engine
├── Redux Infrastructure
├── Authentication and Session Management
├── Server and Connectivity Features
├── Design System
├── General Screens
├── Notifications
├── Update Infrastructure
├── Header, Footer, and Layout
└── Core
```

### 3.2 Application Repository

Each concrete application has its own repository:

```text
Application
├── Own Configuration
├── Own Menus
├── Own Menu Feature Flags
├── Own Tabs
├── Own Tab Feature Flags
├── Own Screens
├── Own Redux State
├── Own Branding
├── Own API Integrations
├── Own Build
└── Own Helm and Deployment Configuration
```

Agent.Workbench and HEMS use the same repository structure but provide
their own application-specific content.

---

## 4. Planned Application Structure

```text
src/
└── application/
    ├── config/
    │   ├── application.config.ts
    │   ├── menu.config.ts
    │   ├── menuFeatureFlags.config.ts
    │   ├── tabs.config.ts
    │   └── tabFeatureFlags.config.ts
    │
    ├── screens/
    ├── state/
    ├── branding/
    └── index.ts
```

### `application.config.ts`

Contains the central application configuration:

- Technical application ID
- Visible application name
- Branding
- Enabled features
- Navigation configuration
- Application-specific extensions

### `menu.config.ts`

Defines the static menus of the application.

### `menuFeatureFlags.config.ts`

Defines the visibility and availability of application menus.

### `tabs.config.ts`

Defines the tabs and their assignment to menus.

### `tabFeatureFlags.config.ts`

Defines the visibility and availability of application tabs.

### `screens/`

Contains only domain-specific screens of the application.

### `state/`

Contains application-specific:

- Redux slices
- Thunks
- Selectors
- State types
- Constants

### `branding/`

Contains, for example:

- Logo
- Icons
- Colors
- Application-specific assets

---

## 5. Planned Template Structure

```text
src/
├── template/
│   ├── application/
│   │   ├── TemplateApp.tsx
│   │   ├── createTemplateApp.tsx
│   │   ├── ApplicationConfig.ts
│   │   └── ApplicationConfigContext.tsx
│   │
│   ├── authentication/
│   ├── components/
│   ├── navigation/
│   ├── screens/
│   ├── state/
│   ├── styles/
│   ├── update/
│   └── ...
│
└── core/
```

### `TemplateApp.tsx`

Contains the reusable technical application shell:

- Providers
- Redux store
- Navigation container
- Header and footer
- Session guard
- Global dialogs
- Notifications
- Update watchers
- General layout

### `createTemplateApp.tsx`

Connects a concrete application to the template:

```ts
const App = createTemplateApp(applicationConfig);
```

### `ApplicationConfig.ts`

Defines the contract between an application and the template.

The template defines the types.  
The application provides the concrete values.

### `ApplicationConfigContext.tsx`

Makes the active application configuration available throughout the
template.

Template components therefore do not need to directly import
application files or application-specific environment variables.

---

## 6. Responsibilities

### Base Template

The template defines the reusable mechanisms:

- How menus are displayed
- How menu trees are built
- How routing works
- How tabs are displayed
- How feature rules are evaluated
- How Redux is provided
- How authentication and session management work
- How general UI components behave and look

### Application

The application defines its concrete domain-specific content:

- Which menus exist
- Which tabs exist
- Which screens are displayed
- Which domain-specific feature flags apply
- Which application-specific Redux slices are required
- Which branding is used
- How the application is built and deployed

General rule:

```text
Mechanism and infrastructure → Template
Concrete domain definition   → Application
```

---

## 7. Starting an Application

An application repository should start the template approximately as
follows:

```ts
import {
  createTemplateApp,
} from "@enflex/web-template";

import {
  applicationConfig,
} from "./src/application";

const App = createTemplateApp(applicationConfig);

export default App;
```

The startup flow is:

```text
applicationConfig
        ↓
createTemplateApp(config)
        ↓
TemplateApp
        ↓
Navigation, Redux, UI, and Core
```

Because each application has its own repository, no central resolver is
required to switch between Agent.Workbench and HEMS.

---

## 8. Application ID and Display Name

### Application ID

Example:

```env
EXPO_PUBLIC_APPLICATION_ID=agent-workbench
```

The application ID is a stable technical identifier.

Possible uses:

- Build names
- Docker image names
- Helm release names
- Logging
- Storage prefixes
- Technical metadata

With separate application repositories, the ID is not used to select an
application folder inside the template.

### Application Title

Example:

```env
EXPO_PUBLIC_APPLICATION_TITLE=Agent.Workbench
```

The application title is the visible name shown to users.

Possible uses:

- Navigation
- Header
- Login
- Browser title
- Application information

Environment values are read inside the application repository and
converted into an `ApplicationConfig`.

The template only uses the final configuration object.

---

## 9. Redux Extension

The template provides the general Redux infrastructure:

- Store creation
- Template reducers
- Redux provider
- Typed Redux hooks
- General template slices

An application may register additional application-specific Redux
slices.

Examples for Agent.Workbench:

```text
execSettings
dataAnalysis
additional domain-specific state
```

Planned concept:

```ts
createTemplateStore({
  applicationReducers: {
    execSettings: execSettingsReducer,
    dataAnalysis: dataAnalysisReducer,
  },
});
```

Alternatively, the Redux extension may be part of application creation:

```ts
createTemplateApp({
  config: applicationConfig,
  applicationReducers,
});
```

The exact API will be designed separately.

Important rule:

> The template must not directly import Agent.Workbench or HEMS
> reducers.

The application passes its reducers through a public template extension
interface.

---

## 10. Navigation

The template owns the navigation engine:

- Menu tree construction
- Navigation rendering
- Routing
- Path calculation
- Tab rendering
- Feature flag evaluation
- Merging dynamic and static menus

The application provides:

- Menu items
- Tabs
- Screens
- Menu feature flags
- Tab feature flags

General rule:

```text
Navigation mechanism → Template
Concrete navigation  → Application
```

---

## 11. Current Transitional State

Some Agent.Workbench-specific functionality is still located inside the
template area.

Likely Agent.Workbench-specific areas include:

```text
src/template/screens/AgentWorkbenchOptions/
src/template/state/agent-workbench/
```

Related functionality includes:

- Program Start
- Data Analyzing
- Exec Settings
- Data Analysis State
- Menu ID 3023
- Tabs assigned to menu ID 3023
- The SERVER_MASTER visibility rule for Data Analyzing

These areas should later be moved together into the Agent.Workbench
repository.

Until the new repository is available, they remain in the current
project.

---

## 12. Open Ownership Decisions

The following areas still require clarification with the architecture
lead:

| Area | Possible Ownership | Status |
|---|---|---|
| Live Console | Template or Agent.Workbench | Open |
| Developer Console | Template or Agent.Workbench | Open |
| Database Connections | Template or Application | Open |
| Server Settings | Template or Application | Open |
| Dynamic Content | Template or Application | Open |
| Backend Update | Template or Application | Open |
| Settings File Upload | Template or Application | Open |
| Concrete API Clients | Template or Application | Open |
| General Settings | Template or Application | Review required |
| User Profile | Template or Application | Review required |

---

## 13. Public Template API

Application repositories should not import internal template paths.

Target usage:

```ts
import {
  createTemplateApp,
  type ApplicationConfig,
  type StaticMenuItem,
  type StaticTabItem,
} from "@enflex/web-template";
```

The public API should export only explicitly supported:

- Types
- Functions
- Components
- Extension interfaces

Internal template implementations remain private.

---

## 14. Migration Phases

### Phase 1 – Application Configuration

- Define `ApplicationConfig`
- Provide `createTemplateApp`
- Make the configuration available through a context
- Remove direct application environment access from the template

### Phase 2 – Configurable Navigation

- Make menus injectable
- Make menu feature flags injectable
- Make tabs injectable
- Make tab feature flags injectable
- Keep the navigation engine inside the template

### Phase 3 – Extensible Redux Store

- Convert the store into a factory
- Allow applications to register reducers
- Define state typing for template and application state
- Connect the Redux extension to `createTemplateApp`

### Phase 4 – Public Template API

- Define stable exports
- Avoid internal path imports
- Prepare the package interface
- Add automated dependency boundary checks

### Phase 5 – Agent.Workbench Extraction

- Move AgentWorkbenchOptions
- Move Agent.Workbench state
- Move Agent.Workbench menus and tabs
- Move Agent.Workbench feature flags
- Review API ownership
- Prepare the separate build
- Create the deployment configuration

### Phase 6 – Base Template Cleanup

- Remove remaining Agent.Workbench dependencies
- Test the Base Template independently
- Integrate HEMS
- Create a guide for building new applications

---

## 15. Success Criteria

The separation is considered successful when:

1. The template does not import any concrete application.
2. Core imports neither template nor application code.
3. Agent.Workbench and HEMS use the same public template API.
4. Every application can register its own screens.
5. Every application can register its own menus and tabs.
6. Every application can register its own Redux slices.
7. Every application has its own build.
8. Every application has its own deployment configuration.
9. Template updates can be provided centrally.
10. A new application can be created without modifying internal template
    files.