# Core Platform

## Purpose

Core is the lowest reusable technical layer of the `web.template` architecture.

The authoritative dependency direction is:

```text

Application --> Template --> Core

```

Core provides reusable technical capabilities that remain independent from concrete Applications and, where reasonably possible, from React, Redux, navigation and presentation concerns.

Core is not the complete Base Template.

The reusable application platform belongs to Template.

Standard Agent.Workbench functionality also belongs to Template.

---

# 1. Architectural Position

The architecture contains three responsibility layers:

```text

Application

    |

    v

Template

    |

    v

Core

```

Their responsibilities are:

```text

Application

|

+-- concrete product composition

Template

|

+-- reusable React application platform

+-- reusable orchestration

+-- reusable UI

+-- reusable navigation

+-- reusable Redux infrastructure

+-- standard Agent.Workbench functionality

Core

|

+-- reusable technical capabilities

+-- technical types

+-- framework-independent helpers where practical

```

Allowed dependencies point toward lower reusable layers.

Core must not depend on Template or Application.

---

# 2. Core Responsibility

Core owns technical functionality that can be reused without knowing which concrete product is running.

Typical characteristics of Core code include:

* Application-independent

* presentation-independent where practical

* independent from concrete product configuration

* reusable across multiple Applications

* focused on technical behavior

* suitable for use by Template infrastructure

* independent from Template implementation

Core must not become a generic shared-code directory.

Reusability alone does not justify Core ownership.

The central ownership question remains:

```text

Who owns this responsibility?

```

---

# 3. Current Core Areas

Current reusable Core functionality includes technical areas such as:

```text

src/core/authentication/

src/core/runtime/

src/core/server/

src/core/update/

```

These areas represent technical capabilities rather than product UI or application-shell orchestration.

Core may evolve when additional coherent technical capabilities are identified.

This does not imply that every reusable feature should move into Core.

---

# 4. Authentication

Technical authentication capabilities may belong to Core.

Current examples include functionality under:

```text

src/core/authentication/

```

Known responsibilities include:

* HTTP authentication integration

* authentication-related technical types

* logout-flow protection

* reusable authentication helpers

* technical token/session helpers where framework-independent

Examples of current files include:

```text

src/core/authentication/http/attachAuthInterceptors.tsx

src/core/authentication/logout/logoutFlowGuard.ts

src/core/authentication/types.ts

```

Core authentication must remain independent from concrete Application UI.

---

# 5. Authentication Boundary

Authentication is intentionally split between Core and Template.

Conceptually:

```text

Core

|

+-- technical authentication capability

+-- request integration

+-- technical auth types

+-- framework-independent guards where practical

Template

|

+-- login UI

+-- session orchestration

+-- JWT renewal orchestration

+-- OIDC session handling

+-- Redux authentication state

+-- logout orchestration

Application

|

+-- concrete product-specific authentication behavior where required

```

Therefore:

```text

Authentication != entirely Core

```

Only the technical capability belongs in Core.

---

# 6. Server Infrastructure

Reusable technical server functionality belongs to Core.

Current implementation exists under:

```text

src/core/server/

```

Known responsibilities include:

* server input normalization

* server validation

* technical connectivity checks

* backend environment detection

* parsing reusable server information

* reusable server-related types

Current files include:

```text

src/core/server/detectServerEnvironment.ts

src/core/server/normalizeServerInputs.ts

src/core/server/serverCheck.ts

src/core/server/serverValidation.ts

src/core/server/types.ts

```

---

# 7. Server Boundary

Server functionality is split by responsibility.

Conceptually:

```text

Core

|

+-- normalize server address

+-- validate server input

+-- perform technical checks

+-- parse reusable backend information

Template

|

+-- server-selection state

+-- connectivity state

+-- server-selection UI

+-- reconnect orchestration

+-- presentation

Application

|

+-- concrete product-specific server configuration where required

```

The fact that server functionality is reusable does not mean all server-related state and UI belong in Core.

---

# 8. Runtime Infrastructure

Reusable runtime helpers belong to Core when they represent technical capabilities independent from Template presentation.

Current runtime functionality may live under:

```text

src/core/runtime/

```

Runtime helpers should remain independent from:

```text

React presentation

Template Redux state

navigation UI

concrete Application modules

```

If runtime behavior requires application-shell orchestration, that orchestration belongs to Template.

---

# 9. Update Infrastructure

Core may contain technical update helpers.

Current reusable update functionality includes:

```text

src/core/update/

```

A known helper is:

```text

src/core/update/reloadUpdatedFrontendWebApp.ts

```

Its responsibility is technical reload behavior.

Update orchestration itself belongs to Template.

---

# 10. Update Boundary

The update system is intentionally split.

```text

Core

|

+-- technical update helpers

Template

|

+-- update Redux state

+-- update hooks

+-- update watchers

+-- update dialogs

+-- update notifications

+-- backend/frontend update orchestration

Application

|

+-- concrete product-specific update behavior where genuinely required

```

The following are not Core responsibilities merely because they are reusable:

```text

Redux update slice

UpdateNotificationWatcher

PostLoginUpdateWatcher

Update UI

Update dialogs

```

They belong to Template.

---

# 11. Networking and API Concerns

Technical HTTP helpers may belong to Core when they are independent from Template state and concrete product behavior.

However, not every API implementation belongs to Core.

Examples:

```text

generic request helper

    -> Core where appropriate

authentication interceptor

    -> Core

reusable Template / Agent.Workbench API integration

    -> Template where appropriate

Redux API state

    -> Template

concrete product-specific endpoint handling

    -> Application

```

API ownership follows responsibility, not endpoint naming.

Agent.Workbench terminology alone does not make API code Application-owned.

---

# 12. Types

Technical types that are independent from product and Template presentation may belong to Core.

Examples include types used by:

* server validation

* authentication helpers

* technical networking

* runtime helpers

* framework-independent utilities

Types must not be moved to Core solely because multiple files import them.

Semantic ownership remains decisive.

---

# 13. Utilities

Reusable technical utility functions may belong to Core when they:

* do not require React UI

* do not depend on Template Redux state

* do not import Template

* do not depend on concrete Application functionality

* represent a stable technical capability

A generic helper is not automatically Core.

Feature-owned helpers should remain with their owning feature.

---

# 14. What Does Not Belong in Core

The following responsibilities generally do not belong in Core:

```text
React application bootstrap
TemplateApp
createTemplateApp
React providers
Redux store composition
Redux slices
navigation infrastructure
navigation rendering
menu UI
screen registry
dialogs
buttons
cards
layout components
notification UI
theme presentation
localization UI
screens
Agent.Workbench standard UI
Application branding
Application assets
Application theme overrides
Application-specific navigation
product business logic
product version/release presentation
```

These belong to Template or Application depending on responsibility.

Core remains focused on reusable technical capabilities rather than product composition or application-platform presentation.

---

# 15. Bootstrap

Application bootstrap belongs to Template and Application composition, not Core.

The current Application entry point conceptually performs:

```text

Application configuration

        |

        v

createTemplateApp(...)

        |

        v

TemplateApp

        |

        v

registerRootComponent(...)

```

The reusable bootstrap contract belongs under:

```text

src/template/application/

```

Core must not know which React Application is being registered.

---

# 16. Redux

Redux is not a Core module.

Redux is an implementation technology used primarily by Template and optionally by Application.

The ownership model is:

```text

Template

|

+-- reusable Redux infrastructure

+-- Template reducers

+-- Agent.Workbench standard state

+-- store composition

Application

|

+-- optional concrete product-specific reducers

+-- concrete product-specific state

```

Core must not depend on the application Redux store.

Technical Core functions should receive required values explicitly rather than reading global Redux state.

---

# 17. Template Redux Infrastructure

Reusable Redux infrastructure belongs to Template.

Known store infrastructure includes:

```text

src/template/state/store/

├── createTemplateStore.ts

├── rootReducer.ts

├── store.ts

├── templateReducers.ts

├── types.ts

├── useAppDispatch.ts

└── useAppSelector.ts

```

Agent.Workbench state is intentionally Template-owned.

Known area:

```text

src/template/state/agent-workbench/

```

This state is not transitional Application state.

---

# 18. Application Redux Extension

Concrete Applications may optionally provide Application-specific reducers.

The current extension point is:

```text

src/application/state/applicationReducers.ts

```

Application reducers must not override Template-owned reducer keys.

The current Agent.Workbench Application composition does not require meaningful Application-specific Redux state.

This is valid.

---

# 19. Navigation

Navigation infrastructure belongs to Template.

Template owns:

```text
routing
menu rendering
menu tree construction
Template navigation definitions
Template screen registry
visibility integration
authentication/runtime integration
standard Agent.Workbench navigation
Template menu ordering
optional navigation icon rendering
```

Application owns:

```text
Application-specific navigation extensions
Application-specific screen references
optional custom ordering
optional navigation icon selection
whether optional navigation icons are enabled
```

Conceptually:

```text
Template navigation
        +
Application navigation extensions
        |
        v
runtime navigation
```

Core does not own React navigation.

Application-controlled presentation options do not transfer navigation infrastructure ownership away from Template.

---

# 20. Application Navigation Configuration

Developer-facing Application navigation uses:

```text
src/application/config/navigation.properties
```

Example:

```properties
NavigationMenuIconsEnabled=true

menu.plantAssist.enabled=true
menu.plantAssist.caption=plantAssist
menu.plantAssist.parent=settings
menu.plantAssist.position=99
menu.plantAssist.screen=plant-assist-screen
menu.plantAssist.icon=appstore
```

Applications must not define the complete Template navigation tree.

Applications should not depend on Template-internal numeric menu IDs.

Navigation icons are optional.

When `NavigationMenuIconsEnabled` is omitted or `false`, the classic text-oriented navigation remains supported.

This behavior belongs to the Application/Template integration contract and does not create a Core responsibility.

---

# 21. Semantic Feature Selection

Developer-facing feature selection uses:

```text

src/application/config/features.properties

```

Examples:

```properties

feature.notifications.enabled=true

feature.appearance.enabled=true

feature.serverSettings.enabled=true

feature.liveConsole.enabled=true

feature.programStart.enabled=true

feature.dataAnalyzing.enabled=true

feature.database.general.enabled=true

```

Application selects reusable Template functionality semantically.

Template owns implementation and internal navigation behavior.

---

# 22. Automatic Application Screen and Asset Discovery

Application-specific screens belong to Application.

They are discovered automatically through:

```text
src/template/config/build/applicationScreenDiscovery.mjs
```

Examples:

```text
ExampleScreen.tsx
    -> example-screen

ExampleScreen2.tsx
    -> example-screen2

PlantAssistScreen.tsx
    -> plant-assist-screen
```

Generated screen registry:

```text
src/application/generated/applicationScreenRegistry.generated.ts
```

Application assets are also discovered automatically through:

```text
src/template/config/build/applicationAssetDiscovery.mjs
```

Application-owned assets are placed under:

```text
src/application/assets/
```

Generated asset registry:

```text
src/application/generated/applicationAssets.generated.ts
```

Application branding may reference a discovered asset semantically:

```properties
ApplicationLogo=flexaqua
```

Template must not manually import concrete Application screens or branding assets.

Screen and asset discovery are Template-side integration mechanisms.

They are not Core responsibilities.

---

# 23. Notifications

Notification presentation and reusable notification state belong to Template.

Core technical functionality may return errors or technical results, but it should not directly create UI notifications.

Conceptually:

```text

Core technical result

        |

        v

Template orchestration

        |

        v

Template notification state/UI

```

This keeps technical functionality independent from presentation.

---

# 24. User Profile

Reusable user-profile UI and Redux state belong to Template when they are part of the shared application platform.

Technical identity/authentication information may originate from Core capabilities.

Concrete product-specific profile functionality belongs to Application.

User Profile is therefore not a single Core module.

---

# 25. Dynamic Content

Dynamic-content React infrastructure currently belongs to Template.

Current implementation lives under:

```text

src/template/components/dynamic-content/

```

It contains reusable rendering and editing UI.

React dynamic-content components must not be moved to Core simply because they are reusable.

A future ownership change should only occur if actual product-specific responsibility is identified.

---

# 26. Shared Components

Reusable UI components belong to Template.

The shared design system lives under:

```text

src/template/components/design-system/

```

Examples include:

```text

buttons

cards

dialogs

inputs

tables

charts

theme-aware components

typography

icons

```

Core must not import these components.

---

# 27. Localization

Localization has technical and presentation aspects.

Reusable application localization belongs primarily to Template.

Examples include:

```text

i18next initialization

translation resources

language-selection UI

```

The language switcher is Template UI.

Core should only contain localization-related technical helpers if they are independent from the Template runtime.

---

# 28. Theme

Visual theme and reusable themed components belong to Template.

Current design-system areas include:

```text
src/template/components/design-system/themed/
src/template/components/design-system/stylistic/
```

Theme presentation is part of the reusable application platform.

Concrete Application theme override values belong to Application.

Supported overrides are configured through `application.properties` and generated into:

```text
src/application/generated/applicationTheme.generated.ts
```

A concrete Application may override supported values without modifying Template theme source files.

When an override is omitted, the Base Template default remains active.

Core must remain independent from visual theme implementation and from concrete Application theme values.

---

# 29. Application Configuration

Developer-facing Application configuration uses:

```text
src/application/config/
├── application.properties
├── features.properties
└── navigation.properties
```

Responsibilities:

```text
application.properties
    Application identity and metadata
    Application branding
    Application theme overrides

features.properties
    semantic Template feature selection

navigation.properties
    Application-specific navigation extensions
    Application navigation presentation options
```

Template defines the configuration contract and generation mechanism.

Conceptually:

```text
Application properties
Application screens
Application assets
        |
        v
Template configuration/discovery tooling
        |
        v
generated runtime artifacts
        |
        v
Template runtime
```

Generated artifacts may include:

```text
applicationConfig.generated.ts
applicationScreenRegistry.generated.ts
applicationAssets.generated.ts
applicationTheme.generated.ts
```

Core must not depend on concrete Application configuration or generated Application artifacts.

---

# 30. Legacy Configuration Names

The following are not part of the current architecture:

```text

menu.properties

tabs.properties

featureFlags.properties

menuFeatureFlags.properties

tabFeatureFlags.properties

```

They must not be reintroduced as active or planned Application configuration.

---

# 31. ApplicationConfig Is Not Core Product Data

`ApplicationConfig` enables dependency inversion.

Template receives generated Application configuration instead of importing concrete product implementation.

Conceptually:

```text

Application

    |

    v

ApplicationConfig

    |

    v

Template

```

Technical Core functionality may receive individual technical values when necessary.

Core must not become aware of the entire concrete Application configuration.

---

# 32. Dependency Rules

The fundamental dependency rule is:

```text

Application --> Template --> Core

```

Allowed:

```text

Application imports supported Template surfaces

Application imports Core where appropriate

Template imports Core

Core imports Core

```

Forbidden:

```text

Core imports Template

Core imports Application

Template imports concrete Application implementation

```

The dependency direction must remain acyclic.

---

# 33. Dependency Example

Correct:

```text

Application screen

        |

        v

Template component

        |

        v

Core server validator

```

Incorrect:

```text

Core server validator

        |

        v

Template notification component

```

A Core function returns a technical result.

Template decides how that result is orchestrated or presented.

---

# 34. Framework Independence

Core should remain framework-independent where practical.

This does not require artificially removing every framework-related type immediately.

The important direction is:

```text

technical capability

        |

        v

minimal framework coupling

```

New Core code should avoid unnecessary dependencies on:

```text

React UI

Redux store

React Navigation

concrete Application modules

Template components

```

---

# 35. Core Public API

Long term, Core should expose stable technical contracts instead of requiring consumers to depend on arbitrary internal files.

Conceptually:

```text

Core public API

|

+-- authentication

+-- runtime

+-- server

+-- update helpers

+-- technical types

+-- utilities

```

The exact export structure may evolve.

Do not create an oversized public API without a concrete requirement.

---

# 36. Core and Base Template

Core is one part of the Base Template.

The relationship is:

```text
Base Template
|
+-- Template
|    |
|    +-- React application platform
|    +-- design system
|    +-- theme infrastructure
|    +-- navigation
|    +-- configuration/discovery tooling
|    +-- Redux
|    +-- standard Agent.Workbench functionality
|    +-- reusable UI/features
|    +-- orchestration
|
+-- Core
     |
     +-- technical capabilities
```

The Base Template provides both layers.

Concrete Applications consume the Base Template.

Plant Assist currently validates this consumer model from a separate repository.

HEMS and future Applications may follow the same model.

---

# 37. Agent.Workbench Ownership

Standard Agent.Workbench functionality belongs to Template.

Examples include:

```text

Program Start

Data Analyzing

Database configuration

Server configuration

Live Console

Settings

Agent.Workbench navigation

Agent.Workbench state

reusable Agent.Workbench API integration

```

These areas must not be classified as concrete Application code solely because they contain Agent.Workbench-specific terminology.

The ownership decision is:

```text

Agent.Workbench standard functionality

    -> Template

```

Agent.Workbench is the current in-repository Application identity/composition, but it is not modeled as a separate consumer Application repository.

---

# 38. Concrete Product Applications

Concrete Applications contain product-specific composition.

Plant Assist is the first separate concrete consumer currently used to validate the model.

Examples of Plant Assist-owned concerns include:

```text
Plant Assist configuration
Plant Assist-specific screens
Plant Assist translations
Plant Assist assets and branding
Plant Assist theme overrides
Plant Assist navigation extensions
Plant Assist version/build/release
Plant Assist deployment configuration
```

Conceptually:

```text
Plant Assist Application
        |
        v
Template
        |
        v
Core
```

HEMS remains a future concrete Application.

Examples of HEMS-owned concerns may include:

```text
HEMS domain functionality
HEMS-specific screens
HEMS-specific state
HEMS-specific APIs
HEMS branding
HEMS build/deployment
```

Conceptually:

```text
HEMS Application
        |
        v
Template
        |
        v
Core
```

Core must remain unaware of which concrete product is consuming the platform.

---

# 39. Stability

Core should be stable, but it is not expected to stop evolving.

Reusable technical capabilities may change when:

* technical requirements change

* security requirements change

* backend contracts evolve

* bugs are fixed

* better reusable abstractions are identified

The goal is controlled evolution, not immobility.

---

# 40. Core Design Rules

Core changes must follow these rules:

1\. Core must not depend on Template.

2\. Core must not depend on Application.

3\. Core must not contain concrete product business logic.

4\. Core should avoid React presentation concerns.

5\. Core must not own the application Redux store.

6\. Core should expose technical behavior rather than UI behavior.

7\. Core should remain reusable across Applications.

8\. Core functionality must have clear technical ownership.

9\. Reusability alone does not justify moving code into Core.

10\. Standard Agent.Workbench application-platform behavior belongs to Template.

11\. Concrete product behavior belongs to Application.

12\. Reusable application-platform behavior belongs to Template.

13\. Dependency cycles across architecture layers are forbidden.

---

# 41. Moving Functionality into Core

Movement into Core should be responsibility-driven and incremental.

Before moving code into Core:

```text

1\. Identify the responsibility.

2\. Verify that the code is product-independent.

3\. Verify that it does not require Template UI/state ownership.

4\. Remove unnecessary upward dependencies.

5\. Define a coherent technical contract.

6\. Move only the technical capability.

7\. Update imports explicitly.

8\. Run TypeScript validation.

9\. Run affected tests.

10\. Validate runtime behavior.

```

Do not move entire feature folders into Core solely because part of a feature is reusable.

This is technical extraction into Core, not Application extraction.

---

# 42. Current Status

## Implemented

Current Core architecture includes reusable technical areas such as:

```text
authentication
runtime
server
update
```

The dependency direction is established as:

```text
Application --> Template --> Core
```

Template owns standard Agent.Workbench application-platform functionality.

Application owns concrete product composition.

The separate Plant Assist consumer has already validated that a concrete Application can consume the Base Template without making Core aware of that product.

---

## Ongoing Technical Review

Some technical boundaries may continue to be refined.

Examples include:

```text
generic API helper ownership
authentication helper boundaries
server helper boundaries
runtime helper ownership
public Core API surfaces
```

These reviews do not imply that Agent.Workbench functionality is waiting to move into Application.

They also do not imply that consumer-specific branding, theme overrides, navigation presentation or release concerns should move into Core.

---

## Future Work

Future Core work may include:

* continue reviewing Core/Template technical boundaries
* keep Core free from Template and Application imports
* keep Redux orchestration outside Core
* expose stable technical contracts where useful
* move additional technical capabilities into Core only when ownership is clear
* validate architectural dependencies automatically where practical

Separate consumer validation is no longer hypothetical because Plant Assist already provides that proof.

HEMS can follow the same consumer architecture in the future.

A separate Agent.Workbench Application extraction is not part of the current architecture.

---

# 43. Non-Goals

Core is not intended to become:

```text

the entire Base Template

a React component library

a Redux framework

a navigation framework

an Agent.Workbench Application

a repository for every reusable helper

a place for concrete Application configuration

```

Core also must not become the owner of standard Agent.Workbench application-platform behavior.

These distinctions are essential for maintainability.

---

# 44. Incorrect Legacy Statements

The following statements are no longer correct:

```text
"Concrete menu and tab definitions belong entirely to Application."

"Agent.Workbench data analysis is concrete Application code."

"Agent.Workbench standard settings must move into Application."

"Agent.Workbench functionality inside Template is transitional."

"Application extraction is still pending."

"A separate Agent.Workbench Application repository is required."

"menu.properties is planned Application navigation configuration."

"tabs.properties is planned Application configuration."

"featureFlags.properties is planned feature configuration."

"HEMS is the first separate consumer validation."

"Application branding belongs in Core."

"Application theme overrides belong in Core."
```

The correct ownership is:

```text
Agent.Workbench standard functionality
    -> Template

Plant Assist
    -> current separate concrete Application consumer

HEMS and future concrete products
    -> future Applications
```

Core remains independent from all concrete consumers.

---

# 45. Long-Term Objective

The long-term objective is a focused technical Core supporting a reusable Template without knowing which concrete product consumes the platform.

The architecture remains:

```text
Application
    |
    v
Template
    |
    v
Core
```

Core provides reusable technical capabilities.

Template provides reusable application-platform behavior, integration tooling and standard Agent.Workbench functionality.

Application provides concrete product composition, including product branding, theme overrides, screens, translations, navigation extensions and product-specific build/release/deployment concerns.

Plant Assist already demonstrates the separate consumer model.

HEMS and future Applications can consume the same Base Template without requiring a separate Agent.Workbench Application layer.

Core should continue evolving only through responsibility-driven technical abstractions and must remain independent from concrete Application configuration and presentation.
