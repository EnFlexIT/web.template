# Core and Application Separation

## Purpose

This document describes the planned separation between the reusable
`web.template` infrastructure and application-specific implementations.

The goal is to use `web.template` as a shared technical foundation for
applications such as:

- HEMS
- Assist
- EOM Portal
- future EnFlex.IT web applications

## Decision

The future architecture will distinguish between:

1. a reusable web template core
2. application-specific repositories and implementations

The shared core will provide common infrastructure.

Each application will contain only its application-specific functionality,
configuration and business logic.

## Core Responsibilities

The reusable core should contain functionality that is shared across multiple
applications.

Examples include:

- authentication
- OpenID Connect
- JWT handling
- session handling
- server availability checks
- server switching
- update handling
- normal and test release infrastructure
- notifications
- shared navigation infrastructure
- shared UI components
- theme infrastructure
- localization infrastructure
- shared Redux infrastructure
- API configuration infrastructure
- user profile base functionality

## Application Responsibilities

Each specific application should contain its own:

- application screens
- business logic
- application-specific API clients and services
- menus and navigation entries
- branding
- assets
- feature configuration
- application-specific translations
- application-specific Redux state
- application-specific release lifecycle

Examples of specific applications include:

- HEMS
- Assist
- EOM Portal

## Configuration Responsibilities

Some functionality belongs to the core, but its behavior should be controlled
by the application configuration.

Examples include:

- application name
- logo
- colors
- enabled or disabled features
- enabled or disabled menu entries
- server switching availability
- notification availability
- user profile availability
- update system availability

## Repository Strategy

Permanent product branches such as `hems`, `assist` or `eom-portal` should be
avoided.

The current repository will first be prepared internally for the separation.

During the first phase:

- existing functionality remains operational
- responsibilities are documented
- configuration interfaces are introduced
- application-specific modules are tested through a pilot implementation

The core should only be extracted into a separate package or repository after
its public interfaces are stable.

## Planned Development Phases

### Phase 1: Analysis and preparation

- classify existing files as core, configurable or application-specific
- define responsibilities
- define configuration types
- document dependencies

### Phase 2: Internal separation

- introduce application configuration
- introduce application registration
- connect branding, features and menus to the configuration
- create a small pilot application

### Phase 3: Core extraction

- define the public core API
- extract reusable modules
- publish and version the core
- connect application repositories to the core

## Non-Goals of the First Phase

The first phase will not:

- immediately move the entire source tree
- rewrite the Redux architecture
- replace the navigation system
- change authentication behavior
- change update behavior
- create permanent product branches
- extract a package before the interfaces are stable

## Success Criteria

The separation is successful when:

- shared functionality can be maintained centrally
- application-specific functionality remains isolated
- applications can use different core versions
- core updates can be adopted intentionally
- no application must duplicate common infrastructure
- new applications can be created with minimal setup