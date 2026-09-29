**# Current Architecture**

**## Purpose**

This document describes the current implemented architecture of \`web.template\` and the validated consumer model used by concrete Applications.

The architecture described here is active. It is not merely a future target or an incremental migration plan.

The implemented dependency direction is:

\`\`\`text

Application --> Template --> Core

\`\`\`

The architectural layers have clearly separated responsibilities:

\- **\*\*Core\*\*** provides reusable technical capabilities.

\- **\*\*Template\*\*** provides the reusable application platform, including standard Agent.Workbench functionality.

\- **\*\*Application\*\*** is the concrete product and composition layer.

Agent.Workbench standard functionality is intentionally part of the Base Template.

The repository also contains an in-repository Agent.Workbench Application composition used to validate the Application integration contract.

In addition, \`web.plantAssist\` and \`web.hems\` now validate the same contract as separate concrete consumer repositories.

Plant Assist remains the first independently released consumer, while HEMS currently validates the consumer model with its own Application configuration, screens and unified navigation composition.

A separate Agent.Workbench Application repository is not required by the current architecture.

BuildInfo and the App Information screen are now part of the implemented architecture.

The current BuildInfo model exposes the Application version, Template version, release tag and build timestamp. Human-readable release notes and optional commit-derived release-note generation remain planned topics.

**---**

**# 1. Current Repository State**

The \`web.template\` repository currently contains three architectural responsibility areas:

\`\`\`text

src/

├── core/

├── template/

└── application/

\`\`\`

Conceptually:

\`\`\`text

Concrete Application

        |

        v

Base Template

        |

        v

Core

\`\`\`

The current \`src/application/\` directory is the in-repository Agent.Workbench Application composition of \`web.template\`.

It demonstrates how a concrete Application can:

\- provide Application identity and metadata

\- provide Application branding

\- provide Application theme overrides

\- select reusable Template features

\- provide Application-specific navigation

\- optionally enable navigation icons

\- provide Application-specific screens

\- provide Application-owned assets

\- provide Application translations

\- optionally provide Application-specific Redux state

The current in-repository Application composition is configured with Agent.Workbench identity.

Agent.Workbench standard functionality itself is intentionally owned by Template.

The separate \`web.plantAssist\` repository provides the first validated external consumer of this architecture.

The separate \`web.hems\` repository is now also an active concrete consumer and validates the same integration contract with HEMS-specific configuration, screens and unified navigation.

**---**

**# 2. Current Dependency Model**

The implemented dependency direction is:

\`\`\`text

Application

    |

    v

Template

    |

    v

Core

\`\`\`

The dependency direction must not be reversed.

**## Core**

Core contains reusable technical capabilities.

Core must not depend on Template.

Core must not depend on Application.

\`\`\`text

Core -X-> Template

Core -X-> Application

\`\`\`

**## Template**

Template contains the reusable application platform.

Template may depend on Core.

Template must not depend on a concrete Application.

\`\`\`text

Template ---> Core

Template -X-> Application

\`\`\`

Template owns reusable platform functionality including:

\- application bootstrap

\- reusable React application shell

\- Agent.Workbench standard functionality

\- Agent.Workbench state

\- reusable Agent.Workbench API integration where appropriate

\- authentication and session orchestration

\- server selection

\- navigation infrastructure

\- Template navigation definitions

\- settings

\- update orchestration

\- design system

\- notifications

\- reusable screens

\- Template screen registry

\- Template feature definitions

\- reusable Redux infrastructure

\- localization infrastructure

\- configuration and discovery generators used by Applications

**## Application**

Application is the concrete composition root.

Application may consume the supported integration surfaces provided by Template and Core.

Application owns:

\- Application identity and metadata

\- Application branding and assets

\- Application theme overrides

\- semantic Template feature selection

\- Application-specific navigation

\- Application navigation presentation options

\- Application-specific screens

\- Application-specific translations

\- optional Application-specific Redux state

\- concrete product composition

\- product-specific behavior

\- product version

\- product build and release configuration

The Template must not need to know which concrete Application is consuming it.

**---**

**# 3. Current Core Structure**

The currently established top-level Core areas include:

\`\`\`text

src/core/

├── authentication/

├── runtime/

├── server/

└── update/

\`\`\`

Core contains reusable technical functionality.

Core is not the reusable React application platform.

React application-shell functionality remains in Template.

Core does not own:

\- concrete product composition

\- Application configuration

\- Agent.Workbench composition

\- Template navigation

\- Template UI orchestration

Agent.Workbench standard functionality belongs to Template.

Concrete product functionality belongs to Application.

**---**

**# 4. Core Authentication**

Reusable technical authentication capabilities exist under:

\`\`\`text

src/core/authentication/

\`\`\`

Known files include:

\`\`\`text

src/core/authentication/

├── types.ts

├── http/

│   └── attachAuthInterceptors.tsx

├── jwt/

│   └── jwtTime.ts

└── logout/

    └── logoutFlowGuard.ts

\`\`\`

Core authentication is responsible for reusable technical authentication behavior.

Reusable session orchestration and authentication UI remain Template responsibilities.

The separation is therefore:

\`\`\`text

Core

└── technical authentication capabilities

Template

└── reusable authentication/session orchestration and UI

Application

└── product-specific composition

\`\`\`

**---**

**# 5. Core Runtime**

Reusable technical runtime functionality exists under:

\`\`\`text

src/core/runtime/

\`\`\`

Runtime ownership follows the general architecture rule:

\`\`\`text

technical runtime capability

    --> Core

reusable application orchestration

    --> Template

product-specific runtime behavior

    --> Application

\`\`\`

Core runtime functionality must remain independent from concrete Applications and from Template UI composition.

**---**

**# 6. Core Server Infrastructure**

Reusable technical server infrastructure exists under:

\`\`\`text

src/core/server/

\`\`\`

Core server responsibilities include reusable technical behavior such as:

\- server normalization

\- server validation

\- technical server checks

\- server-environment detection

\- reusable backend information parsing

\- technical server types

Higher-level server behavior remains outside Core.

The ownership boundary is:

\`\`\`text

Core

├── technical server capabilities

└── reusable backend/server logic

Template

├── server-selection UI

├── server orchestration

└── reusable server-related state

Application

└── product-specific server configuration where required

\`\`\`

**---**

**# 7. Core Update Infrastructure**

Reusable technical update capabilities exist under:

\`\`\`text

src/core/update/

\`\`\`

Core update functionality is limited to reusable technical helpers and infrastructure.

Higher-level reusable update behavior belongs to Template, including where applicable:

\- update state

\- update hooks

\- update watchers

\- update dialogs

\- update notifications

\- update orchestration

Concrete product-specific update behavior belongs to Application only when it is actually product-specific.

Application release metadata and product versioning remain consumer responsibilities.

**---**

**# 8. Current Template Responsibilities**

Template provides the reusable Base Template platform.

Its responsibilities include:

\`\`\`text

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

\`\`\`

Agent.Workbench is intentionally represented here.

It is not treated as transitional product code.

Standard Agent.Workbench functionality belongs to the Base Template because it is part of the reusable platform delivered by \`web.template\`.

**---**

**# 9. Agent.Workbench Ownership**

The current architecture explicitly defines Agent.Workbench standard functionality as Template-owned.

This includes reusable Agent.Workbench functionality such as:

\`\`\`text

Program Start

Data Analyzing

Database configuration

Server configuration

Live Console

Settings

Update infrastructure

Agent.Workbench state

\`\`\`

The exact internal organization can evolve, but the ownership boundary is established:

\`\`\`text

Agent.Workbench standard functionality

    --> Template

\`\`\`

Agent.Workbench functionality must therefore not be documented as:

\`\`\`text

transitional Application code

future Agent.Workbench Application code

code waiting to be moved into an Agent.Workbench repository

\`\`\`

A separate Agent.Workbench Application repository is not part of the current architecture.

**## Current Live Console Composition**

The reusable Live Console is Template-owned Agent.Workbench functionality.

The normal navigation entry currently exposes two tabs:

\`\`\`text

Live Console

├── Console

└── Files

\`\`\`

The \`Console\` tab keeps the existing WebSocket-based live-console behavior.

The \`Files\` tab provides access to persisted backend log files.

The persisted-log workflow uses the Agent.Workbench REST API:

\`\`\`text

GET /logs

GET /logs/archive?from=<YYYY-MM-DD>&to=<YYYY-MM-DD>

\`\`\`

\`GET /logs\` returns the available persisted log dates.

\`GET /logs/archive\` returns a ZIP archive for the selected date range.

The frontend uses the existing centrally configured Agent.Workbench \`AdminsApi\`.

It must not create a separate API client or duplicate authentication or server configuration for this feature.

Persisted log state is intentionally separated from the live WebSocket console state:

\`\`\`text

liveConsoleSlice

    --> WebSocket live-console state

logFilesSlice

    --> persisted log discovery and archive download state

\`\`\`

The persisted-log feature must not replace or redefine the existing \`/eventLog\` functionality.

\`/eventLog\` remains a separate structured event-log API.

The embedded Live Console used by the Developer Console remains the pure console view.

It does not render the \`Files\` tab.

This preserves the distinction between:

\`\`\`text

navigation-level Live Console

    --> Console + Files tabs

embedded Developer Console

    --> Console only

\`\`\`

**---**

**# 10. Template Application Contract**

The reusable Application integration layer exists under:

\`\`\`text

src/template/application/

\`\`\`

Known files include:

\`\`\`text

ApplicationConfig.ts

ApplicationConfigContext.tsx

createTemplateApp.tsx

TemplateApp.tsx

\`\`\`

These files implement the integration boundary between a concrete Application and the Base Template.

Conceptually:

\`\`\`text

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

\`\`\`

The Application supplies concrete composition.

Template supplies the reusable application platform.

**---**

**# 11. Application Configuration Model**

Developer-facing Application configuration must not require developers to edit TypeScript, TSX or generated runtime files.

The current developer-facing configuration source is:

\`\`\`text

src/application/config/

├── application.properties

├── features.properties

└── navigation.properties

\`\`\`

The responsibilities are:

\`\`\`text

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

\`\`\`

Application branding and theme customization are part of the supported Application configuration contract.

Examples include:

\`\`\`properties

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

\`\`\`

Concrete Applications may customize their visual identity without modifying Template theme source files.

Empty theme properties preserve the Base Template defaults.

The old configuration names are no longer part of the current architecture:

\`\`\`text

menu.properties

tabs.properties

featureFlags.properties

\`\`\`

Documentation must not present these old files as active configuration.

Generated TypeScript may exist as runtime or build output, but it is not the developer-facing configuration format.

**---**

**# 12. Semantic Feature Configuration**

Concrete Applications enable or disable reusable Template capabilities semantically.

Examples include:

\`\`\`properties

feature.notifications.enabled=true

feature.appearance.enabled=true

feature.serverSettings.enabled=true

feature.liveConsole.enabled=true

feature.programStart.enabled=true

feature.dataAnalyzing.enabled=true

feature.database.general.enabled=true

\`\`\`

Applications select capabilities.

Applications do not reproduce the internal navigation implementation of those capabilities.

Template remains responsible for:

\- internal menu IDs

\- internal parent IDs

\- Template screen registry keys

\- authentication visibility

\- runtime visibility rules

\- Agent.Workbench navigation definitions

\- Template navigation structure

This keeps the Application configuration stable even when Template internals change.

**---**

**# 13. Application-Owned Navigation**

Application-specific navigation is configured through:

\`\`\`text

src/application/config/navigation.properties

\`\`\`

The supported navigation root modes are:

\`\`\`text

split

unified

\`\`\`

When \`NavigationRootMode\` is omitted, the default is:

\`\`\`text

split

\`\`\`

Split mode keeps Application navigation and reusable Template Settings navigation as separate roots where required by the concrete product.

Conceptually:

\`\`\`text

Application Root             Settings Root

├── Application Menu         ├── Notifications

└── Application Menu         ├── System Settings

                             └── Personal Settings

\`\`\`

Unified mode composes Application navigation and the direct children of Template Settings below the semantic Application root:

\`\`\`properties

NavigationRootMode=unified

menu.applicationRoot.enabled=true

menu.applicationRoot.caption=application

menu.applicationRoot.position=1

menu.applicationRoot.screen=home-screen

menu.home.enabled=true

menu.home.caption=home

menu.home.parent=applicationRoot

menu.home.position=1

menu.home.screen=home-screen

\`\`\`

The semantic Application root is:

\`\`\`text

applicationRoot

\`\`\`

Concrete Applications may reference \`applicationRoot\` as part of the public Application navigation contract.

The internal Template key:

\`\`\`text

settings

\`\`\`

is not a required Application-facing contract key.

In unified mode, the visible Template Settings root itself is not materialized as an additional root.

Its direct children are composed below \`applicationRoot\`, while deeper Template-owned navigation remains unchanged.

For example:

\`\`\`text

Application Root

├── Home

├── Project Setup

├── Notifications

├── System Settings

└── Personal Settings

\`\`\`

Application navigation configuration therefore describes product-owned structure semantically without reproducing internal Template navigation IDs.

Internal numeric menu IDs are generated or managed internally.

The \`position\` of a custom Application menu remains optional.

Menu icons are also optional.

\`NavigationMenuIconsEnabled\` controls whether configured navigation icons are rendered for the concrete Application.

Detailed root-composition behavior is documented in:

\`\`\`text

doc/architecture/application-navigation.md

\`\`\`

**---**

**# 14. Template Navigation Ownership**

Reusable Template navigation definitions remain inside Template.

Applications do not duplicate standard Agent.Workbench menu definitions.

The relationship is:

\`\`\`text

Template navigation

    +

Application navigation extensions

    |

    v

runtime navigation

\`\`\`

Template owns reusable navigation structure.

Application owns product-specific composition and may choose the supported root composition mode.

In unified mode, Template resolves its internal Settings root into the semantic Application root without exposing internal numeric IDs or requiring the Application to reproduce Template navigation definitions.

Template menu definitions may provide reusable icons, but icon rendering remains controlled by the concrete Application configuration.

Template tabs may additionally define reusable layout metadata.

The currently supported tab layout modes are:

\`\`\`text

default

wide

\`\`\`

\`default\` keeps the normal Template content-width constraint.

\`wide\` allows a tab screen to use the complete available screen content width while retaining the standard responsive margins and scrolling behavior.

The layout metadata follows the normal Template navigation generation path:

\`\`\`text

Template navigation catalog
        |
        v
Application configuration generator
        |
        v
StaticTabItem
        |
        v
TabScreen
        |
        v
Screen

\`\`\`

The current Live Console tabs use:

\`\`\`text

layout: wide

\`\`\`

because persisted log tables and console content benefit from the additional horizontal space.

This is Template-owned navigation and presentation metadata.

Concrete Applications do not need to know the internal Live Console menu ID or reproduce this layout configuration.

**---**

**# 15. Template Menu Ordering**

Template menu ordering is derived automatically from the order of sibling entries in the Template menu catalog.

Normal Template menu items therefore do not require manually maintained numeric positions.

Application custom menu positions remain optional.

The MenuHub fallback for items without an explicit position is:

\`\`\`ts

Number.MAX_SAFE_INTEGER

\`\`\`

The relevant runtime sorting behavior remains position-based.

In unified mode, direct Application children keep their configured positions.

Direct children of Template Settings are then offset after the direct Application children.

For example:

\`\`\`text

Home                 position 1

Project Setup        position 2

Notifications        position 3

System Settings      position 4

Personal Settings    position 5

\`\`\`

The Application configuration generator orders the generated menu collection by position before materializing runtime configuration.

This ensures that unified navigation remains deterministic even though Template-owned and Application-owned entries are composed from different sources.

Deeper Template navigation keeps its own parent relationships and is not flattened by unified mode.

The relevant runtime menu presentation is located in:

\`\`\`text

src/template/screens/menu/MenuHubScreen.tsx

\`\`\`

**---**

**# 16. Automatic Application Screen and Asset Discovery**

Application-owned screens are discovered automatically.

The discovery implementation exists at:

\`\`\`text

src/template/config/build/applicationScreenDiscovery.mjs

\`\`\`

Navigable Application screen files follow the \`\*Screen.tsx\` convention.

The named export must match the file base name.

Screen file names are converted into runtime screen keys.

Examples:

\`\`\`text

ExampleScreen.tsx

    --> example-screen

ExampleScreen2.tsx

    --> example-screen2

PlantAssistScreen.tsx

    --> plant-assist-screen

\`\`\`

The generated registry is:

\`\`\`text

src/application/generated/applicationScreenRegistry.generated.ts

\`\`\`

Concrete Applications therefore do not need to manually import and register every Application screen.

Application asset discovery follows the same principle.

Application-owned assets are placed under:

\`\`\`text

src/application/assets/

\`\`\`

The current asset discovery supports the Application asset formats handled by the build discovery implementation, including common PNG, JPG/JPEG and WebP image assets.

Discovered assets are exposed through:

\`\`\`text

src/application/generated/applicationAssets.generated.ts

\`\`\`

Application branding can reference discovered assets through semantic keys, for example:

\`\`\`properties

ApplicationLogo=flexaqua

\`\`\`

Concrete Applications therefore do not need to manually wire supported branding assets into Template source code.

**---**

**# 17. Current Application Structure**

A concrete Application follows the current structure conceptually as:

\`\`\`text

src/application/

├── index.ts

├── assets/

├── config/

│   ├── application.properties

│   ├── features.properties

│   └── navigation.properties

├── generated/

│   ├── applicationAssets.generated.ts

│   ├── applicationConfig.generated.ts

│   ├── applicationScreenRegistry.generated.ts

│   └── applicationTheme.generated.ts

├── i18n/

├── screens/

└── state/

    └── applicationReducers.ts

\`\`\`

The Application layer may therefore own:

\- branding assets

\- Application identity

\- Application metadata

\- theme overrides

\- navigation extensions

\- navigation presentation options

\- Application screens

\- Application translations

\- optional Application-specific state

Inside \`web.template\`, \`src/application/\` provides the Agent.Workbench composition used to validate this contract.

Inside \`web.plantAssist\`, the same contract is consumed by a separate concrete product repository.

Reusable Template functionality must not be moved into Application merely to make the directory structure appear more separated.

**---**

**# 18. Generated Application Configuration**

Developer-facing \`.properties\` files and Application-owned discovery sources are transformed into generated runtime artifacts.

Conceptually:

\`\`\`text

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

\`\`\`

The current generation lifecycle therefore covers more than navigation and feature configuration.

It also materializes:

\- Application configuration

\- Application screen discovery

\- Application asset discovery

\- branding integration

\- Application theme overrides

The developer-facing source remains the supported \`.properties\` configuration and Application-owned files.

Generated TypeScript remains an implementation detail and must not become the primary configuration interface.

**---**

**# 19. Application Composition Root**

Application is the composition root.

The current runtime composition follows the principle:

\`\`\`text

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

\`\`\`

Template does not select between concrete products.

Instead, each concrete Application composes itself with the Base Template.

This is an important dependency rule:

\`\`\`text

Template does not select Application.

Application selects and configures Template.

\`\`\`

**---**

**# 20. No Runtime Multi-Application Resolver**

The architecture does not require Template to contain a runtime resolver that chooses between Plant Assist, HEMS, Agent.Workbench or other products.

A concrete Application has its own composition and build.

The implemented consumer example is:

\`\`\`text

Plant Assist Application Repository

        |

        v

Base Template

        |

        v

Core

\`\`\`

Agent.Workbench is not shown as a separate Application repository because its standard functionality is part of the Base Template itself.

HEMS now follows the same consumer model as Plant Assist through the separate `web.hems` repository. Future Applications can use the same composition model.

**---**

**# 21. Current Redux Ownership**

Template owns the reusable Redux infrastructure.

Reusable Redux infrastructure exists under:

\`\`\`text

src/template/state/

\`\`\`

Store infrastructure is located under:

\`\`\`text

src/template/state/store/

\`\`\`

Agent.Workbench-specific reusable state is intentionally Template-owned.

The dedicated area is:

\`\`\`text

src/template/state/agent-workbench/

\`\`\`

This ownership is deliberate and is not transitional.

The architecture is:

\`\`\`text

Template-owned reducers

        +

optional Application-owned reducers

        |

        v

runtime Redux store

\`\`\`

Template must not import concrete Application reducers directly.

Application reducers are supplied through the Application integration layer.

The current Live Console implementation keeps live and persisted log state separated.

\`\`\`text

liveConsole
    --> live WebSocket console state

logFiles
    --> persisted log dates, loading state and archive-download state

\`\`\`

The \`logFiles\` reducer belongs to Template because persisted Agent.Workbench log access is reusable Template functionality.

Archive payload data is not stored permanently in Redux.

The download thunk uses the active centrally configured API client and triggers the browser ZIP download after the response is received.

**---**

**# 22. Application-Specific Redux State**

Concrete Applications may provide their own Redux reducers when required.

The Application extension point is:

\`\`\`text

src/application/state/applicationReducers.ts

\`\`\`

The in-repository Agent.Workbench Application composition does not currently require meaningful Application-specific Redux state.

Therefore this registry may remain essentially empty.

This is expected and valid.

It exists as an extension point for concrete Applications that genuinely require product-specific state.

The absence of Application reducers does not mean Redux separation is incomplete.

**---**

**# 23. Agent.Workbench Redux State**

Agent.Workbench state belongs to Template.

Documentation must not describe Agent.Workbench reducers as candidates for extraction into a concrete Application.

The current ownership rule is:

\`\`\`text

reusable Agent.Workbench state

    --> Template

concrete product-only state

    --> Application

\`\`\`

Moving Agent.Workbench state out of Template would contradict the currently selected architecture unless that architecture is explicitly changed in the future.

**---**

**# 24. Redux Boundary Protection**

Application-specific reducers must not silently replace Template-owned reducers.

The Template/Application state integration must preserve reducer ownership boundaries.

Conceptually:

\`\`\`text

Template reducers

        +

Application reducers

        |

        v

validated reducer composition

\`\`\`

Reducer keys owned by Template remain Template-owned.

Concrete Applications extend the store instead of overriding the Base Template state contract.

**---**

**# 25. Current Design System**

Reusable UI infrastructure belongs to Template.

The shared design system exists under:

\`\`\`text

src/template/components/design-system/

\`\`\`

Known groups include:

\`\`\`text

icons/

stylistic/

themed/

ui-elements/

\`\`\`

The design system is reusable application-platform UI and therefore belongs to Template rather than Core.

Core remains focused on reusable technical capabilities.

Application screens should reuse the Template design system where appropriate while remaining free to compose product-specific layouts.

The design system currently also provides a reusable themed date picker:

\`\`\`text

src/template/components/design-system/ui-elements/DatePicker.tsx

\`\`\`

The component provides:

\- ISO date values using \`YYYY-MM-DD\`

\- localized date presentation

\- month navigation

\- a themed calendar popup

\- selected-date presentation

\- current-day presentation

\- optional minimum and maximum dates

\- Light/Dark theme integration

The calendar popup follows the same general overlay pattern as other Template UI elements such as \`Dropdown\`.

It measures its field position and renders the calendar through a modal overlay.

The \`DatePicker\` owns reusable date-selection presentation only.

Feature-specific behavior such as log availability, Redux state, API communication and ZIP downloads remains outside the design-system component.

**---**

**# 26. Current Component Structure**

Reusable Template components include areas such as:

\`\`\`text

src/template/components/design-system/

src/template/components/developer-tools/

src/template/components/dynamic-content/

src/template/components/layout/

src/template/components/localization/

src/template/components/notifications/

src/template/components/rich-text-editor/

\`\`\`

Reusable React components belong to Template unless they are specific to one concrete Application.

Concrete Application-only components should remain Application-owned.

The reusable \`Screen\` layout remains Template-owned and provides shared responsive screen margins and content-width behavior.

Concrete Applications may use it to build responsive screens without duplicating the platform layout shell.

The reusable \`Screen\` layout supports the current layout modes:

\`\`\`text

default
wide

\`\`\`

The default mode keeps \`theme.info.maxContentWidth\`.

The wide mode keeps the same responsive shell behavior while allowing the complete available content width.

**---**

**# 27. Developer Console**

The reusable Developer Console belongs to Template.

The current implementation includes a visible close action in:

\`\`\`text

src/template/components/developer-tools/developer-console/DeveloperConsole.tsx

\`\`\`

The close action uses the Unicode multiplication sign through an explicit Unicode escape:

\`\`\`tsx

{"\u00D7"}

\`\`\`

This avoids source-encoding corruption such as:

\`\`\`text

Ã—

\`\`\`

The close behavior itself remains driven by the existing Developer Console state logic.

The Developer Console embeds the existing Live Console screen directly.

This embedded usage intentionally remains console-only.

The navigation-level \`Console\` / \`Files\` tab composition is owned by \`TabScreen\` and the Template navigation configuration and is therefore not rendered inside the Developer Console overlay.

This prevents persisted-log navigation from being duplicated inside the embedded developer tool.

**---**

**# 28. Authentication Separation**

Authentication follows the general dependency model.

\`\`\`text

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

\`\`\`

This separation is consistent with:

\`\`\`text

Application --> Template --> Core

\`\`\`

**---**

**# 29. Server Separation**

Server functionality is split by responsibility.

\`\`\`text

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

\`\`\`

This allows technical server behavior to remain reusable without placing application UI into Core.

**---**

**# 30. Update Separation**

Update functionality is split by responsibility.

\`\`\`text

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

\`\`\`

Reusable update presentation and orchestration remain Template responsibilities.

The current architecture exposes BuildInfo through the Update area and its App Information presentation.

The implemented BuildInfo model distinguishes Application and Template metadata.

The current information includes:

\`\`\`text

Application version
Template version
release tag
build timestamp

\`\`\`

The Application version is derived from the concrete consumer package metadata.

The Template version is derived from:

\`\`\`text

src/template/config/template.properties

\`\`\`

Release tag and build timestamp may be supplied through the release/build environment.

Commit hashes and Template revision identifiers are intentionally not part of the current App Information UI.

Human-readable release notes and optional commit-derived release-note generation remain planned topics.

**---**

**# 31. File Configuration Functionality**

Reusable file-configuration functionality currently belongs to the Template platform where it is shared application behavior.

Relevant Template areas include:

\`\`\`text

src/template/screens/settings/

src/template/hooks/

src/template/state/settings/

src/template/components/design-system/

\`\`\`

Concrete product-specific file behavior should only move into Application when it is genuinely specific to that product.

The architecture must not move functionality solely to make directory ownership appear more separated.

Ownership is based on responsibility and reuse.

**---**

**# 32. Configuration Generation Lifecycle**

Application configuration generation is part of the normal development lifecycle.

The explicit generation command is:

\`\`\`text

npm run config\:generate

\`\`\`

The generation lifecycle currently includes:

\- parsing Application \`.properties\`

\- semantic feature configuration

\- Application navigation generation

\- NavigationRootMode validation and split/unified root composition

\- unified Application/Template menu ordering

\- Template tab layout metadata generation

\- Application screen discovery

\- Application asset discovery

\- Application branding materialization

\- Application theme override generation

Normal validation should ensure generated Application artifacts match the developer-facing configuration and Application-owned source files.

Generated files are implementation artifacts and should not replace the \`.properties\` files as the developer-facing configuration interface.

**---**

**# 33. Build and Consumer Responsibility**

\`web.template\` provides the reusable Base Template and the in-repository Agent.Workbench Application composition used to validate the integration model.

The architecture is now also consumed by separate concrete consumer repositories:

\`\`\`text

web.plantAssist

web.hems

\`\`\`

Plant Assist remains the first separate consumer used to validate independent product build, release and deployment ownership.

HEMS is now also a current concrete consumer and validates the same contract with its own:

\- product metadata

\- \`.properties\` configuration

\- HEMS-specific screens

\- HEMS translations

\- HEMS navigation

\- unified navigation root composition

\- independent Application version

Both consumers remain responsible for their product-specific concerns.

The Base Template remains reusable across concrete products.

This does not imply that Agent.Workbench must be extracted.

Agent.Workbench standard functionality remains Base Template functionality.

Concrete consumer repositories own their own product version, build, release and deployment configuration.

**---**

**# 34. Current Concrete Consumers**

Plant Assist is the first separate concrete consumer repository used to validate the Base Template integration contract.

HEMS is now a second active concrete consumer repository.

Conceptually:

\`\`\`text

Plant Assist           HEMS             future Applications

   current              current

   consumer             consumer

        \                  |                  /

         \                 |                 /

              +------ Base Template ------+

                         |

                         v

                        Core

\`\`\`

Plant Assist currently demonstrates:

\`\`\`text

.properties configuration

branding and assets

theme overrides

Application-specific screens

Application translations

navigation extensions

optional navigation icons

responsive Application screen composition

independent Application versioning

independent build and release workflow

\`\`\`

HEMS currently demonstrates:

\`\`\`text

.properties configuration

HEMS-specific screens

HEMS translations

Application-owned root navigation

NavigationRootMode=unified

semantic applicationRoot composition

Template Settings integration below applicationRoot

independent HEMS Application versioning

\`\`\`

The current HEMS navigation composition is conceptually:

\`\`\`text

HEMS

├── Home

├── Project Setup

├── Notifications

├── System Settings

└── Personal Settings

\`\`\`

The Template-owned deeper Settings hierarchy remains unchanged.

The Base Template continues to provide reusable platform and Agent.Workbench standard functionality.

**---**

**# 35. Repository Model**

The current architectural repository model is:

\`\`\`text

web.template

|

+-- Core

|

+-- Base Template

\|   |

\|   +-- Agent.Workbench standard functionality

\|   +-- reusable navigation

\|   +-- split/unified navigation composition

\|   +-- reusable state infrastructure

\|   +-- authentication/session

\|   +-- server selection

\|   +-- settings

\|   +-- update

\|   +-- design system

\|   +-- notifications

\|   +-- Template screen registry

\|   +-- configuration/discovery generation

|

+-- Agent.Workbench Application composition

\`\`\`

The current separate consumers are:

\`\`\`text

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


web.hems

|

+-- HEMS Application configuration

+-- HEMS navigation

+-- unified applicationRoot composition

+-- HEMS translations

+-- HEMS screens

+-- HEMS Application version

|

+--> consumes Base Template architecture

\`\`\`

The broader consumer model is:

\`\`\`text

                  Base Template

                       ^

                       |

          +------------+------------+

          |            |            |

     Plant Assist     HEMS      future Applications

       current       current

       consumer      consumer

\`\`\`

There is no required separate Agent.Workbench Application repository.

**---**

**# 36. Current Logical Architecture**

The current logical architecture is:

\`\`\`text

+------------------------------------------------------------+

\| Concrete Application / Application composition             |

\|                                                            |

\| application.properties                                     |

\| features.properties                                        |

\| navigation.properties                                      |

\| Application assets                                         |

\| Application branding                                       |

\| Application theme overrides                                |

\| Application navigation presentation                        |

\| Application screens                                        |

\| Application translations                                   |

\| optional Application state                                 |

\| generated Application configuration                        |

\| generated Application screen registry                      |

\| generated Application asset registry                       |

\| generated Application theme overrides                      |

+-----------------------------+------------------------------+

                              |

                              v

+------------------------------------------------------------+

\| Base Template                                              |

\|                                                            |

\| TemplateApp                                                |

\| createTemplateApp                                          |

\| ApplicationConfig contract                                 |

\| React application shell                                    |

\| navigation infrastructure                                  |

\| Template menu catalog                                      |

\| Template screen registry                                   |

\| feature definitions                                        |

\| authentication/session orchestration                       |

\| server selection                                           |

\| settings                                                   |

\| notifications                                              |

\| update orchestration                                       |

\| Redux infrastructure                                       |

\| Agent.Workbench standard functionality                     |

\| Agent.Workbench state                                      |

\| design system                                              |

\| reusable components/screens/hooks                          |

\| configuration/discovery generation                         |

+-----------------------------+------------------------------+

                              |

                              v

+------------------------------------------------------------+

\| Core                                                       |

\|                                                            |

\| authentication                                             |

\| runtime                                                    |

\| server                                                     |

\| update                                                     |

\| reusable technical capabilities                            |

+------------------------------------------------------------+

\`\`\`

This diagram represents the implemented architectural responsibility model.

**---**

**# 37. Architecture Invariants**

The following rules must remain true:

\`\`\`text

Application --> Template --> Core

\`\`\`

Core must not import Template.

Core must not import Application.

Template must not import a concrete Application.

Applications should consume supported public integration surfaces rather than reaching into Template internals.

Template owns standard Agent.Workbench functionality.

Applications own concrete product composition.

Developer-facing Application configuration uses \`.properties\`.

Applications must not reproduce Template internal navigation IDs or visibility rules.

The supported navigation root modes are `split` and `unified`.

`split` remains the default when `NavigationRootMode` is omitted.

`applicationRoot` is the semantic Application navigation root used by unified composition.

Concrete Applications should not depend on the internal Template `settings` root.

Application screens are automatically discovered.

Supported Application assets are automatically discovered.

Application-specific Redux state remains optional.

Application branding must not require modifications to Template source files.

Application theme customization must be provided through supported Application configuration rather than by editing Template theme defaults.

Application navigation icons are optional and Application-controlled.

Template tab layout metadata remains Template-owned.

Live WebSocket console state and persisted log-file state remain separate.

Application-owned assets must remain outside reusable Template ownership.

Concrete consumer repositories own their own Application version, build and release process.

Generated TypeScript remains implementation output rather than the developer-facing configuration format.

**---**

**# 38. Dependency Validation**

Useful architecture checks include:

\`\`\`text

git grep -n "@/application/" -- src/template

\`\`\`

Template must not import concrete Application implementation.

Internal Template imports from Application should therefore remain absent.

Application code should consume supported public integration APIs instead of Template internal paths where a supported surface exists.

A useful check is:

\`\`\`text

git grep -n "@/template/" -- src/application

\`\`\`

Unexpected direct Template-internal imports should be reviewed and replaced by supported public APIs where appropriate.

**---**

**# 39. Current Validation Expectations**

Before architecture documentation or implementation changes are committed, the current validation sequence should include where applicable:

\`\`\`text

npm run config\:generate

npx tsc --noEmit

npm test -- --runInBand

git diff --check

git status --short

\`\`\`

Architecture dependency checks should also be performed where relevant.

For generated files, line-ending-only changes should be distinguished from real generated content changes before committing.

Changes should remain small and reviewable.

Large automated rewrites across unrelated files should be avoided.

**---**

**# 40. Current Stability Status**

The major Base Template/Application ownership decisions are established.

Known presentation and architecture improvements completed in the current state include:

\`\`\`text

Drawer/MenuHub ordering consistency

Developer Console close-button encoding

Application screen discovery

Application asset discovery

Application branding

Application theme overrides

optional navigation icons

split/unified navigation root composition

semantic applicationRoot support

generated unified menu ordering

responsive navigation width improvements

responsive Application screen composition

wide Template tab layout support

Live Console Console/Files tab composition

persisted log discovery through /logs

persisted log ZIP download through /logs/archive

separate liveConsole and logFiles Redux state

themed reusable DatePicker

Application/Template BuildInfo

App Information presentation

separate Plant Assist consumer validation

independent Plant Assist build and release

\`\`\`

The Base Template integration contract has now been validated by the in-repository Application composition and by the separate \`web.plantAssist\` and \`web.hems\` consumer repositories.

Plant Assist remains the first independent consumer used to validate build and release ownership.

HEMS now validates the same consumer contract with unified navigation and HEMS-owned screens and configuration.

The next architectural topics are planned rather than implemented:

\`\`\`text

human-readable release notes / changelog metadata

optional commit-derived release-note generation

future notification refinements

further automation of consumer Application creation

\`\`\`

These planned topics should build on the existing ownership model rather than reopening the established Application/Template/Core separation.

**---**

**# 41. Documentation Rules**

Architecture documentation must describe the current selected architecture consistently.

The following statements are incorrect and must not be reintroduced:

\`\`\`text

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

"HEMS is only a future consumer."

"Applications must use the internal Template settings key as their navigation parent."

\`\`\`

The correct model is:

\`\`\`text

Agent.Workbench standard functionality

    --> Base Template

Plant Assist

    --> current concrete Application consumer

HEMS

    --> future concrete Application consumer

\`\`\`

The current Application configuration files are:

\`\`\`text

application.properties

features.properties

navigation.properties

\`\`\`

Current generated Application artifacts include:

\`\`\`text

applicationConfig.generated.ts

applicationScreenRegistry.generated.ts

applicationAssets.generated.ts

applicationTheme.generated.ts

\`\`\`

Generated artifacts must not be documented as developer-facing configuration sources.

**---**

**# 42. Current Architecture Summary**

The current architecture is established as:

\`\`\`text

Application --> Template --> Core

\`\`\`

Core owns reusable technical capabilities.

Template owns the reusable application platform.

Agent.Workbench standard functionality is intentionally part of Template.

Application owns concrete product composition.

The in-repository Agent.Workbench Application composition validates the Application integration contract inside \`web.template\`.

\`web.plantAssist\` and \`web.hems\` additionally validate the same contract as separate consumer repositories.

Developer-facing Application configuration is properties-based.

Template owns internal feature and navigation implementation details.

Applications select reusable Template capabilities semantically.

Application screens and supported Application assets are discovered automatically.

Applications may provide their own branding and theme overrides without modifying reusable Template theme definitions.

Navigation icons are optional and may be enabled by the concrete Application.

Navigation root composition supports `split` and `unified` modes.

`split` is the default.

Unified navigation composes Template Settings children below the semantic `applicationRoot` without exposing internal Template numeric IDs.

Template owns reusable Redux infrastructure and Agent.Workbench state.

The navigation-level Live Console provides separate Console and Files tabs.

Persisted log dates and ZIP archive downloads use the centrally configured Agent.Workbench API integration.

The embedded Developer Console remains console-only.

The Template design system includes the reusable themed DatePicker.

Application-specific Redux state remains optional.

Concrete consumer repositories own their own product version, build, release and deployment configuration.

Plant Assist is the first current separate consumer and has successfully validated the consumer model through an MVP release.

HEMS is now also a current separate consumer and validates the model with HEMS-specific configuration, screens and unified navigation.

There is no planned separate Agent.Workbench Application repository under the current architecture.

BuildInfo, App Information and Application-versus-Template version presentation are implemented. Human-readable release-note metadata and optional release-note automation remain planned next steps.

The next architectural work should build on these ownership boundaries rather than reopening the already decided Base Template versus Agent.Workbench separation.
