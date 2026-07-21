# ADR-0001

## Title

Core First Architecture

---

## Status

Accepted

---

## Context

The current web.template project evolved into a reusable platform.

Introducing an application layer before defining the Core would likely lead to unnecessary restructuring and duplicate work.

---

## Decision

The Core architecture will be defined first.

Applications will be introduced only after the Core boundaries have been established.

---

## Consequences

Advantages

- Cleaner architecture
- Less refactoring
- Better separation of responsibilities
- Easier onboarding

Disadvantages

- Slightly more upfront planning