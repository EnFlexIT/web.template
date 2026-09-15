# ADR-0001

## Title

Core First Architecture

---

## Status

Accepted

---

## Context

`web.template` evolved into a reusable platform.

Before introducing concrete Application integration, the project required clear technical boundaries for reusable Core functionality.

Without those boundaries, Application, Template and technical infrastructure responsibilities could become mixed and lead to unnecessary restructuring.

---

## Decision

Core boundaries are defined before concrete Application concerns are introduced.

The architecture follows:

```text
Application --> Template --> Core
```

Core contains focused reusable technical capabilities.

Template provides the reusable application platform.

Application contains concrete product composition.

Core must remain independent from Template and Application.

---

## Consequences

### Advantages

* clear responsibility boundaries
* reduced architectural coupling
* fewer unnecessary refactorings
* easier reuse of technical capabilities
* clearer dependency direction
* easier onboarding

### Tradeoffs

* requires explicit architectural ownership decisions
* some technical boundaries must be established before higher-level product composition

---

## Result

The Core-first principle remains valid in the current architecture.

It does not mean that all reusable functionality belongs in Core.

Reusable React, Redux, navigation and application-shell behavior belongs to Template.

The resulting dependency direction is:

```text
Application
    |
    v
Template
    |
    v
Core
```
