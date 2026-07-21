# Core and Application Separation

## Decision

The project will be separated into:

- reusable web.template core infrastructure
- application-specific implementations

## Core responsibilities

- authentication
- OpenID Connect
- server handling
- update handling
- notifications
- shared navigation infrastructure
- shared UI components
- localization infrastructure
- Redux infrastructure

## Application responsibilities

- application-specific screens
- business logic
- application-specific APIs
- menus
- branding
- feature configuration
- application-specific translations

## Repository strategy

The current repository will first be prepared internally for the separation.

The core will not be extracted into a separate package until:

- responsibilities are clearly defined
- public interfaces are stable
- a pilot application has been tested