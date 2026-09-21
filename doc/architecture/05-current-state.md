# Current Architecture

## Purpose

This document describes the current implemented architecture of `web.template` and the validated consumer model used by concrete Applications.

The architecture described here is active. It is not merely a future target or an incremental migration plan.

The implemented dependency direction is:

```text
Application --> Template --> Core
```

The architectural layers have clearly separated responsibilities:

- **Core** provides reusable technical capabilities.
- **Template** provides the reusable application platform, including standard Agent.Workbench functionality.
- **Application** is the concrete product and composition layer.

Agent.Workbench standard functionality is intentionally part of the Base Template.

The repository also contains an in-repository Agent.Workbench Application composition used to validate the Application integration contract.

In addition, `web.plantAssist` now validates the same contract as a separate concrete consumer repository.

HEMS remains a future concrete Application that can follow the same consumer model.

A separate Agent.Workbench Application repository is not required by the current architecture.

Planned topics such as BuildInfo, an App Information screen, release notes, and explicit Application-versus-Template version presentation are not yet part of the implemented architecture and are documented as planned work only.

---

# 1. Current Repository State

The `web.template` repository currently contains three architectural responsibility areas:

```text
src/
├── core/
├── template/
└── application/
```

Conceptually:

```text
Concrete Application
        |
        v
Base Template
        |
        v
Core
```

The current `src/application/` directory is the in-repository Agent.Workbench Application composition of `web.template`.

It demonstrates how a concrete Application can:

- provide Application identity and metadata
- provide Application branding
- provide Application theme overrides
- select reusable Template features
- provide Application-specific navigation
- optionally enable navigation icons
- provide Application-specific screens
- provide Application-owned assets
- provide Application translations
- optionally provide Application-specific Redux state

The current in-repository Application composition is configured with Agent.Workbench identity.

Agent.Workbench standard functionality itself is intentionally owned by Template.

The separate `web.plantAssist` repository now provides the first validated external consumer of this architecture.

HEMS remains a future consumer candidate.

---

# 2. Current Dependency Model

The implemented dependency direction is:

```text
Application
    |
    v
Template
    |
    v
Core
```

The dependency direction must not be reversed.

## Core

Core contains reusable technical capabilities.

Core must not depend on Template.

Core must not depend on Application.

```text
Core -X-> Template
Core -X-> Application
```

## Template

Template contains the reusable application platform.

Template may depend on Core.

Template must not depend on a concrete Application.

```text
Template ---> Core
Template -X-> Application
```

Template owns reusable platform functionality including:

- application bootstrap
- reusable React application shell
- Agent.Workbench standard functionality
- Agent.Workbench state
- reusable Agent.Workbench API integration where appropriate
- authentication and session orchestration
- server selection
- navigation infrastructure
- Template navigation definitions
- settings
- update orchestration
- design system
- notifications
- reusable screens
- Template screen registry
- Template feature definitions
- reusable Redux infrastructure
- localization infrastructure
- configuration and discovery generators used by Applications

## Application

Application is the concrete composition root.

Application may consume the supported integration surfaces provided by Template and Core.

Application owns:

- Application identity and metadata
- Application branding and assets
- Application theme overrides
- semantic Template feature selection
- Application-specific navigation
- Application navigation presentation options
- Application-specific screens
- Application-specific translations
- optional Application-specific Redux state
- concrete product composition
- product-specific behavior
- product version
- product build and release configuration

The Template must not need to know which concrete Application is consuming it.

---

# 3. Current Core Structure

The currently established top-level Core areas include:

```text
src/core/
├── authentication/
├── runtime/
├── server/
└── update/
```

Core contains reusable technical functionality.

Core is not the reusable React application platform.

React application-shell functionality remains in Template.

Core does not own:

- concrete product composition
- Application configuration
- Agent.Workbench composition
- Template navigation
- Template UI orchestration

Agent.Workbench standard functionality belongs to Template.

Concrete product functionality belongs to Application.

---

# 4. Core Authentication

Reusable technical authentication capabilities exist under:

```text
src/core/authentication/
```

Known files include:

```text
src/core/authentication/
├── types.ts
├── http/
│   └── attachAuthInterceptors.tsx
├── jwt/
│   └── jwtTime.ts
└── logout/
    └── logoutFlowGuard.ts
```

Core authentication is responsible for reusable technical authentication behavior.

Reusable session orchestration and authentication UI remain Template responsibilities.

The separation is therefore:

```text
Core
└── technical authentication capabilities

Template
└── reusable authentication/session orchestration and UI

Application
└── product-specific composition
```

---

# 5. Core Runtime

Reusable technical runtime functionality exists under:

```text
src/core/runtime/
```

Runtime ownership follows the general architecture rule:

```text
technical runtime capability
    --> Core

reusable application orchestration
    --> Template

product-specific runtime behavior
    --> Application
```

Core runtime functionality must remain independent from concrete Applications and from Template UI composition.

---

# 6. Core Server Infrastructure

Reusable technical server infrastructure exists under:

```text
src/core/server/
```

Core server responsibilities include reusable technical behavior such as:

- server normalization
- server validation
- technical server checks
- server-environment detection
- reusable backend information parsing
- technical server types

Higher-level server behavior remains outside Core.

The ownership boundary is:

```text
Core
├── technical server capabilities
└── reusable backend/server logic

Template
├── server-selection UI
├── server orchestration
└── reusable server-related state

Application
└── product-specific server configuration where required
```

---

# 7. Core Update Infrastructure

Reusable technical update capabilities exist under:

```text
src/core/update/
```

Core update functionality is limited to reusable technical helpers and infrastructure.

Higher-level reusable update behavior belongs to Template, including where applicable:

- update state
- update hooks
- update watchers
- update dialogs
- update notifications
- update orchestration

Concrete product-specific update behavior belongs to Application only when it is actually product-specific.

Application release metadata and product versioning remain consumer responsibilities.

---

# 8. Current Template Responsibilities

Template provides the reusable Base Template platform.

Its responsibilities include:

```text
Template application bootstrap
React application shell
Application integration contract
navigation infrastructure
Template navigation definitions
Template screen registry
feature definitions
authentication/session orchestration
server selection
settings
update orchestration
Redux infrastructure
Agent.Workbench standard screens
Agent.Workbench state
design system
notifications
reusable components
reusable hooks
common screens
localization infrastructure
Application configuration generation
Application screen discovery
Application asset discovery
Application theme materialization
```

Agent.Workbench is intentionally represented here.

It is not treated as transitional product code.

Standard Agent.Workbench functionality belongs to the Base Template because it is part of the reusable platform delivered by `web.template`.

---

# 9. Agent.Workbench Ownership

The current architecture explicitly defines Agent.Workbench standard functionality as Template-owned.

This includes reusable Agent.Workbench functionality such as:

```text
Program Start
Data Analyzing
Database configuration
Server configuration
Live Console
Settings
Update infrastructure
Agent.Workbench state
```

The exact internal organization can evolve, but the ownership boundary is established:

```text
Agent.Workbench standard functionality
    --> Template
```

Agent.Workbench functionality must therefore not be documented as:

```text
transitional Application code
future Agent.Workbench Application code
code waiting to be moved into an Agent.Workbench repository
```

A separate Agent.Workbench Application repository is not part of the current architecture.

---

# 10. Template Application Contract

The reusable Application integration layer exists under:

```text
src/template/application/
```

Known files include:

```text
ApplicationConfig.ts
ApplicationConfigContext.tsx
createTemplateApp.tsx
TemplateApp.tsx
```

These files implement the integration boundary between a concrete Application and the Base Template.

Conceptually:

```text
Concrete Application
        |
        v
Application configuration
        |
        v
createTemplateApp(...)
        |
        v
TemplateApp
```

The Application supplies concrete composition.

Template supplies the reusable application platform.

---

# 11. Application Configuration Model

Developer-facing Application configuration must not require developers to edit TypeScript, TSX or generated runtime files.

The current developer-facing configuration source is:

```text
src/application/config/
├── application.properties
├── features.properties
└── navigation.properties
```

The responsibilities are:

```text
application.properties
    Application identity and metadata
    Application branding
    Application theme overrides

features.properties
    semantic activation or deactivation
    of reusable Template features

navigation.properties
    Application-owned navigation extensions
    Application navigation presentation options
```

Application branding and theme customization are part of the supported Application configuration contract.

Examples include:

```properties
ApplicationId=plant-assist
ApplicationTitle=Plant Assist
ApplicationLogo=flexaqua

ThemeLightPrimary=#009FB2
ThemeLightBackground=#F4FBFC
ThemeLightCard=#FFFFFF
ThemeLightText=#12313D
ThemeLightBorder=#B8DADF
ThemeLightNotification=#D84C4C
ThemeLightHighlight=#10AFC1

ThemeDarkPrimary=#35C4D2
ThemeDarkBackground=#0E1C22
ThemeDarkCard=#132A31
ThemeDarkText=#E8F7F9
ThemeDarkBorder=#26434A
ThemeDarkNotification=#FF7A6B
ThemeDarkHighlight=#1C3D45
```

Concrete Applications may customize their visual identity without modifying Template theme source files.

Empty theme properties preserve the Base Template defaults.

The old configuration names are no longer part of the current architecture:

```text
menu.properties
tabs.properties
featureFlags.properties
```

Documentation must not present these old files as active configuration.

Generated TypeScript may exist as runtime or build output, but it is not the developer-facing configuration format.

---

# 12. Semantic Feature Configuration

Concrete Applications enable or disable reusable Template capabilities semantically.

Examples include:

```properties
feature.notifications.enabled=true
feature.appearance.enabled=true
feature.serverSettings.enabled=true
feature.liveConsole.enabled=true
feature.programStart.enabled=true
feature.dataAnalyzing.enabled=true
feature.database.general.enabled=true
```

Applications select capabilities.

Applications do not reproduce the internal navigation implementation of those capabilities.

Template remains responsible for:

- internal menu IDs
- internal parent IDs
- Template screen registry keys
- authentication visibility
- runtime visibility rules
- Agent.Workbench navigation definitions
- Template navigation structure

This keeps the Application configuration stable even when Template internals change.

---

# 13. Application-Owned Navigation

Application-specific navigation is configured through:

```text
src/application/config/navigation.properties
```

An Application navigation extension can conceptually look like:

```properties
NavigationMenuIconsEnabled=true

menu.example.enabled=true
menu.example.caption=exampleApplication
menu.example.parent=settings
menu.example.position=99
menu.example.screen=example-screen
menu.example.icon=appstore
```

Application navigation configuration describes the Application-owned extension semantically.

Internal numeric IDs are generated or managed internally.

Applications must not need to maintain Template internal menu IDs.

The `position` of a custom Application menu remains optional.

Menu icons are optional.

`NavigationMenuIconsEnabled` controls whether configured navigation icons are rendered for the concrete Application.

When the property is omitted or `false`, navigation keeps the classic text-oriented appearance.

This allows the in-repository Agent.Workbench composition to retain the previous presentation while a concrete consumer such as Plant Assist can enable icons explicitly.

Icon names are resolved through the Template design-system icon implementation.

---

# 14. Template Navigation Ownership

Reusable Template navigation definitions remain inside Template.

Applications do not duplicate standard Agent.Workbench menu definitions.

The relationship is:

```text
Template navigation
    +
Application navigation extensions
    |
    v
runtime navigation
```

Template owns reusable navigation structure.

Application only adds or selects product-specific composition.

Template menu definitions may provide reusable icons, but icon rendering remains controlled by the concrete Application configuration.

---

# 15. Template Menu Ordering

Template menu ordering is derived automatically from the order of sibling entries in the Template menu catalog.

Normal Template menu items therefore do not require manually maintained numeric positions.

Application custom menu positions remain optional.

The MenuHub fallback for items without an explicit position is:

```ts
Number.MAX_SAFE_INTEGER
```

The relevant sorting behavior is:

```ts
function sortByPosition(
  a: StaticMenuItem,
  b: StaticMenuItem,
) {
  return (
    (a.position ?? Number.MAX_SAFE_INTEGER) -
    (b.position ?? Number.MAX_SAFE_INTEGER)
  );
}
```

This keeps Drawer ordering and MenuHub ordering consistent.

The relevant screen is:

```text
src/template/screens/menu/MenuHubScreen.tsx
```

---

# 16. Automatic Application Screen and Asset Discovery

Application-owned screens are discovered automatically.

The discovery implementation exists at:

```text
src/template/config/build/applicationScreenDiscovery.mjs
```

Navigable Application screen files follow the `*Screen.tsx` convention.

The named export must match the file base name.

Screen file names are converted into runtime screen keys.

Examples:

```text
ExampleScreen.tsx
    --> example-screen

ExampleScreen2.tsx
    --> example-screen2

PlantAssistScreen.tsx
    --> plant-assist-screen
```

The generated registry is:

```text
src/application/generated/applicationScreenRegistry.generated.ts
```

Concrete Applications therefore do not need to manually import and register every Application screen.

Application asset discovery follows the same principle.

Application-owned assets are placed under:

```text
src/application/assets/
```

The current asset discovery supports the Application asset formats handled by the build discovery implementation, including common PNG, JPG/JPEG and WebP image assets.

Discovered assets are exposed through:

```text
src/application/generated/applicationAssets.generated.ts
```

Application branding can reference discovered assets through semantic keys, for example:

```properties
ApplicationLogo=flexaqua
```

Concrete Applications therefore do not need to manually wire supported branding assets into Template source code.

---

# 17. Current Application Structure

A concrete Application follows the current structure conceptually as:

```text
src/application/
├── index.ts
├── assets/
├── config/
│   ├── application.properties
│   ├── features.properties
│   └── navigation.properties
├── generated/
│   ├── applicationAssets.generated.ts
│   ├── applicationConfig.generated.ts
│   ├── applicationScreenRegistry.generated.ts
│   └── applicationTheme.generated.ts
├── i18n/
├── screens/
└── state/
    └── applicationReducers.ts
```

The Application layer may therefore own:

- branding assets
- Application identity
- Application metadata
- theme overrides
- navigation extensions
- navigation presentation options
- Application screens
- Application translations
- optional Application-specific state

Inside `web.template`, `src/application/` provides the Agent.Workbench composition used to validate this contract.

Inside `web.plantAssist`, the same contract is consumed by a separate concrete product repository.

Reusable Template functionality must not be moved into Application merely to make the directory structure appear more separated.

---

# 18. Generated Application Configuration

Developer-facing `.properties` files and Application-owned discovery sources are transformed into generated runtime artifacts.

Conceptually:

```text
Application .properties
Application screens
Application assets
        |
        v
configuration / discovery generation
        |
        +--> applicationConfig.generated.ts
        |
        +--> applicationScreenRegistry.generated.ts
        |
        +--> applicationAssets.generated.ts
        |
        +--> applicationTheme.generated.ts
        |
        v
Application composition
        |
        v
createTemplateApp(...)
```

The current generation lifecycle therefore covers more than navigation and feature configuration.

It also materializes:

- Application configuration
- Application screen discovery
- Application asset discovery
- branding integration
- Application theme overrides

The developer-facing source remains the supported `.properties` configuration and Application-owned files.

Generated TypeScript remains an implementation detail and must not become the primary configuration interface.

---

# 19. Application Composition Root

Application is the composition root.

The current runtime composition follows the principle:

```text
Application configuration
        |
        v
Application
        |
        v
createTemplateApp(...)
        |
        v
TemplateApp
```

Template does not select between concrete products.

Instead, each concrete Application composes itself with the Base Template.

This is an important dependency rule:

```text
Template does not select Application.
Application selects and configures Template.
```

---

# 20. No Runtime Multi-Application Resolver

The architecture does not require Template to contain a runtime resolver that chooses between Plant Assist, HEMS, Agent.Workbench or other products.

A concrete Application has its own composition and build.

The implemented consumer example is:

```text
Plant Assist Application Repository
        |
        v
Base Template
        |
        v
Core
```

Agent.Workbench is not shown as a separate Application repository because its standard functionality is part of the Base Template itself.

Future Applications such as HEMS can follow the same consumer model as Plant Assist.

---

# 21. Current Redux Ownership

Template owns the reusable Redux infrastructure.

Reusable Redux infrastructure exists under:

```text
src/template/state/
```

Store infrastructure is located under:

```text
src/template/state/store/
```

Agent.Workbench-specific reusable state is intentionally Template-owned.

The dedicated area is:

```text
src/template/state/agent-workbench/
```

This ownership is deliberate and is not transitional.

The architecture is:

```text
Template-owned reducers
        +
optional Application-owned reducers
        |
        v
runtime Redux store
```

Template must not import concrete Application reducers directly.

Application reducers are supplied through the Application integration layer.

---

# 22. Application-Specific Redux State

Concrete Applications may provide their own Redux reducers when required.

The Application extension point is:

```text
src/application/state/applicationReducers.ts
```

The in-repository Agent.Workbench Application composition does not currently require meaningful Application-specific Redux state.

Therefore this registry may remain essentially empty.

This is expected and valid.

It exists as an extension point for concrete Applications that genuinely require product-specific state.

The absence of Application reducers does not mean Redux separation is incomplete.

---

# 23. Agent.Workbench Redux State

Agent.Workbench state belongs to Template.

Documentation must not describe Agent.Workbench reducers as candidates for extraction into a concrete Application.

The current ownership rule is:

```text
reusable Agent.Workbench state
    --> Template

concrete product-only state
    --> Application
```

Moving Agent.Workbench state out of Template would contradict the currently selected architecture unless that architecture is explicitly changed in the future.

---

# 24. Redux Boundary Protection

Application-specific reducers must not silently replace Template-owned reducers.

The Template/Application state integration must preserve reducer ownership boundaries.

Conceptually:

```text
Template reducers
        +
Application reducers
        |
        v
validated reducer composition
```

Reducer keys owned by Template remain Template-owned.

Concrete Applications extend the store instead of overriding the Base Template state contract.

---

# 25. Current Design System

Reusable UI infrastructure belongs to Template.

The shared design system exists under:

```text
src/template/components/design-system/
```

Known groups include:

```text
icons/
stylistic/
themed/
ui-elements/
```

The design system is reusable application-platform UI and therefore belongs to Template rather than Core.

Core remains focused on reusable technical capabilities.

Application screens should reuse the Template design system where appropriate while remaining free to compose product-specific layouts.

---

# 26. Current Component Structure

Reusable Template components include areas such as:

```text
src/template/components/design-system/
src/template/components/developer-tools/
src/template/components/dynamic-content/
src/template/components/layout/
src/template/components/localization/
src/template/components/notifications/
src/template/components/rich-text-editor/
```

Reusable React components belong to Template unless they are specific to one concrete Application.

Concrete Application-only components should remain Application-owned.

The reusable `Screen` layout remains Template-owned and provides shared responsive screen margins and content-width behavior.

Concrete Applications may use it to build responsive screens without duplicating the platform layout shell.

---

# 27. Developer Console

The reusable Developer Console belongs to Template.

The current implementation includes a visible close action in:

```text
src/template/components/developer-tools/developer-console/DeveloperConsole.tsx
```

The close action uses the Unicode multiplication sign through an explicit Unicode escape:

```tsx
{"\u00D7"}
```

This avoids source-encoding corruption such as:

```text
Ã—
```

The close behavior itself remains driven by the existing Developer Console state logic.

---

# 28. Authentication Separation

Authentication follows the general dependency model.

```text
Core
├── technical authentication capabilities
├── JWT helpers
├── interceptor logic
└── logout guards

Template
├── authentication UI
├── session orchestration
└── reusable login behavior

Application
└── product composition
```

This separation is consistent with:

```text
Application --> Template --> Core
```

---

# 29. Server Separation

Server functionality is split by responsibility.

```text
Core
├── technical server capability
├── normalization
├── validation
├── backend parsing
└── environment detection

Template
├── server selection
├── server-related reusable state
├── orchestration
└── presentation

Application
└── product-specific server configuration where required
```

This allows technical server behavior to remain reusable without placing application UI into Core.

---

# 30. Update Separation

Update functionality is split by responsibility.

```text
Core
└── reusable technical update capabilities

Template
├── update state
├── hooks
├── watchers
├── notifications
├── dialogs
└── reusable orchestration

Application
└── product-specific update behavior and release metadata where necessary
```

Reusable update presentation and orchestration remain Template responsibilities.

The current architecture does not yet expose a dedicated combined Application/Template BuildInfo model in the UI.

Application-versus-Template version presentation and human-readable release notes are planned topics, not current functionality.

---

# 31. File Configuration Functionality

Reusable file-configuration functionality currently belongs to the Template platform where it is shared application behavior.

Relevant Template areas include:

```text
src/template/screens/settings/
src/template/hooks/
src/template/state/settings/
src/template/components/design-system/
```

Concrete product-specific file behavior should only move into Application when it is genuinely specific to that product.

The architecture must not move functionality solely to make directory ownership appear more separated.

Ownership is based on responsibility and reuse.

---

# 32. Configuration Generation Lifecycle

Application configuration generation is part of the normal development lifecycle.

The explicit generation command is:

```text
npm run config:generate
```

The generation lifecycle currently includes:

- parsing Application `.properties`
- semantic feature configuration
- Application navigation generation
- Application screen discovery
- Application asset discovery
- Application branding materialization
- Application theme override generation

Normal validation should ensure generated Application artifacts match the developer-facing configuration and Application-owned source files.

Generated files are implementation artifacts and should not replace the `.properties` files as the developer-facing configuration interface.

---

# 33. Build and Consumer Responsibility

`web.template` provides the reusable Base Template and the in-repository Agent.Workbench Application composition used to validate the integration model.

The architecture has now also been validated through a separate concrete consumer repository:

```text
web.plantAssist
```

Plant Assist owns its product-specific concerns, including:

- product metadata
- `.properties` configuration
- product branding and assets
- Application theme overrides
- Application screens
- Application translations
- Application navigation extensions
- navigation presentation configuration
- product version
- product build
- release workflow
- deployment configuration

Plant Assist has successfully been built and released independently while using the Base Template architecture.

This validates that the Application contract is not limited to the in-repository Agent.Workbench composition.

The Base Template remains reusable across concrete products.

This does not imply that Agent.Workbench must be extracted.

Agent.Workbench standard functionality remains Base Template functionality.

The current Plant Assist release workflow demonstrates that a consumer can own its own version and deployment lifecycle independently from the Template repository.

---

# 34. Current Plant Assist Consumer and Future Consumers

Plant Assist is the first separate concrete consumer repository currently used to validate the Base Template integration contract.

The implemented relationship is:

```text
Plant Assist
        |
        v
Base Template
        |
        v
Core
```

Plant Assist currently demonstrates:

```text
Plant Assist .properties configuration
Plant Assist branding and assets
Plant Assist theme overrides
Plant Assist-specific screens
Plant Assist translations
Plant Assist navigation extensions
optional navigation icons
responsive Application screen composition
independent Application versioning
independent build and release workflow
```

The current Plant Assist implementation is intentionally still a small MVP.

Its purpose is to validate Application composition and configuration rather than to represent final product functionality or final UI design.

HEMS remains a future concrete Application and may follow the same consumer model.

Conceptually:

```text
Plant Assist       HEMS        future Applications
   current         future
   consumer        consumer
        \             |             /
         \            |            /
          +------ Base Template ---+
                    |
                    v
                   Core
```

The Base Template continues to provide reusable platform and Agent.Workbench standard functionality.

---

# 35. Repository Model

The current architectural repository model is:

```text
web.template
|
+-- Core
|
+-- Base Template
|   |
|   +-- Agent.Workbench standard functionality
|   +-- reusable navigation
|   +-- reusable state infrastructure
|   +-- authentication/session
|   +-- server selection
|   +-- settings
|   +-- update
|   +-- design system
|   +-- notifications
|   +-- Template screen registry
|   +-- configuration/discovery generation
|
+-- Agent.Workbench Application composition
```

The first validated external consumer is:

```text
web.plantAssist
|
+-- Application configuration
+-- Application branding/assets
+-- Application theme overrides
+-- Application navigation
+-- Application translations
+-- Application screens
+-- Application version/build/release
|
+--> consumes Base Template architecture
```

The broader consumer model is:

```text
                  Base Template
                       ^
                       |
          +------------+------------+
          |            |            |
     Plant Assist     HEMS      future Applications
       current       future
       consumer      consumer
```

There is no required separate Agent.Workbench Application repository.

---

# 36. Current Logical Architecture

The current logical architecture is:

```text
+------------------------------------------------------------+
| Concrete Application / Application composition             |
|                                                            |
| application.properties                                     |
| features.properties                                        |
| navigation.properties                                      |
| Application assets                                         |
| Application branding                                       |
| Application theme overrides                                |
| Application navigation presentation                        |
| Application screens                                        |
| Application translations                                   |
| optional Application state                                 |
| generated Application configuration                        |
| generated Application screen registry                      |
| generated Application asset registry                       |
| generated Application theme overrides                      |
+-----------------------------+------------------------------+
                              |
                              v
+------------------------------------------------------------+
| Base Template                                              |
|                                                            |
| TemplateApp                                                |
| createTemplateApp                                          |
| ApplicationConfig contract                                 |
| React application shell                                    |
| navigation infrastructure                                  |
| Template menu catalog                                      |
| Template screen registry                                   |
| feature definitions                                        |
| authentication/session orchestration                       |
| server selection                                           |
| settings                                                   |
| notifications                                              |
| update orchestration                                       |
| Redux infrastructure                                       |
| Agent.Workbench standard functionality                     |
| Agent.Workbench state                                      |
| design system                                              |
| reusable components/screens/hooks                          |
| configuration/discovery generation                         |
+-----------------------------+------------------------------+
                              |
                              v
+------------------------------------------------------------+
| Core                                                       |
|                                                            |
| authentication                                             |
| runtime                                                    |
| server                                                     |
| update                                                     |
| reusable technical capabilities                            |
+------------------------------------------------------------+
```

This diagram represents the implemented architectural responsibility model.

---

# 37. Architecture Invariants

The following rules must remain true:

```text
Application --> Template --> Core
```

Core must not import Template.

Core must not import Application.

Template must not import a concrete Application.

Applications should consume supported public integration surfaces rather than reaching into Template internals.

Template owns standard Agent.Workbench functionality.

Applications own concrete product composition.

Developer-facing Application configuration uses `.properties`.

Applications must not reproduce Template internal navigation IDs or visibility rules.

Application screens are automatically discovered.

Supported Application assets are automatically discovered.

Application-specific Redux state remains optional.

Application branding must not require modifications to Template source files.

Application theme customization must be provided through supported Application configuration rather than by editing Template theme defaults.

Application navigation icons are optional and Application-controlled.

Application-owned assets must remain outside reusable Template ownership.

Concrete consumer repositories own their own Application version, build and release process.

Generated TypeScript remains implementation output rather than the developer-facing configuration format.

---

# 38. Dependency Validation

Useful architecture checks include:

```text
git grep -n "@/application/" -- src/template
```

Template must not import concrete Application implementation.

Internal Template imports from Application should therefore remain absent.

Application code should consume supported public integration APIs instead of Template internal paths where a supported surface exists.

A useful check is:

```text
git grep -n "@/template/" -- src/application
```

Unexpected direct Template-internal imports should be reviewed and replaced by supported public APIs where appropriate.

---

# 39. Current Validation Expectations

Before architecture documentation or implementation changes are committed, the current validation sequence should include where applicable:

```text
npm run config:generate
npx tsc --noEmit
npm test -- --runInBand
git diff --check
git status --short
```

Architecture dependency checks should also be performed where relevant.

For generated files, line-ending-only changes should be distinguished from real generated content changes before committing.

Changes should remain small and reviewable.

Large automated rewrites across unrelated files should be avoided.

---

# 40. Current Stability Status

The major Base Template/Application ownership decisions are established.

Known presentation and architecture improvements completed in the current state include:

```text
Drawer/MenuHub ordering consistency
Developer Console close-button encoding
Application screen discovery
Application asset discovery
Application branding
Application theme overrides
optional navigation icons
responsive navigation width improvements
responsive Application screen composition
separate Plant Assist consumer validation
independent Plant Assist build and release
```

The Base Template integration contract has now been validated both by the in-repository Application composition and by the separate `web.plantAssist` consumer repository.

The current Plant Assist implementation remains an MVP and is not intended to represent final product functionality or final UI design.

The next architectural topics are planned rather than implemented:

```text
Application BuildInfo
Template BuildInfo / version information
Application Information screen
Application-versus-Template version presentation
human-readable release notes / changelog metadata
optional commit-derived release-note generation
further automation of consumer Application creation
```

These planned topics should build on the existing ownership model rather than reopening the established Application/Template/Core separation.

---

# 41. Documentation Rules

Architecture documentation must describe the current selected architecture consistently.

The following statements are incorrect and must not be reintroduced:

```text
"Agent.Workbench is a concrete Application."
"Agent.Workbench is only temporarily located in Template."
"Agent.Workbench state must later be extracted from Template."
"Agent.Workbench screens are Application candidates."
"A separate Agent.Workbench Application repository is required."
"The repository is still migrating toward making Agent.Workbench an Application."
"menu.properties is the current menu configuration."
"tabs.properties is the current tab configuration."
"featureFlags.properties is the current feature configuration."
"Plant Assist is only a future consumer."
```

The correct model is:

```text
Agent.Workbench standard functionality
    --> Base Template

Plant Assist
    --> current concrete Application consumer

HEMS
    --> future concrete Application consumer
```

The current Application configuration files are:

```text
application.properties
features.properties
navigation.properties
```

Current generated Application artifacts include:

```text
applicationConfig.generated.ts
applicationScreenRegistry.generated.ts
applicationAssets.generated.ts
applicationTheme.generated.ts
```

Generated artifacts must not be documented as developer-facing configuration sources.

---

# 42. Current Architecture Summary

The current architecture is established as:

```text
Application --> Template --> Core
```

Core owns reusable technical capabilities.

Template owns the reusable application platform.

Agent.Workbench standard functionality is intentionally part of Template.

Application owns concrete product composition.

The in-repository Agent.Workbench Application composition validates the Application integration contract inside `web.template`.

`web.plantAssist` additionally validates the same contract as a separate consumer repository.

Developer-facing Application configuration is properties-based.

Template owns internal feature and navigation implementation details.

Applications select reusable Template capabilities semantically.

Application screens and supported Application assets are discovered automatically.

Applications may provide their own branding and theme overrides without modifying reusable Template theme definitions.

Navigation icons are optional and may be enabled by the concrete Application.

Template owns reusable Redux infrastructure and Agent.Workbench state.

Application-specific Redux state remains optional.

Concrete consumer repositories own their own product version, build, release and deployment configuration.

Plant Assist is the first current separate consumer and has successfully validated the consumer model through an MVP release.

HEMS remains a future consumer Application.

There is no planned separate Agent.Workbench Application repository under the current architecture.

BuildInfo, App Information, Application-versus-Template version presentation and release-note automation are planned next steps and are not yet part of the implemented architecture.

The next architectural work should build on these ownership boundaries rather than reopening the already decided Base Template versus Agent.Workbench separation.
