# ADR-0003

## Title

Separate Core, Base Template and Product Applications

---

## Status

Accepted

---

## Context

`web.template` is intended to provide reusable functionality for multiple
EnFlexIT web applications.

Concrete products such as Agent.Workbench and HEMS require common technical
and application-shell functionality, but they also contain product-specific
configuration, screens, state, branding and business logic.

Treating all reusable functionality as one shared Core would mix technical
infrastructure with React, Redux and UI responsibilities.

Keeping concrete products permanently inside the Base Template would also
create product dependencies and reduce reusability.

A clear ownership and dependency model is therefore required.

---

## Decision

The architecture is separated into three responsibility layers:

```text
Application --> Template --> Core
```

### Core

Core contains focused reusable technical capabilities.

Examples include:

- Technical authentication helpers
- Runtime utilities
- Server normalization and validation
- Technical server detection
- Pure update helpers
- Technical types and utilities

Core must not depend on Template or Application.

### Template

Template contains the reusable application shell.

Examples include:

- `TemplateApp`
- `createTemplateApp`
- `ApplicationConfig`
- Navigation infrastructure
- Redux infrastructure
- Authentication and session orchestration
- Server-selection behavior
- Design system
- Notifications
- Update orchestration
- Reusable screens and components

Template may depend on Core.

Template must not depend on a concrete Application.

### Application

Application contains concrete product functionality.

Examples include:

- Application configuration
- Menus and tabs
- Product-specific screens
- Product-specific Redux state
- Branding
- Business logic
- Product-specific backend integration
- Build and deployment configuration

Application may depend on Template and Core.

---

## Repository Decision

The long-term repository model uses one Base Template repository and separate
repositories for concrete Applications.

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
| Agent.Workbench          |   | HEMS                     |
| Application Repository   |   | Application Repository   |
+--------------------------+   +--------------------------+
```

Future Applications follow the same model.

Concrete Applications consume the Base Template.

The Base Template does not contain a runtime resolver that selects between
multiple products.

---

## Optional Features

Optionality is not an architecture layer.

A feature may be optional while still belonging to:

```text
Application
Template
Core
```

Ownership is determined by responsibility, not by whether a feature is enabled
or disabled.

---

## Agent.Workbench

The Base Template is not an Agent.Workbench reference application.

Agent.Workbench-specific functionality such as product-specific execution
settings, Program Start or Data Analysis belongs to the Agent.Workbench
Application when it is not genuinely reusable Template functionality.

Some of this functionality may remain physically inside Template during the
migration.

That temporary location does not change its final architectural ownership.

---

## Application Integration

Concrete Applications provide configuration to Template through explicit
contracts.

The current central contract is:

```text
ApplicationConfig
```

Conceptually:

```text
Application
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

Template defines the contract.

Application supplies the concrete values.

---

## Migration

The repository separation is performed incrementally.

The decision does not require moving all code immediately.

Migration should first establish:

- Clear ownership
- Dependency boundaries
- Stable contracts
- Safe extension points
- Runtime compatibility

Only then should concrete product functionality be physically extracted into
separate Application repositories.

---

## Consequences

### Advantages

- Clear dependency direction
- Core remains technically focused
- Template remains reusable across products
- Product-specific functionality is isolated
- Agent.Workbench and HEMS can evolve independently
- Shared Template improvements can be reused
- Product-specific Redux state can be separated from Template state
- Product build and deployment can be owned independently
- Future Applications can use the same Base Template
- No permanent product branching inside the Base Template is required

### Disadvantages

- Existing product-specific code must be classified and migrated
- Temporary transitional code remains inside Template
- Stable Application contracts must be designed and maintained
- Build and repository integration becomes more explicit
- Redux and navigation ownership require additional migration work

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

The Base Template consists of Template and Core.

Concrete products remain separate Applications.