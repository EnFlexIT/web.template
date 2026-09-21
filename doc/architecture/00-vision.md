# Vision

## Purpose

`web.template` provides the reusable foundation for EnFlexIT web applications.

The architecture separates:

* reusable technical capabilities

* reusable application-platform functionality

* concrete product composition

The implemented dependency direction is:

```text

Application --> Template --> Core

```

This architecture is already selected and implemented.

Plant Assist is the first separate concrete consumer currently used to validate the Base Template integration contract.

HEMS remains a future concrete Application that can follow the same consumer model.

The architecture is not merely a future migration target.

---

# 1. Architectural Vision

The architecture consists of three responsibility layers:

```text

Application

    |

    v

Template

    |

    v

Core

```

These layers describe responsibility and dependency direction.

They are not merely directory names.

The general ownership rule is:

```text

Reusable technical capability

    -> Core

Reusable application platform

    -> Template

Concrete product composition

    -> Application

```

---

# 2. Core

Core contains reusable technical capabilities that remain independent from the reusable application platform and from concrete products.

Typical Core responsibilities include:

* technical authentication helpers

* reusable authentication types

* server normalization

* server validation

* technical server checks

* server-environment detection

* reusable runtime capabilities

* technical networking helpers

* technical update helpers

* reusable technical utilities

* framework-independent types and logic

Core must not depend on:

```text

Template

Application

```

Invalid dependencies are:

```text

Core --> Template

Core --> Application

```

Core should remain as independent from React and product composition as reasonably possible.

Reusability alone does not mean that functionality belongs to Core.

---

# 3. Template

Template contains the reusable application platform.

Template bridges Core capabilities with React, navigation, Redux, reusable UI and standard application behavior.

Typical Template responsibilities include:

* application bootstrap
* `TemplateApp`
* `createTemplateApp`
* `ApplicationConfig`
* `ApplicationConfigContext`
* reusable React application shell
* configuration and discovery tooling
* navigation infrastructure
* Template navigation definitions
* optional navigation icon rendering
* Template screen registry
* Redux infrastructure
* authentication and session orchestration
* server selection
* settings
* update orchestration
* notifications
* localization infrastructure
* design system
* reusable theme infrastructure
* reusable components
* reusable hooks
* reusable screens
* standard Agent.Workbench functionality
* Agent.Workbench state
* reusable Agent.Workbench API integration where appropriate

Template may depend on Core.

Template must not depend on a concrete Application.

Invalid:

```text
Template --> Plant Assist
Template --> HEMS
Template --> concrete Application implementation
```

Template provides reusable integration surfaces through which a concrete Application may contribute configuration, screens, assets, branding, theme overrides, translations, optional state and navigation extensions.

---

# 4. Agent.Workbench

Standard Agent.Workbench functionality is intentionally part of the Base Template.

The current ownership decision is:

```text

Agent.Workbench standard functionality

    -> Template

```

This includes standard reusable functionality such as:

```text

Program Start

Data Analyzing

Database configuration

Server configuration

Live Console

Settings

Agent.Workbench navigation

Agent.Workbench state

Agent.Workbench API integration where reusable

```

Agent.Workbench is therefore not modeled as a separate concrete Application.

The architecture does not require:

```text

a separate Agent.Workbench Application

a separate Agent.Workbench Application repository

Agent.Workbench screen extraction from Template

Agent.Workbench state extraction from Template

```

This ownership decision must not be reopened implicitly by documentation or refactoring.

---

# 5. Application

Application contains concrete product composition.

Typical Application responsibilities include:

* Application identity
* Application metadata
* semantic Template feature selection
* Application-specific navigation
* Application navigation presentation options
* Application-specific screens
* Application translations
* Application assets
* Application branding
* Application theme overrides
* optional Application-specific Redux state
* product-specific business logic
* product-specific APIs
* product version
* product-specific build configuration
* product release configuration
* product-specific deployment configuration

Application may consume supported Template and Core integration surfaces.

Template and Core must never depend on a concrete Application.

Concrete Applications should use supported `.properties` configuration and Application-owned files rather than modifying generated runtime artifacts or reusable Template source files.

---

# 6. Concrete Applications

Plant Assist is the first separate concrete Application currently used to validate the consumer model.

Conceptually:

```text
Plant Assist Application
        |
        v
Base Template
        |
        v
Core
```

Plant Assist currently demonstrates:

```text
Application configuration
Template feature selection
Application navigation extensions
optional navigation icons
Application-specific screens
Application translations
Application assets and branding
Application theme overrides
independent Application versioning
independent build and release
deployment configuration
```

Plant Assist is currently an MVP used to validate architecture and integration.

It is not intended to represent final product functionality or final UI design.

HEMS remains a future concrete Application and may follow the same model.

Conceptually:

```text
HEMS Application
        |
        v
Base Template
        |
        v
Core
```

Future concrete EnFlexIT Applications can follow the same consumer pattern.

A concrete Application should focus on product-specific concerns while reusing platform functionality from Template and technical capabilities from Core.

---

# 7. Current Repository Model

The current `web.template` repository contains:

```text
web.template
|
+-- src/core/
|
+-- src/template/
|
+-- src/application/
```

The responsibilities are:

```text
src/core/
    reusable technical capabilities

src/template/
    reusable Base Template platform
    including standard Agent.Workbench functionality

src/application/
    in-repository Agent.Workbench Application composition
    validating the Application integration contract
```

`src/application/` is not Agent.Workbench itself.

The architecture is additionally validated by the separate consumer repository:

```text
web.plantAssist
```

`web.plantAssist` owns its concrete Application configuration, branding, theme overrides, screens, translations, version, build, release and deployment concerns while consuming the Base Template architecture.

---

# 8. Base Template Repository

The Base Template repository contains:

```text

Base Template

|

+-- Core

|

+-- Template

\|   |

\|   +-- application shell

\|   +-- Application contract

\|   +-- navigation infrastructure

\|   +-- Template navigation

\|   +-- Redux infrastructure

\|   +-- Agent.Workbench functionality

\|   +-- Agent.Workbench state

\|   +-- authentication/session

\|   +-- server selection

\|   +-- settings

\|   +-- notifications

\|   +-- update orchestration

\|   +-- design system

\|   +-- reusable screens/components/hooks

|

+-- Agent.Workbench Application composition

```

The current Agent.Workbench Application composition exists to verify that the Base Template can be consumed through the intended Application contract.

---

# 9. Consumer Repository Model

Concrete Applications may consume the Base Template from separate repositories.

The current and future model is:

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

A concrete consumer repository may contain:

```text
Application configuration
Application navigation
Application navigation presentation options
Application screens
Application translations
Application assets
Application branding
Application theme overrides
optional Application state
product business logic
product version
product build configuration
product release workflow
product deployment configuration
```

Plant Assist is the first current proof that this separate consumer model works.

Agent.Workbench is not shown as a separate consumer because its standard functionality belongs to the Base Template itself.

---

# 10. Responsibility Principle

The central ownership question is:

```text

Who owns the responsibility?

```

Examples:

```text

technical server normalization

    -> Core

server-selection UI

    -> Template

product-specific server configuration

    -> Application

```

Another example:

```text

technical authentication helper

    -> Core

session orchestration

    -> Template

product-specific authentication behavior

    -> Application

```

Another example:

```text

Agent.Workbench Data Analyzing state

    -> Template

HEMS-specific domain state

    -> HEMS Application

```

Physical location alone must not determine ownership.

---

# 11. Application Contract

Applications integrate with Template through explicit contracts.

Important Template-side integration files include:

```text

src/template/application/

├── ApplicationConfig.ts

├── ApplicationConfigContext.tsx

├── createTemplateApp.tsx

└── TemplateApp.tsx

```

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

        |

        v

Reusable Template runtime

```

Template defines the reusable integration contract.

Application provides concrete composition.

---

# 12. Application Configuration

Developer-facing Application configuration should remain simple and non-code-oriented.

The current configuration is:

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
    semantic activation or deactivation
    of reusable Template features

navigation.properties
    Application-specific navigation extensions
    Application navigation presentation options
```

Examples include:

```properties
ApplicationId=plant-assist
ApplicationTitle=Plant Assist
ApplicationLogo=flexaqua

ThemeLightPrimary=#009FB2
ThemeLightBackground=#F4FBFC

ThemeDarkPrimary=#35C4D2
ThemeDarkBackground=#0E1C22
```

and:

```properties
NavigationMenuIconsEnabled=true

menu.plantAssist.enabled=true
menu.plantAssist.caption=plantAssist
menu.plantAssist.parent=settings
menu.plantAssist.position=99
menu.plantAssist.screen=plant-assist-screen
menu.plantAssist.icon=appstore
```

Developers should not need to edit TypeScript, TSX, JavaScript or JSON configuration files for normal Application configuration.

Generated TypeScript may exist as build/runtime output, but generated files are not the normal developer-facing configuration surface.

---

# 13. Legacy Configuration Names

The following names are not part of the current architecture:

```text

menu.properties

tabs.properties

featureFlags.properties

menuFeatureFlags.properties

tabFeatureFlags.properties

```

They must not be reintroduced as planned or active Application configuration.

The current model is:

```text

application.properties

features.properties

navigation.properties

```

---

# 14. Semantic Feature Selection

Applications enable or disable reusable Template capabilities semantically.

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

Application selects reusable functionality.

Template owns the implementation.

Applications therefore do not need to configure Template internals such as:

```text

numeric menu IDs

internal parent IDs

Template screen registry keys

authentication visibility rules

runtime visibility rules

Agent.Workbench navigation internals

```

---

# 15. Navigation

Navigation infrastructure belongs to Template.

Reusable Template navigation definitions also belong to Template.

Application owns only concrete Application-specific navigation extensions and supported presentation options.

Conceptually:

```text
Template navigation
        +
Application navigation extensions
        |
        v
runtime navigation
```

Template responsibilities include:

* menu rendering
* menu tree construction
* routing
* path calculation
* visibility integration
* Template screen registry
* Agent.Workbench navigation
* Template menu ordering
* optional navigation icon rendering

Application navigation is configured through:

```text
navigation.properties
```

Applications may optionally enable navigation icons:

```properties
NavigationMenuIconsEnabled=true
```

and may provide an icon for an Application-owned navigation entry:

```properties
menu.plantAssist.icon=appstore
```

When icons are omitted or disabled, the classic text-oriented navigation remains supported.

Applications do not reproduce the entire Template navigation structure.

---

# 16. Automatic Screen and Asset Discovery

Application-specific screens belong to Application.

Reusable Template screens and standard Agent.Workbench screens belong to Template.

Application screens are discovered automatically through:

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

The generated registry is:

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

The generated asset registry is:

```text
src/application/generated/applicationAssets.generated.ts
```

Application branding may reference a discovered asset semantically:

```properties
ApplicationLogo=flexaqua
```

Template must not manually import concrete Application screens or concrete Application branding assets.

---

# 17. Redux

Redux is a state-management technology, not an architectural layer.

State ownership follows responsibility.

```text

Template

|

+-- reusable Template state

+-- Agent.Workbench state

+-- reusable store infrastructure

Application

|

+-- optional concrete product-specific state

```

The ownership rule is:

```text

Reusable Template state

    -> Template

Agent.Workbench standard state

    -> Template

Concrete product-only state

    -> Application

```

Agent.Workbench state is not transitional Application state.

---

# 18. Redux Extension

Template provides reusable Redux infrastructure.

Concrete Applications may optionally provide Application-specific reducers.

Conceptually:

```text

Template reducers

        +

optional Application reducers

        |

        v

Redux store

```

The Application extension point exists at:

```text

src/application/state/applicationReducers.ts

```

The current Agent.Workbench Application composition does not require meaningful Application-specific Redux state.

This is valid.

Template must not import concrete Application reducer implementations.

---

# 19. Design System and Theme Overrides

Reusable React UI belongs primarily to Template.

The shared design system is part of the Base Template.

Conceptually:

```text
Application screen
        |
        v
Template design system
        |
        v
theme and reusable UI infrastructure
```

Reusable theme infrastructure belongs to Template.

Concrete theme override values belong to Application.

Supported Application theme overrides are configured through `application.properties`.

Examples:

```properties
ThemeLightPrimary=#009FB2
ThemeLightBackground=#F4FBFC

ThemeDarkPrimary=#35C4D2
ThemeDarkBackground=#0E1C22
```

Generated theme overrides are materialized in:

```text
src/application/generated/applicationTheme.generated.ts
```

When an override is omitted, the Base Template default remains active.

Product-specific UI belongs to Application.

Core does not own React presentation components merely because they are reusable.

---

# 20. API Ownership

API ownership follows responsibility.

```text

generic technical communication

    -> Core where appropriate

reusable Base Template / Agent.Workbench API integration

    -> Template where appropriate

concrete product business API

    -> Application

```

Agent.Workbench-named API code is not automatically Application-owned.

Its actual responsibility must be inspected before ownership changes.

---

# 21. Build, Version, Release and Deployment

Concrete consumer Applications own product-specific build, version, release and deployment configuration.

Examples include:

* product identity
* Application configuration
* Application version
* product release artifacts
* product release workflow
* deployment targets
* product-specific infrastructure configuration
* Helm configuration where applicable

Plant Assist currently validates this ownership through its separate consumer repository and independent release process.

The Base Template provides reusable capabilities and integration contracts.

It should not require product-specific build configuration for unrelated consumer Applications.

Application versioning and Template versioning are separate concerns.

A concrete product release represents the Application as a unit.

The Template version used by that Application is supporting build information rather than a separate end-user update channel by default.

Explicit BuildInfo, Application information UI and release-note metadata are planned follow-up topics and are not yet part of the implemented platform contract.

---

# 22. No Runtime Product Resolver

Template must not contain a central resolver that selects between concrete Applications.

Incorrect:

```text

Template

|

+-- detect Agent.Workbench

+-- detect HEMS

+-- choose product

```

Correct:

```text

Concrete Application

        |

        v

Base Template

```

Agent.Workbench does not participate in product selection because its standard functionality is already part of the Base Template.

---

# 23. Goals

The architecture should:

* provide one reusable Base Template for multiple concrete Applications
* keep Core technically focused and independent
* keep Template independent from concrete consumer Applications
* keep Agent.Workbench standard functionality in the reusable platform
* separate product-specific behavior from reusable platform behavior
* reduce implementation duplication
* simplify creation of future Applications
* allow Plant Assist, HEMS and future consumers to reuse the same platform
* keep Application configuration simple
* expose stable integration contracts
* support Application-owned branding and theme overrides
* support automatic Application screen and asset discovery
* allow optional Application navigation presentation without transferring navigation ownership
* preserve clear dependency boundaries
* allow consumer-specific version, build, release and deployment ownership

---

# 24. Design Principles

The architecture follows these principles:

1. Dependencies point inward:

   ```text
   Application --> Template --> Core
   ```

2. Core must not depend on Template or Application.
3. Template must not depend on a concrete Application.
4. Standard Agent.Workbench functionality belongs to Template.
5. Concrete product functionality belongs to Application.
6. Reusable React UI and application-shell behavior belong to Template.
7. Reusable technical capabilities belong to Core when sufficiently independent from UI and product behavior.
8. Redux ownership follows responsibility.
9. Application configuration should remain explicit and simple.
10. Developer-facing Application configuration uses `.properties`.
11. Applications should not depend on Template internal IDs or implementation details.
12. Stable public integration contracts are preferred over deep cross-layer imports.
13. Concrete Applications compose themselves with Template.
14. Template does not select the active concrete Application.
15. Application branding should not require modifying Template source files.
16. Application theme overrides should not require editing Template theme defaults.
17. Application screens and supported assets should be discoverable without manual Template registration.
18. Concrete consumer repositories own their own product version, build, release and deployment process.
19. Ownership must be determined by responsibility, not historical file location or naming alone.

---

# 25. Non-Goals

The architecture does not aim to:

* put every reusable function into Core
* turn Core into a UI framework
* make Template aware of every concrete Application
* create a runtime resolver for multiple products
* create a separate Agent.Workbench Application repository
* extract standard Agent.Workbench state from Template
* extract standard Agent.Workbench screens from Template
* duplicate Template navigation inside concrete Applications
* expose Template internal menu IDs as Application configuration
* require Application developers to edit TypeScript configuration
* require Applications to modify Template theme source files
* require manual Application screen or asset registration inside Template
* move code only to make directory boundaries look cleaner

The current Plant Assist MVP is also not intended to define the final Plant Assist product functionality or final UI design.

---

# 26. Current Architecture Status

The fundamental architecture is established.

The current model is:

```text
Application --> Template --> Core
```

with:

```text
Agent.Workbench standard functionality
    -> Template

Plant Assist
    -> current separate concrete Application consumer

HEMS
    -> future concrete Application consumer
```

The current architecture already includes:

```text
Core responsibility area
Template responsibility area
Application composition example
Application integration contract
properties-based Application configuration
semantic Template feature selection
Application navigation extensions
optional Application navigation icons
automatic Application screen discovery
automatic Application asset discovery
Application branding
Application theme overrides
Template-owned Agent.Workbench state
optional Application Redux extension
separate Plant Assist consumer validation
independent Plant Assist build and release validation
```

The architecture documentation should describe this as the current selected model rather than as an unfinished migration toward a separate Agent.Workbench Application.

---

# 27. Future Work

Future work should build on the current architecture rather than redefine it.

Possible future work includes:

```text
HEMS consumer integration
public Template API refinement
BuildInfo
Application information screen
Application-versus-Template version presentation
release-note metadata
further automation of consumer Application creation
additional Application contract extensions when required
```

The separate consumer model itself no longer needs hypothetical validation because Plant Assist already provides that proof.

Future consumers should follow the same ownership and dependency rules unless the architecture is explicitly changed.

---

# 28. Incorrect Legacy Vision

The following previous assumptions are no longer valid:

```text
"Agent.Workbench is a concrete Application."

"Agent.Workbench requires a separate Application repository."

"The Base Template must eventually remove Agent.Workbench functionality."

"Agent.Workbench state inside Template is transitional."

"Agent.Workbench screens must later move into Application."

"Agent.Workbench and HEMS have equivalent repository ownership."

"Applications provide the full Template menu and tab definitions."

"menu.properties is planned Application configuration."

"tabs.properties is planned Application configuration."

"featureFlags.properties is planned Application configuration."

"HEMS is the first separate consumer validation."

"Application branding requires editing Template source files."

"Application themes must be implemented directly in Template theme files."
```

The correct ownership is:

```text
Agent.Workbench standard functionality
    -> Base Template

Plant Assist
    -> current separate concrete Application consumer

HEMS and future product consumers
    -> future concrete Applications
```

---

# 29. Long-Term Objective

The long-term objective is to make it possible to create a concrete EnFlexIT Application primarily by providing:

```text
Application metadata
Template feature selection
Application navigation extensions
Application navigation presentation
Application screens
Application translations
Application assets
Application branding
Application theme overrides
optional Application state
product-specific business functionality
product version
product build/release/deployment configuration
```

while consuming reusable capabilities from the Base Template.

The dependency direction remains:

```text
Application
    |
    v
Template
    |
    v
Core
```

The Base Template can evolve as the reusable platform while concrete consumer Applications remain focused on their own product requirements.

Plant Assist already demonstrates the separate consumer model.

HEMS and future Applications can build on the same contract.

Agent.Workbench standard functionality remains part of the reusable Base Template.

Planned improvements such as BuildInfo, Application information UI, release-note metadata and further Application creation automation should extend this model without reversing its ownership boundaries.
