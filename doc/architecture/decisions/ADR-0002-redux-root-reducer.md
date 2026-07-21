# ADR-0002

## Title

Extract Redux Root Reducer

---

## Status

Accepted

---

## Context

The Redux configuration was previously located completely inside store.ts.

This made future modularization more difficult.

---

## Decision

Move the root reducer into its own module.

---

## Consequences

- Better separation
- Easier testing
- Better scalability