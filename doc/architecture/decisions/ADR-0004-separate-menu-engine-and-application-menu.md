# ADR-0003: Separate Menu Engine and Application Menu Configuration

## Status

Accepted

## Context

The current menu implementation combines reusable menu infrastructure,
application-specific menu entries, feature flags, authentication rules and
screen registrations.

This creates a direct dependency from the shared platform to specific
application functionality such as Agent Workbench Options.

## Decision

The reusable menu engine will remain part of the Core.

Static application menu entries, concrete screens and application-specific
visibility rules will be provided by the Application layer.

The future menu structure will distinguish between:

- Core menu infrastructure
- Core menu entries
- Application menu entries
- Application-specific visibility rules
- Dynamic menu data received from the backend

## Consequences

### Advantages

- The Core no longer depends on application screens.
- Applications can register their own menu entries.
- Menu behavior remains reusable.
- Future applications can use different menus without modifying the Core.

### Disadvantages

- Menu initialization requires a clearly defined application interface.
- Existing menu configuration must be separated incrementally.
- Some authentication-based visibility rules must be reassigned carefully.