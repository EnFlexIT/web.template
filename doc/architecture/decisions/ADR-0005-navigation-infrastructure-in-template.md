# ADR-0005

## Title

Place Navigation Infrastructure and Standard Navigation in Template

---

## Status

Accepted

---

## Context

ADR-0004 separated reusable menu infrastructure from concrete Application menu configuration.

ADR-0004 originally assigned the reusable menu engine to Core.

The platform architecture was later clarified as:

```text id="1q8mjp"
Application --> Template --> Core
```

Core contains focused technical capabilities and must not own React application-shell infrastructure.

Navigation depends on application-platform concerns such as:

* menus
* routing
* screen composition
* React presentation
* visibility integration
* authentication/runtime context
* Template screen registration
* reusable navigation state
* standard Agent.Workbench navigation

These responsibilities belong to Template.

The Application layer should only provide concrete Application-specific navigation extensions.

---

## Decision

Reusable navigation infrastructure belongs to Template.

Standard Base Template navigation also belongs to Template.

Application provides only Application-specific navigation extensions.

The ownership model is:

```text id="9n1bs8"
Application
|
+-- Application-specific navigation extensions
+-- Application-specific screens
+-- Application-specific screen references
+-- optional Application-specific ordering
        |
        v
Template
|
+-- navigation infrastructure
+-- routing
+-- menu rendering
+-- menu tree construction
+-- Template navigation definitions
+-- Template screen registry
+-- authentication/runtime visibility integration
+-- standard Agent.Workbench navigation
+-- Template menu ordering
        |
        v
Core
|
+-- reusable technical capabilities
+-- no React navigation ownership
```

Template must not import concrete Application screens.

Application must not define or duplicate the complete Template navigation tree.

---

## Template Navigation Ownership

Template owns reusable navigation behavior and reusable navigation definitions.

This includes:

```text id="63lmby"
routing infrastructure
menu rendering
menu tree construction
path calculation
Template menu definitions
Template screen registry
visibility integration
authentication/runtime integration
standard Agent.Workbench navigation
Template menu ordering
```

Template is the owner of standard Agent.Workbench navigation because standard Agent.Workbench functionality belongs to the Base Template.

---

## Agent.Workbench Navigation

Standard Agent.Workbench navigation is intentionally Template-owned.

The ownership decision is:

```text id="t89ulo"
Agent.Workbench standard navigation
    -> Template
```

This includes navigation for standard Template-owned functionality such as:

```text id="b8iuyf"
Program Start
Data Analyzing
Database configuration
Server configuration
Live Console
Settings
```

Agent.Workbench is the current in-repository Application identity/composition, but it is not modeled as a separate consumer Application repository.

Therefore standard Agent.Workbench navigation must not be extracted into a separate Application navigation configuration.

---

## Application Navigation Ownership

Application owns only concrete Application-specific navigation extensions.

Examples include:

```text id="37l2ym"
Application-specific menu entries
Application-specific screen references
Application-specific captions
optional custom ordering
Application-specific navigation metadata
```

Applications do not own:

```text id="ag4z7v"
Template navigation infrastructure
Template navigation definitions
Agent.Workbench standard navigation
Template internal numeric menu IDs
Template screen registry implementation
authentication visibility rules
runtime visibility rules
```

---

## Application Navigation Configuration

Developer-facing Application navigation configuration uses:

```text id="dyf9um"
src/application/config/navigation.properties
```

Example:

```properties id="mqij5g"
menu.example.enabled=true
menu.example.caption=exampleApplication
menu.example.parent=settings
menu.example.position=99
menu.example.screen=example-screen
```

Conceptually:

```text id="2qczo8"
navigation.properties
        |
        v
configuration generation
        |
        v
Application navigation extension
        |
        v
Template navigation
        |
        v
runtime navigation
```

Application navigation extends Template navigation.

It does not replace it.

---

## Semantic Feature Selection

Whether reusable Template functionality is enabled is configured separately from navigation structure.

Developer-facing feature configuration uses:

```text id="v5w4qr"
src/application/config/features.properties
```

Examples:

```properties id="1181ir"
feature.notifications.enabled=true
feature.appearance.enabled=true
feature.serverSettings.enabled=true
feature.liveConsole.enabled=true
feature.programStart.enabled=true
feature.dataAnalyzing.enabled=true
feature.database.general.enabled=true
```

Application selects reusable Template capabilities semantically.

Template owns the navigation implementation and internal visibility behavior.

---

## No Internal Template IDs in Application Configuration

Application configuration must not depend on Template-internal numeric IDs.

Applications should use semantic identifiers such as:

```text id="dxj354"
settings
example-screen
```

rather than internal implementation details.

The architectural rule is:

```text id="qhu19s"
Application describes intent.

Template resolves implementation details.
```

This keeps Application configuration stable when Template internals evolve.

---

## Automatic Application Screen Discovery

Application-specific screens belong to Application.

They are discovered automatically rather than manually imported into Template.

Relevant implementation:

```text id="q4qflz"
src/template/config/build/applicationScreenDiscovery.mjs
```

Examples:

```text id="x693uv"
ExampleScreen.tsx
    -> example-screen

ExampleScreen2.tsx
    -> example-screen2

HemsOverviewScreen.tsx
    -> hems-overview-screen
```

The generated registry is:

```text id="yv0d7c"
src/application/generated/applicationScreenRegistry.generated.ts
```

Template must not manually register concrete Application screen implementations.

---

## Template Screen Registry

Template owns registration of reusable Template screens.

This includes standard Agent.Workbench screens.

Application-specific screens remain outside the Template screen registry implementation and are integrated through the Application screen-discovery mechanism.

Conceptually:

```text id="fapbzm"
Template screen registry
        +
generated Application screen registry
        |
        v
runtime screen resolution
```

---

## Menu Ordering

Template menu ordering is owned by Template.

Normal Template entries derive their ordering from sibling order in the Template menu catalog.

They do not require manually maintained numeric positions.

Application-specific menu entries may optionally provide:

```text id="85qt6d"
position
```

When a position is absent, the MenuHub ordering fallback uses:

```ts id="yq4g2o"
Number.MAX_SAFE_INTEGER
```

Relevant implementation:

```text id="otvlph"
src/template/screens/menu/MenuHubScreen.tsx
```

This keeps ordering behavior deterministic while allowing Application extensions.

---

## Visibility Ownership

Visibility must follow responsibility.

Template owns visibility based on reusable runtime context such as:

```text id="l9d79r"
authentication
session state
server availability
Template feature state
runtime capability
standard Agent.Workbench visibility
```

Application may influence navigation through semantic Application configuration.

Applications must not duplicate Template visibility rules.

---

## Dynamic Navigation

Dynamic navigation data received from backend services may participate in runtime navigation integration.

Its ownership depends on responsibility.

The same general rule applies:

```text id="zrpo4d"
reusable navigation orchestration
    -> Template

technical backend communication
    -> Core where appropriate

concrete product-only navigation behavior
    -> Application
```

Dynamic behavior does not justify moving React navigation infrastructure into Core.

---

## Relationship to ApplicationConfig

`ApplicationConfig` remains part of the Application/Template integration contract.

However, Application developers should use the supported developer-facing configuration model:

```text id="i89r9y"
application.properties
features.properties
navigation.properties
```

Generated runtime configuration may flow through `ApplicationConfig`.

This does not mean developers manually configure complete menus or tabs through TypeScript.

Generated TypeScript is implementation output.

---

## Legacy Configuration Names

The following configuration names are not part of the current architecture:

```text id="to47m8"
menu.properties
tabs.properties
featureFlags.properties
menuFeatureFlags.properties
tabFeatureFlags.properties
```

They must not be reintroduced as active or planned navigation configuration.

The current configuration model is:

```text id="wgq5nt"
application.properties
features.properties
navigation.properties
```

---

## No Separate Tab Ownership Model

The current architecture does not require Application-owned `tabs.properties` or a separate tab feature-flag system.

Tabs that are part of reusable Template functionality remain Template-owned.

Concrete Application navigation should use the supported navigation extension mechanism.

A separate tab configuration model must not be reintroduced without a new architecture decision.

---

## No Agent.Workbench Extraction

Standard Agent.Workbench navigation is not transitional.

The following is not part of the accepted architecture:

```text id="zssif0"
move Agent.Workbench menu definitions into Application
move Agent.Workbench screens into Application
create Agent.Workbench navigation.properties
create an Agent.Workbench Application repository
register Agent.Workbench navigation as Application-owned configuration
```

The current architecture intentionally keeps standard Agent.Workbench navigation in Template.

---

## Consequences

### Advantages

* Core remains focused on technical capabilities.
* React navigation infrastructure has a clear owner.
* Template owns reusable navigation and standard Agent.Workbench navigation.
* Applications only define their own extensions.
* Template internals remain hidden from Application configuration.
* Applications do not depend on numeric Template menu IDs.
* Application screens do not need manual imports inside Template.
* Application navigation configuration remains simple.
* semantic feature selection is separated from navigation internals.
* future Applications can extend the Base Template without reproducing its navigation tree.
* Drawer and MenuHub can share consistent Template ordering behavior.

### Tradeoffs

* Template intentionally contains standard Agent.Workbench navigation.
* navigation configuration generation must remain synchronized with Template contracts.
* Application extension points must remain stable.
* navigation ownership must be determined by responsibility rather than by screen naming.
* product-specific extensions and reusable Template navigation must remain clearly separated.

---

## Rejected Alternative: Navigation Infrastructure in Core

ADR-0004 originally assigned reusable menu infrastructure to Core.

That model is rejected because React navigation infrastructure is application-platform behavior.

The accepted ownership is:

```text id="m1csfa"
Template
    -> navigation infrastructure

Core
    -> reusable technical capabilities
```

---

## Rejected Alternative: Complete Navigation in Application

The following model is not accepted:

```text id="y7ec0g"
Application
|
+-- complete menu tree
+-- complete tab tree
+-- Agent.Workbench navigation
+-- Template visibility rules
+-- Template screen registrations
```

It would duplicate Template knowledge and expose Template implementation details to concrete Applications.

Applications therefore provide extensions, not the complete navigation model.

---

## Rejected Alternative: Agent.Workbench as Application Navigation

Standard Agent.Workbench navigation must not be treated as concrete Application navigation.

Rejected:

```text id="wf05eh"
Agent.Workbench navigation
    -> Application
```

Accepted:

```text id="iatjy5"
Agent.Workbench navigation
    -> Template
```

---

## Rejected Alternative: Manual Screen Imports

Template must not manually import concrete Application screen implementations.

The accepted model uses automatic screen discovery and generated Application screen registration.

---

## Architecture Rules

This ADR establishes the following rules:

1. The dependency direction remains:

   ```text
   Application --> Template --> Core
   ```

2. Reusable React navigation infrastructure belongs to Template.

3. Template navigation definitions belong to Template.

4. Standard Agent.Workbench navigation belongs to Template.

5. Core must not own React navigation infrastructure.

6. Application owns only Application-specific navigation extensions.

7. Application-specific screens belong to Application.

8. Template must not manually import concrete Application screens.

9. Application screens are integrated through automatic screen discovery.

10. Applications must not depend on Template-internal numeric IDs.

11. Applications must not reproduce Template visibility rules.

12. Feature selection uses semantic Application configuration.

13. Navigation extensions use `navigation.properties`.

14. Template menu ordering is Template-owned.

15. Application custom position is optional.

16. Legacy menu/tab configuration files must not be reintroduced.

17. Agent.Workbench navigation is not an extraction candidate.

---

## Incorrect Legacy Statements

The following statements conflict with this ADR:

```text id="neqqaa"
"Application owns all menu definitions."

"Application owns all tab definitions."

"Agent.Workbench navigation must move into Application."

"Agent.Workbench screens currently in Template are extraction candidates."

"Agent.Workbench navigation inside Template is transitional."

"menu.properties is the Application menu configuration."

"tabs.properties is the Application tab configuration."

"featureFlags.properties defines Application navigation features."

"menuFeatureFlags.properties defines menu visibility."

"tabFeatureFlags.properties defines tab visibility."

"ApplicationConfig should be manually populated with complete menu and tab definitions."
```

These statements must not guide future navigation work.

---

## Resulting Architecture

The authoritative navigation dependency direction is:

```text id="3h5c0h"
Application navigation extensions
        |
        v
Template navigation infrastructure
        |
        v
Core technical capabilities
```

with ownership:

```text id="zvlzxx"
Template
    reusable navigation infrastructure
    Template navigation definitions
    standard Agent.Workbench navigation
    Template screen registry
    visibility integration
    menu ordering

Application
    Application-specific navigation extensions
    Application-specific screens

Core
    reusable technical capabilities
```

ADR-0005 supersedes the Core-ownership portion of ADR-0004 and narrows the Application role to concrete navigation extensions rather than complete navigation ownership.
