# Current Architecture

## Purpose

This document provides an initial classification of the current
`web.template` source structure.

The classification reflects the current repository state and is used as a
starting point for the planned separation into:

- Core Platform
- Base Template Modules
- Optional Modules
- Product Applications

The classification is preliminary and will be refined during the module
analysis.

## Core Platform Candidates

The following areas mainly provide reusable technical infrastructure:

- `api`
- `bootstrap`
- `hooks`
- `permissions`
- `styles`
- `util`

## Shared Component Candidates

The following component groups are expected to be reusable across multiple
applications:

- `ui-elements`
- `themed`
- `stylistic`
- `routing`
- `dynamic`

Individual components may still contain dependencies on Base Template or
product-specific modules and must be reviewed separately.

## Base Template Candidates

The following areas currently appear to provide standard functionality shipped
with the AWB Base Template:

- Data Analysis
- Program Start
- Application Settings
- Database Settings
- Execution Settings
- Settings File Upload
- standard menu configuration

These modules are not necessarily part of the technical Core Platform. They are
functional modules built on top of the core.

## Optional Module Candidates

The following areas may become optional modules that can be enabled by an
application configuration:

- Developer Console
- Live Console
- administrative or diagnostic functionality

## Product Application Candidates

The following areas contain or may contain application-specific functionality:

- `AgentWorkbenchOptions`
- product-specific screens
- product-specific menus
- product-specific business logic
- product-specific API integrations
- product-specific branding and translations

## Hybrid Areas

The following areas currently combine multiple responsibilities and require a
more detailed file-level analysis:

- `redux`
- `screens`
- `components`
- `settings`
- menu configuration

## Current Assessment

The current repository already contains a substantial amount of reusable
platform functionality.

The main architectural task is therefore not a complete rewrite. It is the
separation of existing responsibilities into clearly defined layers and
modules.