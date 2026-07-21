# Core, Base Template and Product Application Separation

## Purpose

This document describes the planned architectural separation of
`web.template` into clearly defined reusable layers.

The goal is to transform `web.template` from a single web application into a
shared platform that serves as the technical foundation for multiple
EnFlex.IT products while providing a reusable Base Template with standard
functionality.

Examples of product applications include:

- HEMS
- Assist
- EOM Portal
- Future EnFlex.IT web applications

---

## Architectural Model

The future architecture is divided into four logical layers:

1. Core Platform
2. Base Template Modules
3. Optional Modules
4. Product Applications

```text
+------------------------------------------------------+
|                Product Applications                  |
|        HEMS • Assist • Portal • Future Apps          |
+------------------------------------------------------+
                        ▲
                        │
+------------------------------------------------------+
|               Base Template Modules                  |
| Application Settings • Program Start • Data Analysis |
| Database Settings • Upload • Standard Menu           |
+------------------------------------------------------+
                        ▲
                        │
+------------------------------------------------------+
|                 Optional Modules                     |
| Developer Console • Live Console • Diagnostics       |
+------------------------------------------------------+
                        ▲
                        │
+------------------------------------------------------+
|                  Core Platform                       |
| API • Authentication • Redux • Navigation • Theme    |
| Localization • Notifications • Update • Bootstrap    |
+------------------------------------------------------+
```

Each layer has clearly defined responsibilities and dependency rules.

---

# Core Platform

The Core Platform contains only reusable technical infrastructure.

It must not contain application-specific business logic or product-specific
implementations.

Typical responsibilities include:

- Bootstrap
- Authentication
- OpenID Connect
- JWT handling
- Session management
- API infrastructure
- Redux infrastructure
- Navigation engine
- Notification infrastructure
- Update infrastructure
- Server management
- Theme infrastructure
- Localization
- Shared UI components
- User profile infrastructure
- Release infrastructure

The Core Platform should remain as small and reusable as possible.

---

# Base Template Modules

The Base Template provides standard AWB functionality that is built on top of
the Core Platform.

These modules are reusable across multiple applications but are not part of
the technical core.

Examples include:

- Application Settings
- Database Settings
- Execution Settings
- Program Start
- Data Analysis
- File Configuration Upload
- Standard Menu
- Standard Administrative Screens

The Base Template represents the default installation delivered with the
AWB Web Server.

---

# Optional Modules

Optional Modules extend the platform with additional functionality that is not
required by every application.

Examples include:

- Developer Console
- Live Console
- Monitoring
- Diagnostic Tools
- Future Administration Modules

Optional Modules should be activated through configuration and should remain
independent from individual product implementations.

---

# Product Applications

Each product application contains its own business logic.

Examples include:

- HEMS
- Assist
- EOM Portal

Typical responsibilities include:

- Product-specific screens
- Business logic
- Product-specific API clients
- Product-specific services
- Branding
- Assets
- Product-specific translations
- Product-specific Redux state
- Product-specific release configuration
- Product-specific navigation

Applications reuse the Core Platform and may reuse Base Template and Optional
Modules.

---

# Configuration Responsibilities

Application Configuration controls the composition of an application.

Examples include:

- Application name
- Logo
- Theme colors
- Branding
- Enabled features
- Enabled menu entries
- Authentication method
- Update availability
- Notification availability
- Server switching
- Developer functionality

Configuration determines which modules are enabled.

Configuration must not replace proper architectural separation.

---

# Dependency Rules

The dependency direction should always be:

```text
Product Application
        │
        ▼
Base Template Modules
        │
        ▼
Optional Modules
        │
        ▼
Core Platform
```

Allowed dependencies:

- Product Applications → Base Template
- Product Applications → Optional Modules
- Product Applications → Core Platform
- Base Template → Core Platform
- Optional Modules → Core Platform

Forbidden dependencies:

- Core Platform → Base Template
- Core Platform → Product Application
- Base Template → Product Application
- Shared modules importing product-specific business logic

These rules prevent circular dependencies and keep the architecture modular.

---

# Repository Strategy

Permanent product branches such as

- hems
- assist
- portal

should be avoided.

The repository should first be prepared internally by introducing clear module
boundaries.

During the migration:

- existing functionality remains operational
- responsibilities are documented
- dependencies are reduced
- modules are classified
- configuration interfaces are introduced
- pilot implementations validate the architecture

Only after stable interfaces have been established should reusable modules be
considered for extraction into dedicated repositories or packages.

---

# Planned Development Phases

## Phase 1 – Analysis

- Analyse existing modules
- Classify Core Platform candidates
- Classify Base Template modules
- Classify Optional Modules
- Classify Product-specific functionality
- Document dependencies

## Phase 2 – Internal Separation

- Separate menu engine from menu configuration
- Separate Redux infrastructure from feature reducers
- Introduce Application Configuration
- Introduce Module Registration
- Connect branding, menus and features to configuration
- Validate architecture using a pilot application

## Phase 3 – Stable Interfaces

- Define public Core Platform interfaces
- Define Base Template interfaces
- Define Application Contracts
- Remove reverse dependencies
- Validate reusable module boundaries

## Phase 4 – Extraction (Optional)

- Extract stable Core modules
- Version reusable platform modules
- Connect product repositories through stable interfaces
- Define long-term update strategy

---

# Non-Goals

The first migration phase will **not**:

- Move the complete source tree
- Rewrite the complete Redux architecture
- Replace the navigation framework
- Change authentication behaviour
- Change update behaviour
- Introduce permanent product branches
- Extract packages before stable interfaces exist

The focus is on architectural preparation rather than immediate code movement.

---

# Success Criteria

The separation is considered successful when:

- Technical infrastructure is maintained centrally.
- Base Template functionality is reusable.
- Optional Modules can be enabled independently.
- Product-specific functionality remains isolated.
- Dependencies follow the defined architecture.
- Applications can select only the modules they require.
- Core updates can be adopted independently.
- New applications can be created with minimal effort.
- Future platform evolution becomes simpler and more maintainable.