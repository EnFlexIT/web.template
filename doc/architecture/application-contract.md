# Application Contract

## Purpose

This document defines the integration boundary between a concrete Application and the reusable Base Template provided by `web.template`.

The implemented dependency direction is:

```text

Application --> Template --> Core

```

The contract allows a concrete Application to configure and extend the Base Template without requiring Template to import concrete Application implementation.

The Base Template includes the standard Agent.Workbench functionality.

Agent.Workbench is the current in-repository Application identity/composition, while its standard functionality remains Template-owned.

HEMS is an example of a concrete Application that can consume the Base Template.

---

# 1. Architectural Role

The three architecture layers have separate responsibilities.

```text

Application

    |

    v

Template

    |

    v

Core

```

## Core

Core provides reusable technical capabilities.

Core must not depend on Template.

Core must not depend on Application.

## Template

Template provides the reusable application platform.

Template may depend on Core.

Template must not depend on a concrete Application.

Template owns the standard Agent.Workbench functionality.

## Application

Application is the concrete product and composition layer.

Application may consume Template and Core through supported integration surfaces.

Application provides concrete product configuration and extensions.

---

# 2. Base Template and Agent.Workbench

The Base Template is not independent from Agent.Workbench standard functionality.

Agent.Workbench standard functionality is intentionally part of the Base Template.

Template-owned functionality includes, where applicable:

```text

Agent.Workbench standard screens

Agent.Workbench state

Agent.Workbench API integration

Program Start

Data Analyzing

Database configuration

Server configuration

Live Console

Settings

Authentication and session orchestration

Navigation infrastructure

Update functionality

Notifications

Design system

Template screen registry

```

This means the architecture does not require:

```text

a separate Agent.Workbench Application

a separate Agent.Workbench Application repository

Agent.Workbench state extraction into Application

Agent.Workbench screen extraction into Application

```

A future architecture decision could change this boundary, but it is not part of the current architecture.

---

# 3. Concrete Applications

A concrete Application provides product-specific composition on top of the Base Template.

Plant Assist is the first separate concrete consumer repository currently used to validate this contract.

HEMS remains a future example of a concrete Application that can follow the same consumer model.

A concrete Application may own:

```text
Application identity
Application metadata
Template feature selection
Application-specific navigation
Application navigation presentation
Application-specific screens
Application translations
Application branding
Application assets
Application theme overrides
optional Application-specific Redux state
product-specific behavior
product version
product build
release workflow
deployment configuration
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

The current `web.template` repository still contains the in-repository Agent.Workbench Application composition that validates the integration model from inside the Template repository.

The separate `web.plantAssist` repository additionally validates the same integration contract as an independent consumer.

Plant Assist is currently an MVP used to validate composition, configuration, branding, responsive Application screens and independent release ownership. It is not intended to represent final product functionality or final UI design.

---

# 4. Dependency Inversion

Template must not select or import a concrete Application.

Incorrect:

```text

Template

    |

    v

HEMS implementation

```

Correct:

```text

HEMS Application

    |

    v

Template public integration contract

```

The same principle applies to any future concrete Application.

The concrete Application composes itself with Template.

Template remains unaware of which concrete consumer is using it.

---

# 5. Current Contract Files

The Template-side Application integration layer exists under:

```text
src/template/application/
```

Known contract files include:

```text
ApplicationConfig.ts
ApplicationConfigContext.tsx
createTemplateApp.tsx
TemplateApp.tsx
```

The Application side includes integration areas under:

```text
src/application/
```

A current Application structure may include:

```text
index.ts

assets/

config/
├── application.properties
├── features.properties
└── navigation.properties

generated/
├── applicationAssets.generated.ts
├── applicationConfig.generated.ts
├── applicationScreenRegistry.generated.ts
└── applicationTheme.generated.ts

i18n/

screens/

state/
└── applicationReducers.ts
```

The exact generated implementation may evolve, but the ownership boundary described by this document must remain intact.

Application-owned assets, translations and screens remain outside reusable Template ownership.

Generated artifacts are implementation details and are not the normal developer-facing configuration surface.

---

# 6. ApplicationConfig

`ApplicationConfig` is the typed runtime contract used by Template to receive Application configuration.

It is defined in:

```text

src/template/application/ApplicationConfig.ts

```

The contract provides Template with the Application-owned information required for composition.

The contract must remain focused on values that Template actually needs.

It must not become a container for arbitrary product-specific data.

The design rule is:

```text

Does Template require this value?

YES

    -> consider adding it to the integration contract

NO

    -> keep it Application-owned

```

---

# 7. Application Identity

Application identity belongs to Application.

Typical runtime identity values include:

```text

id

displayName

```

Their responsibilities are:

```text

id

    stable technical Application identifier

displayName

    human-readable Application name

```

Template may consume these values through the formal Application contract.

Template must not require product-specific hardcoded identity values.

---

# 8. ApplicationConfigContext

Reusable Template components can access selected Application configuration through:

```text

src/template/application/ApplicationConfigContext.tsx

```

This allows Template UI to consume Application-owned information without importing concrete Application implementation.

Conceptually:

```text

Application configuration

        |

        v

ApplicationConfig

        |

        v

ApplicationConfigProvider

        |

        v

Template component

```

This preserves the dependency direction.

---

# 9. createTemplateApp

The reusable composition entry point exists at:

```text

src/template/application/createTemplateApp.tsx

```

Conceptually:

```text

Concrete Application

        |

        | configuration

        v

createTemplateApp(...)

        |

        v

TemplateApp

```

Application supplies concrete configuration.

Template supplies the reusable application runtime.

This is the central composition direction:

```text

Application --> Template

```

---

# 10. TemplateApp

`TemplateApp` represents the reusable application platform runtime.

It must remain independent from concrete Application implementation.

TemplateApp may consume:

```text

Application contract values

Template-owned configuration

Template-owned state

Core capabilities

```

It must not directly import:

```text

HEMS implementation

future concrete Application implementation

src/application implementation details

```

---

# 11. No Runtime Application Resolver

Template does not contain a runtime product resolver.

The architecture does not use:

```text
if Plant Assist ...
if HEMS ...
if Application A ...
if Application B ...
```

inside Template to decide which product is running.

Instead, each concrete Application composes itself with the Base Template.

Conceptually:

```text
Plant Assist
    |
    v
createTemplateApp(...)
    |
    v
Base Template
```

The same consumer model can be used by HEMS and future concrete Applications.

There is no separate Agent.Workbench Application repository in this model because Agent.Workbench standard functionality is already part of the Base Template.

---

# 12. Developer-Facing Configuration

Developer-facing Application configuration must not require developers to edit TypeScript, TSX, JavaScript or JSON configuration files.

The supported developer-facing configuration files are:

```text
src/application/config/
├── application.properties
├── features.properties
└── navigation.properties
```

Their responsibilities are:

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

Examples of supported Application configuration include:

```properties
ApplicationId=plant-assist
ApplicationTitle=Plant Assist
ApplicationLogo=flexaqua

ThemeLightPrimary=#009FB2
ThemeLightBackground=#F4FBFC

ThemeDarkPrimary=#35C4D2
ThemeDarkBackground=#0E1C22
```

Application navigation may additionally enable optional menu icons:

```properties
NavigationMenuIconsEnabled=true

menu.plantAssist.enabled=true
menu.plantAssist.caption=plantAssist
menu.plantAssist.parent=settings
menu.plantAssist.position=99
menu.plantAssist.screen=plant-assist-screen
menu.plantAssist.icon=appstore
```

Application branding and visual customization therefore remain Application-owned without requiring modifications to reusable Template source files.

Generated TypeScript is an implementation detail and is not the primary manual configuration surface.

---

# 13. Removed Legacy Configuration

The following older configuration files are not part of the current Application contract:

```text
menu.properties
tabs.properties
featureFlags.properties
```

Documentation must not describe these files as active configuration.

Their responsibilities are now covered by the current configuration model:

```text
application.properties
features.properties
navigation.properties
```

Generated implementation artifacts must not replace these files as the developer-facing configuration surface.

---

# 14. Properties and Runtime Configuration

Developer-facing `.properties` files and Application-owned resources are transformed into runtime configuration and generated registries.

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
Template
```

Generated files may use TypeScript because they are build/runtime implementation artifacts.

Developers should not need to edit generated TypeScript to configure a concrete Application.

The developer-facing inputs remain:

```text
.properties configuration
Application screens
Application assets
Application translations
optional Application state
```

---

# 15. Configuration and Discovery Generation

Application configuration generation is implemented by Template-side build tooling.

The central generator is:

```text
src/template/config/build/generateApplicationConfig.mjs
```

Additional discovery tooling includes:

```text
src/template/config/build/applicationScreenDiscovery.mjs
src/template/config/build/applicationAssetDiscovery.mjs
```

The explicit generation command is:

```text
npm run config:generate
```

The generation lifecycle currently supports:

```text
Application identity
Application metadata
Template feature selection
Application navigation
optional navigation icons
Application branding
Application theme overrides
Application screen discovery
Application asset discovery
```

Generated runtime artifacts include:

```text
src/application/generated/applicationConfig.generated.ts
src/application/generated/applicationScreenRegistry.generated.ts
src/application/generated/applicationAssets.generated.ts
src/application/generated/applicationTheme.generated.ts
```

The generator is part of the reusable integration mechanism between a concrete Application and the Base Template.

Concrete Applications should configure supported behavior through the Application contract rather than modifying generated output manually.

---

# 16. Semantic Template Feature Selection

Concrete Applications enable or disable reusable Template functionality semantically through:

```text

src/application/config/features.properties

```

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

Application configuration selects capabilities.

It does not reproduce Template implementation details.

Template remains responsible for the internal implementation of enabled features.

---

# 17. Feature Ownership

Feature selection and feature implementation have different owners.

```text

Application

    |

    +-- selects reusable features

    |

    v

Template

    |

    +-- owns reusable feature implementation

```

For example:

```text

Application:

feature.liveConsole.enabled=true

Template:

Live Console screen

navigation definition

screen registry key

visibility integration

state and reusable behavior

```

This prevents concrete Applications from depending on internal Template structure.

---

# 18. Template Navigation Ownership

Template owns reusable navigation infrastructure and the internal navigation definitions of reusable Template functionality.

This includes:

```text
internal Template menu IDs
internal parent IDs
Template screen registry keys
authentication visibility
runtime visibility rules
Agent.Workbench navigation definitions
Template menu ordering
navigation rendering
```

Applications do not need to know these internal details.

The Base Template is therefore free to change internal IDs and structure without requiring corresponding changes in every concrete Application.

Navigation presentation can be configured by the concrete Application without transferring ownership of the navigation infrastructure.

For example:

```properties
NavigationMenuIconsEnabled=true
```

and:

```properties
menu.plantAssist.icon=appstore
```

The Application selects whether optional icons are displayed and may provide an icon for its own navigation extension.

Template remains responsible for rendering, routing, menu structure and reusable Template navigation definitions.

When menu icons are disabled or not configured, the classic text-oriented navigation remains supported.

---

# 19. Application Navigation Extensions

Application-specific navigation is configured through:

```text
src/application/config/navigation.properties
```

A concrete Application can define its own navigation extension semantically.

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

The Application describes its own extension and its optional presentation metadata.

It does not manually assign or maintain Template internal numeric IDs.

Custom IDs are generated or resolved internally.

Application translation files provide the visible localized caption and optional related descriptive text.

---

# 20. Navigation Composition

Runtime navigation combines Template-owned navigation with Application-owned extensions.

Conceptually:

```text

Template navigation

        +

Application navigation extensions

        |

        v

runtime navigation

```

Template owns reusable navigation.

Application owns only concrete product-specific additions.

This is different from the previous model where a concrete Application was expected to provide the full Template menu and tab structure.

---

# 21. Template Menu Ordering

Normal Template menu positions are derived automatically from the order of sibling entries in the Template menu catalog.

Template developers therefore do not need to maintain explicit numeric positions for standard Template menu items.

Application custom menu `position` remains optional.

For items without an explicit position, MenuHub uses:

```ts

Number.MAX_SAFE_INTEGER

```

The relevant implementation is located in:

```text

src/template/screens/menu/MenuHubScreen.tsx

```

This keeps the reusable navigation ordering consistent.

---

# 22. Application Screens

Concrete product-specific screens belong to Application.

Reusable Base Template screens belong to Template.

The in-repository Agent.Workbench Application composition contains an example Application screen.

The separate Plant Assist consumer contains its own `PlantAssistScreen.tsx`.

Application screens must not require manual registration inside Template.

Template must not import concrete Application screen implementations.

Application screens may use supported Template UI components and layout primitives such as `Screen`, the design system and public Application integration surfaces.

---

# 23. Automatic Screen and Asset Discovery

Application screens are discovered automatically.

The screen discovery implementation exists at:

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

The generated Application screen registry is:

```text
src/application/generated/applicationScreenRegistry.generated.ts
```

Application assets are discovered through:

```text
src/template/config/build/applicationAssetDiscovery.mjs
```

Application-owned assets are placed under:

```text
src/application/assets/
```

The generated Application asset registry is:

```text
src/application/generated/applicationAssets.generated.ts
```

Branding configuration can reference discovered assets semantically, for example:

```properties
ApplicationLogo=flexaqua
```

This allows Application navigation, branding and screens to reference Application-owned resources without requiring Template to know those concrete implementations in advance.

---

# 24. Screen Ownership Boundary

The screen ownership rule is:

```text
Reusable Base Template screen
    -> Template

Standard Agent.Workbench screen
    -> Template

Plant Assist product screen
    -> Plant Assist Application

Concrete HEMS screen
    -> HEMS Application

Other product-specific screen
    -> corresponding Application
```

Agent.Workbench standard screens must not be documented as candidates for extraction into a separate Agent.Workbench Application.

---

# 25. Redux Infrastructure

Reusable Redux infrastructure belongs to Template.

Relevant infrastructure exists under:

```text

src/template/state/

```

and:

```text

src/template/state/store/

```

Template owns the common store integration and reusable state infrastructure.

Concrete Applications may optionally add Application-specific reducers.

---

# 26. Agent.Workbench State

Agent.Workbench state is intentionally Template-owned.

A known dedicated area is:

```text

src/template/state/agent-workbench/

```

This is not transitional Application state.

The architecture rule is:

```text

Agent.Workbench reusable state

    -> Template

concrete product-only state

    -> Application

```

Documentation must not state that Agent.Workbench reducers need to be extracted into a separate Application repository.

---

# 27. Application-Specific Redux State

Application-specific Redux state is optional.

The current Application extension point is:

```text

src/application/state/applicationReducers.ts

```

The current Agent.Workbench Application composition does not require meaningful Application-specific Redux state.

Therefore `applicationReducers.ts` can remain essentially empty.

Its existence represents an extension point, not incomplete migration work.

---

# 28. Reducer Composition

Template-owned and Application-owned reducers may be composed through the reusable Redux integration mechanism.

Conceptually:

```text

Template reducers

        +

optional Application reducers

        |

        v

runtime store

```

Template must not import concrete Application reducers directly.

Application-specific reducers are supplied through the supported composition boundary.

---

# 29. Reducer Collision Protection

Application reducers must not silently override Template-owned reducer keys.

The integration layer must preserve ownership boundaries.

Conceptually:

```text

Template reducer key

        +

Application reducer key

        |

        v

collision validation

```

Duplicate ownership should fail rather than silently replace Template state.

---

# 30. Application Public Entry Point

The current Application public entry point is:

```text

src/application/index.ts

```

It exposes Application-owned integration values required by the repository composition.

The exact exports may evolve with implementation, but Template must not bypass the Application integration boundary and deep-import arbitrary Application implementation files.

---

# 31. Branding and Theme Overrides

Concrete product branding belongs to Application where it is genuinely product-specific.

Supported Application-owned branding currently includes:

```text
Application logo
product-specific visual assets
Application identity
Application theme overrides
```

Application branding may be configured through `application.properties`.

Example:

```properties
ApplicationLogo=flexaqua
```

Application theme overrides may also be configured through `application.properties`.

Examples:

```properties
ThemeLightPrimary=#009FB2
ThemeLightBackground=#F4FBFC
ThemeLightCard=#FFFFFF
ThemeLightText=#12313D

ThemeDarkPrimary=#35C4D2
ThemeDarkBackground=#0E1C22
ThemeDarkCard=#132A31
ThemeDarkText=#E8F7F9
```

Generated theme overrides are materialized in:

```text
src/application/generated/applicationTheme.generated.ts
```

The Base Template still owns the reusable theme system and design-system infrastructure.

Concrete Applications override supported theme values without modifying Template theme source files.

When an override is omitted, the Base Template default remains active.

Not every branding concern needs to become part of `ApplicationConfig`.

A branding value should only enter the formal runtime contract when Template requires that value to perform reusable platform behavior.

---

# 32. Backend and API Ownership

Backend/API ownership follows responsibility rather than file location alone.

```text

Reusable technical communication

    -> Core where appropriate

Reusable Base Template / Agent.Workbench integration

    -> Template where appropriate

Concrete product business API

    -> Application

```

Agent.Workbench API integration may remain Template-owned when it is part of standard reusable Base Template functionality.

HEMS-specific business APIs belong to the HEMS Application.

---

# 33. Build, Version and Deployment Ownership

A concrete consumer repository owns its product-specific build, version and deployment configuration.

The separate `web.plantAssist` consumer currently demonstrates this ownership.

A concrete consumer may own:

```text
product identity
Application configuration
product version
Application branding
Application assets
Application theme overrides
product release configuration
deployment targets
product-specific infrastructure configuration
release workflow
```

Plant Assist has been built and released independently while consuming the Base Template architecture.

This validates that the Application contract works outside the `web.template` repository.

The Base Template provides reusable platform capability and integration contracts.

The current Agent.Workbench Application composition remains inside `web.template` to validate the same contract from within the Template repository.

Application versioning and Template versioning are separate concerns.

A concrete product release represents an Application release. The Template version used by that Application is supporting build information, not a separate end-user update channel by default.

Detailed BuildInfo and release-note presentation are planned architectural extensions and are not yet part of the implemented contract.

---

# 34. Current Plant Assist Consumer and Future HEMS Repository

Plant Assist is the first separate concrete Application repository currently used to validate the Base Template consumer model.

Conceptually:

```text
Plant Assist Application Repository
        |
        v
Base Template
        |
        v
Core
```

Plant Assist currently demonstrates:

```text
Application .properties configuration
Application branding and assets
Application theme overrides
Application navigation extensions
optional navigation icons
Application translations
Application-owned responsive screens
independent Application versioning
independent build and release workflow
deployment configuration
```

Plant Assist remains an MVP used to validate the Application contract. It is not intended to represent final product behavior or final product design.

HEMS remains a future concrete Application.

A future HEMS consumer repository may contain:

```text
HEMS Application configuration
HEMS screens
HEMS translations
HEMS navigation extensions
optional HEMS-specific Redux state
HEMS product behavior
HEMS branding
HEMS build and deployment configuration
```

Conceptually:

```text
Plant Assist      HEMS       future Applications
   current        future
   consumer       consumer
        \           |            /
         \          |           /
             Base Template
                  |
                  v
                 Core
```

No equivalent Agent.Workbench Application repository is required by the current architecture.

---

# 35. Template Must Not Know Concrete Applications

The following dependency patterns are prohibited:

```text

Template

    |

    +-- import HemsScreen

    +-- import HemsConfig

    +-- if application === "hems"

    +-- import concrete Application reducers

```

Template must remain reusable without explicit knowledge of a concrete consumer.

The Application contract exists to provide the required inversion.

---

# 36. Stable Contract Principle

Applications should integrate through documented public contracts and extension points.

Preferred:

```text
ApplicationConfig
ApplicationConfigContext
createTemplateApp
.properties configuration
Application screen discovery
Application asset discovery
Application branding
Application theme overrides
documented navigation extension
optional navigation presentation
documented Redux extension points
Template public APIs
```

Avoid:

```text
deep imports into arbitrary Template implementation files
Application changes inside Template internals
Template imports from concrete Application folders
duplication of Template navigation definitions
manual Application screen registration inside Template
manual Application asset registration inside Template
editing generated runtime files as configuration
editing Template theme source files for one concrete Application
```

The Application contract should remain small, explicit and stable while allowing product-owned composition outside Template.

---

# 37. Core Independence

The Application contract primarily connects Application to Template.

Core must not become aware of the complete concrete Application contract.

If a Core capability requires a technical value, higher-level orchestration should provide only the minimum technical value required.

Conceptually:

```text

Application configuration

        |

        v

Template orchestration

        |

        v

specific technical value

        |

        v

Core capability

```

This preserves:

```text

Application --> Template --> Core

```

---

# 38. Contract Evolution

The Application contract may evolve when new reusable integration requirements appear.

Potential additions must be evaluated individually.

Do not add a contract field simply because one concrete product has a value.

Before adding a field, verify:

```text

1\. Does Template need the value?

2\. Is the requirement reusable across concrete Applications?

3\. Can the requirement remain Application-owned instead?

4\. Does adding it preserve the dependency direction?

5\. Does it avoid exposing Template internals?

```

The contract should remain explicit and as small as practical.

---

# 39. Current Contract Model

The current Application integration model includes:

```text
Application identity and metadata
properties-based developer configuration
semantic Template feature selection
Application-specific navigation extensions
optional navigation icons
Application branding
Application theme overrides
automatic Application screen discovery
automatic Application asset discovery
generated runtime configuration
generated branding/theme registries
Application translations
optional Application-specific Redux state
Application-to-Template composition
independent consumer build/version/release ownership
```

Template continues to own:

```text
Base Template application shell
Agent.Workbench standard functionality
Agent.Workbench state
Template navigation
Template feature implementation
Template screen registry
reusable Redux infrastructure
authentication/session orchestration
server selection
settings
update behavior
notifications
design system
theme infrastructure
navigation rendering
```

Plant Assist validates this contract as a separate consumer repository.

BuildInfo, Application information screens and release-note metadata are planned extensions rather than currently implemented contract features.

---

# 40. Application Contract Diagram

The logical Application contract is:

```text
+--------------------------------------------------+
| Concrete Application                             |
|                                                  |
| application.properties                           |
| features.properties                              |
| navigation.properties                            |
| Application assets                               |
| Application branding                             |
| Application theme overrides                      |
| Application-specific screens                     |
| Application translations                         |
| optional Application-specific Redux state        |
| product-specific behavior                        |
| product version / build / release                 |
+-------------------------+------------------------+
                          |
                          | Application contract
                          v
+--------------------------------------------------+
| Base Template                                    |
|                                                  |
| ApplicationConfig                                |
| ApplicationConfigContext                         |
| createTemplateApp                                |
| TemplateApp                                      |
| configuration generation                         |
| Application screen discovery                     |
| Application asset discovery                      |
| navigation infrastructure                        |
| optional navigation icon rendering               |
| reusable theme infrastructure                    |
| Agent.Workbench standard functionality           |
| Agent.Workbench state                            |
| reusable Redux infrastructure                    |
| authentication/session orchestration             |
| server selection                                 |
| settings                                         |
| update                                           |
| notifications                                    |
| design system                                    |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
| Core                                             |
|                                                  |
| reusable technical capabilities                  |
+--------------------------------------------------+
```

Plant Assist currently validates the concrete consumer side of this contract outside `web.template`.

---

# 41. Architecture Invariants

The Application contract must preserve the following invariants:

1. `Application --> Template --> Core`.
2. Core must not depend on Template.
3. Core must not depend on Application.
4. Template must not depend on a concrete Application.
5. Agent.Workbench standard functionality belongs to Template.
6. Agent.Workbench state belongs to Template.
7. Plant Assist is a current concrete consumer Application.
8. HEMS remains a future concrete consumer Application.
9. A separate Agent.Workbench Application repository is not required.
10. Developer-facing Application configuration uses `.properties`.
11. Template owns reusable navigation internals.
12. Application navigation only extends concrete product navigation.
13. Template internal IDs must not be exposed as required Application configuration.
14. Application screens are discovered automatically.
15. Application assets are discovered automatically.
16. Application branding must not require changes to Template source files.
17. Application theme overrides must not require editing Template theme defaults.
18. Navigation icons are optional and Application-controlled.
19. Application-specific Redux state is optional.
20. Concrete product state must not override Template-owned reducer keys.
21. Generated TypeScript is not the primary developer-facing configuration format.
22. Template must not contain runtime branching for concrete Applications.
23. Concrete consumer repositories own their own product version, build, release and deployment process.

---

# 42. Dependency Validation

Useful dependency checks include:

```text

git grep -n "@/application/" -- src/template

```

Template must not import concrete Application implementation.

Application imports should also use supported Template integration surfaces rather than arbitrary Template internals.

A useful review command is:

```text

git grep -n "@/template/" -- src/application

```

Unexpected direct imports should be reviewed against the intended public integration API.

---

# 43. Validation Expectations

Changes affecting the Application contract should normally be validated with:

```text
npm run config:generate
npx tsc --noEmit
npm test -- --runInBand
git diff --check
git status --short
```

Relevant architecture dependency checks should also remain clean.

Application screen discovery, Application asset discovery and generated configuration should be regenerated before TypeScript validation when configuration-related files change.

Generated artifacts should be reviewed to ensure they reflect only intended Application configuration changes.

---

# 44. Incorrect Legacy Statements

The following statements describe the previous architecture direction and must not be reintroduced:

```text
"The Base Template must remain independent from Agent.Workbench."

"Agent.Workbench is a concrete Application."

"Agent.Workbench should have its own Application repository."

"Agent.Workbench reducers must later move out of Template."

"Agent.Workbench screens are Application extraction candidates."

"Template must not contain Agent.Workbench standard functionality."

"Concrete Applications provide the complete Template menu definition."

"Concrete Applications provide the complete Template tab definition."

"menu.properties is the active navigation configuration."

"tabs.properties is the active tab configuration."

"featureFlags.properties is the active feature configuration."

"The Application Redux integration is incomplete because Agent.Workbench state still exists inside Template."

"HEMS is the first separate consumer used to validate the contract."

"Application branding requires editing Template source files."

"Application themes must be implemented directly in Template theme files."
```

The correct ownership model is:

```text
Agent.Workbench standard functionality
    -> Base Template

Plant Assist
    -> current separate concrete Application consumer

HEMS and other product-specific consumers
    -> future concrete Applications
```

---

# 45. Success Criteria

The Application contract is successful when:

1. A concrete Application can configure itself without modifying Template internals.
2. Template does not import concrete Application implementation.
3. Core remains independent from Application.
4. Application identity can flow through the formal integration contract.
5. Applications can select reusable Template features semantically.
6. Applications do not need to know Template internal menu IDs or registry implementation details.
7. Applications can add product-specific navigation without reproducing Template navigation.
8. Optional navigation icons can be enabled without changing Template navigation ownership.
9. Application-owned screens are discovered without manual Template registration.
10. Application-owned assets are discovered without manual Template registration.
11. Applications can provide product branding without modifying Template source files.
12. Applications can provide supported theme overrides without editing Template theme defaults.
13. Optional Application-specific Redux state can be integrated without Template importing concrete reducers.
14. Agent.Workbench standard functionality remains reusable Base Template functionality.
15. Plant Assist can consume the Base Template as an independent concrete Application.
16. HEMS can follow the same consumer model in the future.
17. Developer-facing configuration remains properties-based.
18. Generated implementation details remain hidden from normal Application configuration.
19. A concrete consumer can own its own version, build, release and deployment process.
20. The contract remains small, explicit and maintainable.

---

# 46. Current Contract Summary

The implemented architecture is:

```text
Application --> Template --> Core
```

The Base Template contains reusable platform functionality and standard Agent.Workbench functionality.

Agent.Workbench is the current in-repository Application identity/composition, but it is not modeled as a separate consumer Application repository.

Plant Assist is the first separate concrete consumer currently used to validate the Application contract.

HEMS remains a future concrete consumer Application.

Concrete Applications configure the Base Template through supported integration surfaces.

Developer-facing configuration is based on:

```text
application.properties
features.properties
navigation.properties
```

Applications select reusable Template features semantically.

Template owns internal navigation definitions, visibility rules, feature implementation, navigation rendering and the Template screen registry.

Application-specific navigation extends the Template rather than replacing it.

Navigation icons are optional and may be enabled by a concrete Application.

Application screens are discovered automatically.

Application assets are discovered automatically.

Applications may provide their own branding and supported theme overrides without modifying reusable Template theme source files.

Template owns reusable Redux infrastructure and Agent.Workbench state.

Application-specific Redux state is optional.

Concrete consumer repositories own their own product version, build, release and deployment configuration.

Plant Assist has already validated independent consumer configuration and release ownership.

BuildInfo, Application information screens, Template/Application version presentation and release-note metadata are planned follow-up topics rather than currently implemented contract features.

The Application contract exists to keep concrete product composition outside Template while preserving the Base Template as the reusable platform.
