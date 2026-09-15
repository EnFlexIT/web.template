# ADR-0003

## Title

Separate Core, Base Template and Concrete Product Applications

---

## Status

Accepted

---

## Context

`web.template` provides reusable functionality for multiple EnFlexIT web applications.

The platform contains three different kinds of responsibility:

* reusable technical capabilities
* reusable application-platform functionality
* concrete product composition

Treating all reusable functionality as one shared Core would mix technical infrastructure with React, Redux, navigation and UI responsibilities.

Likewise, allowing Template to depend on concrete consumer products such as HEMS would reduce reusability and reverse the intended dependency direction.

A clear ownership and dependency model is therefore required.

---

## Decision

The architecture is separated into three responsibility layers:

```text
Application --> Template --> Core
```

The layers represent ownership and dependency direction.

They are not merely folder names.

---

## Core

Core contains focused reusable technical capabilities.

Examples include:

* technical authentication helpers
* technical authentication types
* runtime utilities
* server normalization
* server validation
* technical server checks
* environment detection
* technical update helpers
* framework-independent types and utilities

Core must not depend on:

```text
Template
Application
```

Invalid dependencies include:

```text
Core --> Template
Core --> Application
```

Core should remain technically focused and independent from concrete product composition.

---

## Template

Template contains the reusable application platform.

Examples include:

* `TemplateApp`
* `createTemplateApp`
* `ApplicationConfig`
* `ApplicationConfigContext`
* navigation infrastructure
* Template navigation definitions
* Template screen registry
* Redux infrastructure
* authentication and session orchestration
* server-selection behavior
* settings
* design system
* notifications
* update orchestration
* reusable screens
* reusable components
* reusable hooks
* localization infrastructure
* standard Agent.Workbench functionality
* Agent.Workbench state
* reusable Agent.Workbench API integration where appropriate

Template may depend on Core.

Template must not depend on a concrete Application.

---

## Application

Application contains concrete product composition.

Examples include:

* Application identity
* Application metadata
* semantic Template feature selection
* Application-specific navigation
* Application-specific screens
* Application translations
* optional Application-specific Redux state
* product-specific business logic
* product-specific backend integration
* branding
* build configuration
* release configuration
* deployment configuration

Application may consume supported Template and Core integration surfaces.

Template and Core must not depend on concrete Application implementation.

---

## Agent.Workbench Decision

Standard Agent.Workbench functionality belongs to Template.

The ownership decision is:

```text
Agent.Workbench standard functionality
    -> Base Template
```

This includes reusable standard functionality such as:

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

Agent.Workbench is the current in-repository Application identity/composition, but it is not modeled as a separate consumer Application repository.

The architecture does not require:

```text
a separate Agent.Workbench Application
a separate Agent.Workbench Application repository
Agent.Workbench screen extraction from Template
Agent.Workbench state extraction from Template
Agent.Workbench navigation extraction into Application
```

These areas are intentionally Template-owned.

Their presence in Template is not transitional.

---

## Concrete Applications

Concrete consumer products such as HEMS remain Application-owned.

HEMS may provide:

```text
HEMS configuration
HEMS feature selection
HEMS navigation extensions
HEMS screens
HEMS translations
optional HEMS Redux state
HEMS business logic
HEMS backend integration
HEMS branding
HEMS build/deployment configuration
```

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

Future concrete Applications follow the same model.

---

## Repository Decision

The long-term repository model uses one Base Template repository and separate repositories for concrete consumer Applications where required.

Conceptually:

```text
                 Base Template Repository
                 +------------------------+
                 | Template               |
                 |        |               |
                 |        v               |
                 | Core                   |
                 +-----------+------------+
                             ^
                             |
              +--------------+--------------+
              |                             |
+--------------------------+   +--------------------------+
| HEMS                     |   | Future Application       |
| Application Repository   |   | Repository               |
+--------------------------+   +--------------------------+
```

Agent.Workbench is not shown as a separate consumer repository because its standard functionality belongs to the Base Template itself.

Concrete Applications consume the Base Template.

The Base Template does not contain a runtime resolver that selects between concrete Applications.

---

## Current Repository Model

The current repository contains:

```text
src/
├── application/
├── template/
└── core/
```

Responsibilities are:

```text
src/application/
    Agent.Workbench Application composition

src/template/
    reusable Base Template
    including standard Agent.Workbench functionality

src/core/
    reusable technical capabilities
```

The current `src/application/` directory is not Agent.Workbench.

It validates the Application integration contract.

---

## Application Integration

Concrete Applications provide configuration to Template through explicit contracts.

The central integration contract is:

```text
ApplicationConfig
```

Conceptually:

```text
Concrete Application
        |
        v
ApplicationConfig
        |
        v
createTemplateApp(...)
        |
        v
Template
        |
        v
Core
```

Template defines the reusable contract.

Application provides the concrete composition.

---

## Application Configuration

Developer-facing Application configuration uses:

```text
src/application/config/
├── application.properties
├── features.properties
└── navigation.properties
```

Responsibilities are:

```text
application.properties
    Application identity and metadata

features.properties
    semantic selection of reusable Template features

navigation.properties
    Application-specific navigation extensions
```

Generated TypeScript may exist as implementation output.

Developers should not need to edit TypeScript, TSX, JavaScript or JSON for normal Application configuration.

---

## Legacy Configuration Names

The following configuration names are not part of the current architecture:

```text
menu.properties
tabs.properties
featureFlags.properties
menuFeatureFlags.properties
tabFeatureFlags.properties
```

They must not be reintroduced as active or planned Application configuration.

The current configuration model is:

```text
application.properties
features.properties
navigation.properties
```

---

## Navigation Ownership

Template owns:

```text
navigation infrastructure
routing
menu rendering
menu tree construction
Template navigation definitions
Template screen registry
visibility integration
Agent.Workbench navigation
Template menu ordering
```

Application owns:

```text
Application-specific navigation extensions
Application-specific screen references
optional custom ordering
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

Applications do not define the entire Base Template navigation structure.

---

## Screen Ownership

Reusable Template and standard Agent.Workbench screens belong to Template.

Concrete Application screens belong to Application.

Application screens are discovered automatically.

Relevant implementation:

```text
src/template/config/build/applicationScreenDiscovery.mjs
```

Generated registry:

```text
src/application/generated/applicationScreenRegistry.generated.ts
```

Template must not manually import concrete Application screens.

---

## Redux Ownership

Redux is an implementation technology, not an architecture layer.

State ownership follows responsibility.

```text
Template
|
+-- reusable Template state
+-- Agent.Workbench state
+-- Redux infrastructure

Application
|
+-- optional concrete product-specific state
```

Agent.Workbench standard state is intentionally Template-owned.

It is not transitional Application state.

Application-specific reducers may be supplied through the documented Application extension point.

---

## Optional Features

Optionality is not an architecture layer.

A feature may be optional while still belonging to:

```text
Application
Template
Core
```

Ownership is determined by responsibility, not by whether a feature is enabled.

Applications may semantically enable or disable reusable Template functionality without owning its implementation.

---

## No Runtime Product Resolver

The Base Template does not select between concrete products at runtime.

The following model is intentionally avoided:

```text
Template
|
+-- detect HEMS
+-- detect Product A
+-- select concrete Application
```

Instead:

```text
Concrete Application
        |
        v
createTemplateApp(...)
        |
        v
Base Template
```

Agent.Workbench does not participate in runtime product selection because its standard functionality is already part of the Base Template.

---

## Consequences

### Advantages

* clear dependency direction
* Core remains technically focused
* Template remains reusable
* Agent.Workbench standard functionality has explicit ownership
* HEMS-specific functionality remains isolated
* concrete Applications can use stable integration contracts
* navigation ownership is clear
* Redux ownership follows responsibility
* developer-facing Application configuration remains simple
* concrete Applications can own their own build and deployment
* future Applications can reuse the same Base Template
* Template does not require a runtime product resolver
* no separate Agent.Workbench Application repository is required

### Tradeoffs

* Template intentionally contains standard Agent.Workbench functionality
* ownership decisions require responsibility analysis rather than name-based classification
* public integration contracts must remain stable
* concrete consumers may require their own build/deployment integration
* reusable and product-specific API behavior must be classified carefully
* documentation must consistently distinguish Agent.Workbench standard functionality from concrete Application functionality

---

## Rejected Alternative: Agent.Workbench as Separate Application

The following model was considered previously:

```text
Base Template
        ^
        |
+-------+-------+
|               |
Agent.Workbench HEMS
Application     Application
```

This model is not the selected architecture.

It would incorrectly classify standard Agent.Workbench functionality as concrete product composition and would require unnecessary extraction from Template.

The accepted model is:

```text
Base Template
|
+-- Template
|   |
|   +-- standard Agent.Workbench functionality
|
+-- Core

Concrete consumers:
    HEMS
    future Applications
```

---

## Rejected Alternative: All Reusable Code in Core

Reusable React, Redux, navigation or application-shell behavior must not be moved into Core simply because multiple consumers may use it.

Core remains focused on technical capabilities.

Template owns reusable application-platform functionality.

---

## Rejected Alternative: Application-Owned Complete Navigation

Applications must not define the entire Template menu or tab structure.

They should only provide Application-specific navigation extensions.

Template retains ownership of reusable navigation and Agent.Workbench navigation.

---

## Rejected Alternative: Separate Optional Modules Layer

Optionality does not justify a separate architecture layer.

A feature remains owned by Application, Template or Core according to responsibility.

---

## Migration and Future Work

The architecture itself is already selected.

Future work should validate and extend the current model rather than redefine it.

Relevant future work includes:

```text
HEMS consumer integration
consumer repository validation
public Template API refinement
consumer-specific build/deployment
additional Application extension points when required
```

A future HEMS consumer repository is useful because it validates that the Base Template can be consumed without Template importing concrete Application implementation.

A separate Agent.Workbench extraction project is not required.

---

## Architecture Rules

This ADR establishes the following rules:

1. The dependency direction is:

   ```text
   Application --> Template --> Core
   ```

2. Core must not depend on Template or Application.

3. Template must not depend on a concrete Application.

4. Standard Agent.Workbench functionality belongs to Template.

5. Agent.Workbench standard state belongs to Template.

6. HEMS is a concrete Application.

7. Concrete Application state is optional and Application-owned.

8. Developer-facing Application configuration uses `.properties`.

9. Applications should not depend on Template internal navigation IDs.

10. Application-specific navigation extends Template navigation.

11. Application-specific screens must not require Template imports.

12. Template must not contain a runtime concrete-product resolver.

13. A separate Agent.Workbench Application repository is not required.

14. Ownership is determined by responsibility rather than naming or historical file location.

---

## Incorrect Legacy Statements

The following statements conflict with this ADR:

```text
"Agent.Workbench is a concrete Application."

"Agent.Workbench needs its own Application repository."

"Program Start and Data Analysis must move into Agent.Workbench Application."

"Agent.Workbench functionality inside Template is transitional."

"Agent.Workbench state must move into Application."

"Agent.Workbench screens must be extracted."

"Agent.Workbench and HEMS are equivalent concrete Applications."

"menu.properties is the Application navigation model."

"tabs.properties is the Application tab model."

"featureFlags.properties is the Application feature model."
```

These statements must not be used to guide future implementation work.

---

## Resulting Architecture

The authoritative dependency direction is:

```text
Application
    |
    v
Template
    |
    v
Core
```

The Base Template consists of:

```text
Template
    including standard Agent.Workbench functionality

Core
    reusable technical capabilities
```

Concrete products such as HEMS remain Applications.

Agent.Workbench standard functionality remains part of Template.

A separate Agent.Workbench Application repository is not part of the accepted architecture.
