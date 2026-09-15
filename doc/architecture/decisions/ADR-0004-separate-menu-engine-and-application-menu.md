# ADR-0004

## Title

Separate Menu Engine and Application Menu Configuration

---

## Status

Superseded

Superseded by ADR-0005.

This ADR documents a historical architecture decision.

It must not be used as the authoritative description of the current navigation architecture.

---

## Context

At the time of this decision, the menu implementation combined:

* reusable menu infrastructure
* static menu definitions
* feature flags
* authentication rules
* screen registrations
* product-specific navigation behavior

This created undesirable coupling between reusable navigation infrastructure and concrete application behavior.

The architecture therefore required a clearer separation between reusable menu mechanics and product-specific menu composition.

---

## Historical Decision

The reusable menu engine was separated from concrete Application menu configuration.

At the time of this ADR, the reusable menu engine was assigned to Core.

Concrete Application navigation was expected to provide:

```text
Application
|
+-- concrete menu entries
+-- concrete screens
+-- product-specific visibility rules
```

The historical separation was therefore:

```text
Reusable menu infrastructure
        |
        +-- shared menu behavior

Application
        |
        +-- concrete menu entries
        +-- concrete screens
        +-- product visibility rules
```

Dynamic menu information received from the backend remained part of runtime navigation integration.

---

## Historical Consequences

### Advantages

* reusable menu behavior was separated from product configuration
* concrete product screens no longer needed to be hardcoded directly into generic menu infrastructure
* navigation configuration could evolve separately from rendering behavior
* the decision established an important separation-of-responsibility principle

### Disadvantages

* reusable React navigation was incorrectly classified as Core responsibility
* Application ownership was defined too broadly
* standard reusable navigation and standard Agent.Workbench navigation were not yet clearly distinguished
* authentication and runtime visibility ownership remained unclear
* the model encouraged Applications to own more of the navigation tree than necessary

---

## Superseding Decision

ADR-0005 superseded the ownership model introduced here.

The current architecture is:

```text
Application --> Template --> Core
```

Reusable React navigation infrastructure belongs to Template, not Core.

The current ownership model is:

```text
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

Application
|
+-- Application-specific navigation extensions
+-- Application-specific screens
+-- Application-specific screen references
+-- optional custom navigation ordering

Core
|
+-- reusable technical capabilities
```

---

## Agent.Workbench Clarification

The historical wording of this ADR must not be interpreted to mean that standard Agent.Workbench navigation belongs to a separate concrete Application.

The current ownership decision is:

```text
Agent.Workbench standard navigation
    -> Template
```

Agent.Workbench is the current in-repository Application identity/composition, but it is not modeled as a separate consumer Application repository.

Therefore this ADR does not justify:

```text
extracting Agent.Workbench navigation into Application

creating a separate Agent.Workbench navigation configuration

creating a separate Agent.Workbench Application repository

moving standard Agent.Workbench screens solely because they are Agent.Workbench-related
```

---

## Current Application Navigation Model

Concrete Applications extend Template navigation rather than replacing the entire Template navigation structure.

Developer-facing Application navigation configuration uses:

```text
src/application/config/navigation.properties
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

Applications should not depend on Template-internal numeric IDs or internal screen-registry implementation details.

---

## Legacy Configuration Clarification

The following configuration model is not part of the current architecture:

```text
menu.properties
tabs.properties
menuFeatureFlags.properties
tabFeatureFlags.properties
featureFlags.properties
```

Current developer-facing Application configuration uses:

```text
application.properties
features.properties
navigation.properties
```

This clarification belongs to the superseding architecture and is included here only to prevent the historical ADR from being misread as current guidance.

---

## What Remains Valid from ADR-0004

The following principle remains valid:

```text
Reusable navigation mechanics
must be separated from
concrete Application navigation extensions.
```

However, the ownership changed from:

```text
Reusable menu engine
    -> Core
```

to:

```text
Reusable navigation infrastructure
    -> Template
```

The Application role was also narrowed.

Application no longer owns the complete menu/navigation model.

It owns only concrete Application-specific extensions.

---

## Current Authoritative Model

The current navigation ownership is:

```text
Application
    |
    v
Template navigation infrastructure
    |
    v
Core technical capabilities
```

with:

```text
standard Agent.Workbench navigation
    -> Template

HEMS-specific navigation
    -> HEMS Application

future product-specific navigation
    -> respective concrete Application
```

For the current architecture, ADR-0005 and the current architecture documentation are authoritative.
