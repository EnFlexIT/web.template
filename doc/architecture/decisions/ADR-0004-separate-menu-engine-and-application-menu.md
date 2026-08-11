# ADR-0004

## Title

Separate Menu Engine and Application Menu Configuration

---

## Status

Superseded

Superseded by ADR-0005.

---

## Context

The menu implementation combined reusable menu infrastructure,
application-specific menu entries, feature flags, authentication rules and
screen registrations.

This created dependencies from shared infrastructure to concrete application
functionality such as Agent.Workbench-specific screens.

---

## Decision

The reusable menu engine was separated from concrete Application menu
configuration.

At the time of this decision, the reusable menu engine was assigned to Core.

Static Application menu entries, concrete screens and Application-specific
visibility rules were assigned to the Application layer.

The intended separation was:

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

Dynamic menu information received from the backend remained part of the
runtime navigation integration.

---

## Consequences

### Advantages

- Shared menu behavior is separated from product configuration.
- Applications can provide different menu structures.
- Concrete product screens do not need to be hardcoded into shared
  configuration.
- Menu configuration can evolve independently from rendering infrastructure.

### Disadvantages

- Menu initialization requires an explicit Application integration contract.
- Existing configuration must be separated incrementally.
- Authentication-based and product-specific visibility rules require clear
  ownership.

---

## Superseding Decision

The architectural separation introduced later clarified that reusable React
navigation infrastructure belongs to Template rather than Core.

The current dependency model is:

```text
Application --> Template --> Core
```

Therefore the original separation principle remains valid, while the ownership
of the reusable menu/navigation engine has changed.

See ADR-0005.