# Authorization Architecture

## Purpose

This document defines the authorization ownership model between
Core, the reusable Base Template, concrete Applications and the
backend.

The architectural dependency direction remains:

Application --> Template --> Core

The central principle is:

- Template defines HOW authorization is evaluated.
- Application defines WHICH access policy applies to its product.
- Backend defines WHICH roles or permissions a user actually has.

Frontend authorization controls navigation and presentation.

It must not be treated as the authoritative security boundary for
backend resources or API operations.

# 1. Responsibility Model

Authorization is intentionally separated into three responsibilities:

Backend
-> authenticated user
-> assigned roles / permissions
-> Authorization Context
-> Template Access Policy / Application Access Policy
-> Authorization Engine
-> Menu / Tabs / Screens

The backend remains the authoritative source for the user's actual
authorization state.

The frontend consumes that state and applies visibility and navigation
rules.

# 2. Template Responsibility

The Base Template owns the reusable authorization mechanism.

Template responsibilities include:

- authorization state integration
- role-preview behavior for supported Template administration roles
- access-rule evaluation
- semantic feature hierarchy evaluation
- inherited access restrictions
- menu visibility evaluation
- tab visibility evaluation
- route guarding
- generation of runtime access configuration
- reusable authorization types and integration surfaces

Template must not hardcode product-specific Application roles.

Template must not contain access policies that belong only to a
specific consumer Application.

# 3. Current Base Template Roles

The current Base Template role model is:

USER
EDITOR
ADMIN

These roles currently describe access to reusable Base Template
functionality.

ADMIN is the administrative Template role.

ADMIN may temporarily preview the effective Template behavior of:

USER
EDITOR

Role preview is a frontend development / administration capability.

It does not change the actual backend authorization of the user.

# 4. Current Access Configuration

Base Template access policy is currently configured through:

src/application/config/access.properties

The current developer-facing syntax is:

access.<feature>.roles=<ROLE1>,<ROLE2>

Example:

access.systemSettings.roles=EDITOR,ADMIN

This means that the semantic Template feature `systemSettings` is
available to EDITOR and ADMIN but not USER.

Access rules are evaluated through the semantic Template feature
hierarchy.

A restriction defined for a parent feature is inherited by its
descendants.

More specific child restrictions may narrow inherited access.

Missing access rules do not introduce an additional restriction.

# 5. Configuration Responsibilities

The current configuration model intentionally separates concerns:

features.properties
-> Which reusable Template capabilities are enabled?

navigation.properties
-> How is navigation composed and presented?

access.properties
-> Which roles may access a feature?

These responsibilities must not be mixed accidentally.

Whether a future Application-owned access policy continues to use a
separate `access.properties` file or becomes feature-local is an open
design decision.

The architecture must not depend on either syntax.

# 6. Generated Runtime Configuration

Application developers configure authorization through supported
developer-facing configuration.

They must not manually edit generated runtime authorization data.

The Template generator resolves configured access rules and
materializes the required runtime information in generated
Application configuration.

Conceptually:

access.properties
-> Template configuration generator
-> generated ApplicationConfig
-> menu rules
-> tab roles
-> runtime visibility

Generated files are implementation artifacts.

They are not the developer-facing authorization policy.

# 7. Frontend Security Boundary

Frontend authorization is not backend security.

Menu filtering, tab filtering and route guards improve the user
experience and prevent accidental navigation to unavailable
functionality.

They cannot securely protect backend resources.

A user capable of calling an API directly must still be rejected by
the backend if the operation is not authorized.

The security model therefore is:

Frontend
-> presentation and navigation authorization

Backend
-> authoritative API and resource authorization

Backend authorization must eventually enforce protected operations
independently from frontend visibility.

# 8. Application Authorization Ownership

A concrete Application must be able to define its own access policy.

Different Applications may require completely different product roles.

For example, one Application could eventually use roles such as:

OPERATOR
ENGINEER
MANAGER

while another Application may use a completely different role model.

Such roles must not require modifications to Base Template source code.

The Application repository owns its product-specific access policy.

The Template owns the engine that evaluates that policy.

# 9. Template Roles versus Application Roles

Base Template roles and Application-specific roles represent different
authorization domains.

Conceptually:

AuthorizationContext

Template roles
    USER
    EDITOR
    ADMIN

Application roles
    supplied by the concrete Application / backend

The exact future runtime structure is not yet fixed.

A possible future model could resemble:

AuthorizationContext
    -> templateRoles
    -> applicationRoles

This is an architectural direction, not yet an implemented contract.

Application-specific role types must not be added permanently to the
Base Template role union merely to support one concrete product.

# 10. Application Policy Requirement

A concrete Application repository must eventually be able to decide:

Which Application feature exists?
Which role may access it?
Which menu entry should be visible?
Which tab should be visible?

The Base Template must provide reusable mechanisms for these decisions
without knowing the concrete product role names.

This keeps the dependency direction intact:

Application --> Template

and prevents:

Template --> concrete Application

# 11. Open Design Decision: Application Policy Format

The concrete syntax for future Application-owned authorization policy
is intentionally not fixed yet.

Possible approaches include:

A)

src/application/config/access.properties

access.application.dashboard.roles=...

or:

B)

features.properties

feature.dashboard.roles=...

or another dedicated Application-owned policy format.

This decision must be made separately from the authorization engine.

Whichever format is selected, it must preserve the following
principles:

- Application owns product-specific access policy
- Template owns reusable evaluation mechanics
- backend remains authoritative for real user authorization
- Application roles are not hardcoded in Template
- generated runtime files are not edited manually
- feature selection, navigation composition and authorization remain
  conceptually distinct responsibilities

# 12. Backend Integration

The final backend authorization contract is not yet implemented in
this repository.

The current frontend repositories contain generated API clients but not
the authoritative backend implementation.

When the backend integration is available, it must provide the
authenticated user's relevant authorization information.

The frontend must consume that information rather than inventing an
independent user-role database.

Backend integration must not require concrete Application policy to be
hardcoded into the reusable Template.

# 13. Architectural Invariants

The authorization architecture must preserve these invariants:

1. Template owns the authorization engine.

2. Application owns product-specific authorization policy.

3. Backend owns authoritative user authorization.

4. Frontend guards are not API security.

5. Application roles must not require Template source changes.

6. Generated authorization configuration is not manually maintained.

7. Feature activation and authorization are separate concepts.

8. Navigation composition and authorization are separate concepts.

9. Template must remain independent from concrete Applications.

10. Application --> Template --> Core remains the dependency direction.

# 14. Current State

Implemented:

- Base Template roles USER, EDITOR and ADMIN
- ADMIN role preview
- access.properties
- semantic access inheritance
- generated menu role restrictions
- generated tab role restrictions
- role-aware menu visibility
- role-aware tab visibility
- route fallback when access changes
- authorization unit tests
- configuration generator access tests

Not yet implemented:

- backend-provided final role assignment
- authoritative backend API authorization
- Application-specific role runtime contract
- Application-owned dynamic role definitions
- final Application authorization policy syntax

These future areas must build on the ownership principles defined in
this document rather than introducing a parallel authorization system.
