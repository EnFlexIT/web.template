# ADR-0005

## Title

Place Navigation Infrastructure in Template

---

## Status

Accepted

---

## Context

ADR-0004 separated reusable menu infrastructure from concrete Application menu
configuration.

ADR-0004 originally assigned the reusable menu engine to Core.

The platform architecture was later clarified as:

```text
Application --> Template --> Core
```

Core contains focused technical capabilities and should not own React
application-shell infrastructure.

Navigation depends on application-shell concerns such as menus, tabs, routing,
screen composition and React presentation.

These responsibilities fit Template rather than Core.

---

## Decision

Reusable navigation infrastructure belongs to Template.

Concrete navigation configuration belongs to Application.

The ownership model is:

```text
Application
|
+-- menu definitions
+-- tab definitions
+-- product-specific screens
+-- product visibility rules
        |
        v
Template
|
+-- navigation engine
+-- routing infrastructure
+-- menu rendering
+-- tab rendering
+-- reusable navigation state integration
        |
        v
Core
|
+-- no product navigation ownership
```

Template must not import concrete Application screens or product-specific menu
configuration.

Application supplies navigation configuration through explicit contracts.

The current `ApplicationConfig` provides integration points for menu and tab
configuration.

---

## Consequences

### Advantages

- Core remains focused on technical capabilities.
- React navigation infrastructure has a clear owner.
- Applications can define independent menu and tab structures.
- Template remains reusable across Agent.Workbench, HEMS and future
  Applications.
- Concrete product screens are not hardcoded into Template infrastructure.
- Navigation follows the general dependency direction.

### Disadvantages

- Existing navigation configuration must continue to be migrated.
- Product-specific screens currently located in Template must be classified
  and extracted incrementally.
- Visibility rules require clear distinction between reusable runtime context
  and product-specific decisions.

---

## Resulting Architecture

The navigation dependency direction is:

```text
Application navigation configuration
        |
        v
Template navigation infrastructure
        |
        v
Core technical capabilities
```

ADR-0005 supersedes the Core ownership portion of ADR-0004.

The separation between reusable navigation infrastructure and concrete
Application configuration remains valid.