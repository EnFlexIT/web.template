# web.template

Base Template for reusable EnFlexIT web applications.

The repository provides reusable technical capabilities and application-shell
functionality for concrete products such as Agent.Workbench, HEMS and future
EnFlexIT applications.

The current architecture follows the dependency direction:

```text
Application --> Template --> Core
```

The Base Template consists of Template and Core.

Concrete products are represented by their own Application layer and are
intended to live in separate Application repositories.

---

## Table of Contents

- [About](#about)
- [Architecture](#architecture)
- [Repository Responsibilities](#repository-responsibilities)
- [Requirements](#requirements)
- [Setup](#setup)
- [Application Configuration](#application-configuration)
- [Development](#development)
- [Build and Deployment](#build-and-deployment)
  - [Manual Web Build](#manual-web-build)
  - [Production Release](#production-release)
  - [Test Release](#test-release)
- [Project Structure](#project-structure)
- [Styling](#styling)
  - [Theme Structure](#theme-structure)
  - [Design System](#design-system)
  - [Unistyles](#unistyles)
- [API](#api)
- [State Management](#state-management)
- [Architecture Decisions](#architecture-decisions)
- [Additional Documentation](#additional-documentation)

---

## About

`web.template` provides reusable functionality for EnFlexIT web applications.

Examples include:

- Application bootstrap
- Authentication and session handling
- Server selection and server checks
- Navigation infrastructure
- Menu and tab infrastructure
- Redux infrastructure
- Design system
- Notifications
- Update infrastructure
- Dynamic content
- Reusable screens
- Runtime utilities
- Technical Core helpers

The repository is currently also capable of running as a standalone project
during the architecture migration.

Long term, concrete products such as Agent.Workbench and HEMS should consume the
Base Template from their own Application repositories.

---

## Architecture

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

### Application

Application contains concrete product functionality.

Examples include:

- Application identity
- Application configuration
- Menus
- Tabs
- Product-specific screens
- Product-specific Redux state
- Branding
- Business logic
- Product-specific backend integration
- Product build configuration
- Product deployment configuration

Application may depend on Template and Core.

### Template

Template contains the reusable application shell.

Examples include:

- `TemplateApp`
- `createTemplateApp`
- `ApplicationConfig`
- Navigation infrastructure
- Menu and tab infrastructure
- Redux infrastructure
- Authentication orchestration
- Session handling
- Server-selection behavior
- Design system
- Notifications
- Update orchestration
- Reusable screens
- Reusable React hooks and components

Template may depend on Core.

Template must not depend on a concrete Application.

### Core

Core contains focused reusable technical capabilities.

Examples include:

- Technical authentication helpers
- Technical runtime utilities
- Server normalization and validation
- Technical server detection
- Pure update helpers
- Technical types and utilities

Core must not depend on Template or Application.

---

## Repository Responsibilities

The target repository model is:

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

The Base Template does not contain a runtime mechanism that selects between
multiple products.

Each concrete Application supplies its own configuration and product
functionality to Template through explicit contracts.

The current repository is still in an incremental migration phase.

Some Agent.Workbench-specific functionality may therefore still physically
exist below `src/template`.

Its temporary physical location does not automatically define its final
architectural ownership.

---

## Requirements

To install and run the project locally, the following tools are required:

- Git
- Node.js
- npm

The GitHub Actions release workflows currently use:

```text
Node.js 20
npm 10
```

After installing Node.js and npm, verify the installation:

```bash
node -v
npm -v
git --version
```

---

## Setup

Clone the repository:

```bash
git clone <repository-url>
```

Enter the repository:

```bash
cd web.template
```

Install dependencies:

```bash
npm install
```

The project uses generated Application configuration.

For normal development, prefer the npm scripts because the corresponding npm
lifecycle hooks generate the Application configuration automatically.

For web development:

```bash
npm run web
```

Alternatively:

```bash
npm start
```

The normal npm startup path should be preferred over directly running:

```bash
npx expo start
```

because direct Expo commands bypass npm lifecycle hooks such as `prestart` and
`preweb`.

---

## Application Configuration

Application-specific developer configuration is stored in:

```text
src/application/config/application.properties
```

Example:

```properties
ApplicationId=agent-workbench
ApplicationTitle=Agent.Workbench
ApplicationLogo=../assets/bild.png
ApplicationContact=admin@xxx
ApplicationOwner=EnFlex.IT

LegalImprintCompanyHomepage=
LegalImprintCompanyName=
LegalImprintEmail=admin@xxx
```

The configuration is intentionally developer-facing and uses simple
key-value properties rather than JSON or TypeScript configuration files.

The configuration generator is located at:

```text
src/template/config/build/generateApplicationConfig.mjs
```

It generates:

```text
src/application/generated/applicationConfig.generated.ts
```

The configuration can be generated manually with:

```bash
npm run config:generate
```

Conceptually:

```text
application.properties
        |
        v
configuration generator
        |
        v
applicationConfig.generated.ts
        |
        v
ApplicationConfig
        |
        v
createTemplateApp(...)
        |
        v
TemplateApp
```

The current central Application integration contract is:

```text
ApplicationConfig
```

Template defines the contract.

Application supplies the concrete values.

---

## Development

The application entry point composes the concrete Application configuration
with the reusable Template.

Conceptually:

```text
Application
    |
    v
applicationConfig
    |
    v
createTemplateApp(applicationConfig)
    |
    v
TemplateApp
```

The current application bootstrap is registered through Expo.

When adding new functionality, ownership should be determined before choosing
the physical location.

A useful rule is:

```text
Product-specific?
    -> Application

Reusable application-shell behavior?
    -> Template

Focused technical capability without UI/application ownership?
    -> Core
```

Optionality does not define an architecture layer.

An optional feature can still belong to Application, Template or Core.

---

## Build and Deployment

The repository currently contains GitHub Actions workflows for production and
test releases.

Release and deployment workflows currently still live in `web.template` during
the architecture migration.

Long term, concrete product release and deployment configuration belongs to the
respective Application repository.

Reusable build tooling may remain part of the Base Template.

---

## Manual Web Build

Before creating a manual web export, generate the Application configuration:

```bash
npm run config:generate
```

Then export the Expo web application:

```bash
npx expo export -p web
```

The generated web application is written to:

```text
dist/
```

The exported files can then be served through a suitable web server.

A recommended local validation sequence is:

```bash
npm run config:generate
npx tsc --noEmit
npx expo export -p web
```

Run relevant automated tests before creating a release.

---

## Production Release

The current production workflow is located at:

```text
.github/workflows/export-put-release.yml
```

Workflow name:

```text
Export Put Release
```

It is started manually through GitHub Actions using:

```text
workflow_dispatch
```

The verified workflow currently performs:

```text
Checkout
    |
    v
Setup Node.js 20
    |
    v
Install npm 10
    |
    v
npm ci
    |
    v
Read package version
    |
    v
Generate timestamp
    |
    v
npx expo export -p web
    |
    v
ZIP dist/
    |
    v
FTP upload
    |
    v
GitHub release
```

The workflow uses the following repository secrets:

```text
FTP_UPLOAD_URL
FTP_USER
FTP_PSWD
PROJECT_NAME
PROJECT_PATH
```

The ZIP naming pattern is:

```text
<PROJECT_NAME>_<package.version>_<yyyyMMdd-HHmm>.zip
```

The production GitHub release tag is:

```text
v<package.version>
```

### Current configuration-generation gap

The production workflow currently executes:

```bash
npx expo export -p web
```

directly.

It does not currently explicitly run:

```bash
npm run config:generate
```

immediately before the export.

Because direct Expo commands bypass npm lifecycle hooks, this is a known
transitional build integration issue.

The desired sequence is:

```text
npm ci
    |
    v
npm run config:generate
    |
    v
npx expo export -p web
    |
    v
package
    |
    v
publish
```

This workflow change should be implemented and tested separately.

See:

```text
doc/release-workflow.md
```

for the detailed production release documentation.

---

## Test Release

The test release workflow is located at:

```text
.github/workflows/export-put-test-release.yml
```

It provides a separate release path for testing and internal validation.

Production and test release workflows should remain clearly distinguishable.

See:

```text
doc/test-release.md
```

for detailed information.

---

## Project Structure

The main source structure currently is:

```text
src/
├── api/
├── application/
│   ├── config/
│   ├── generated/
│   └── state/
├── core/
│   ├── authentication/
│   ├── runtime/
│   ├── server/
│   └── update/
└── template/
    ├── application/
    ├── authentication/
    ├── components/
    ├── config/
    ├── hooks/
    ├── navigation/
    ├── permissions/
    ├── runtime/
    ├── screens/
    ├── state/
    ├── styles/
    └── update/
```

### `src/api`

Contains API definitions and generated API implementations.

Generated API code should not be moved or rewritten through broad automated
refactoring scripts without carefully reviewing the result.

### `src/application`

Contains concrete Application integration.

Current areas include:

```text
src/application/config/
src/application/generated/
src/application/state/
```

`config` contains developer-facing Application configuration.

`generated` contains generated TypeScript configuration.

`state` contains Application-owned Redux integration.

### `src/core`

Contains focused reusable technical capabilities.

Current areas include:

```text
src/core/authentication/
src/core/runtime/
src/core/server/
src/core/update/
```

Core must remain independent from Template and Application.

### `src/template`

Contains reusable application-shell functionality.

Current areas include:

```text
src/template/application/
src/template/authentication/
src/template/components/
src/template/config/
src/template/hooks/
src/template/navigation/
src/template/permissions/
src/template/runtime/
src/template/screens/
src/template/state/
src/template/styles/
src/template/update/
```

### `src/template/application`

Contains the reusable application bootstrap and Application integration
contract.

Important files include:

```text
ApplicationConfig.ts
ApplicationConfigContext.tsx
createTemplateApp.tsx
TemplateApp.tsx
```

### `src/template/components`

Contains reusable React Native components.

Important areas include:

```text
design-system/
developer-tools/
dynamic-content/
layout/
localization/
notifications/
rich-text-editor/
```

### `src/template/components/design-system`

Contains reusable UI primitives and presentation components.

Important areas include:

```text
icons/
stylistic/
themed/
ui-elements/
```

### `src/template/navigation`

Contains reusable navigation, menu and tab infrastructure.

Concrete Application menu and tab configuration should be supplied by the
Application layer.

### `src/template/state`

Contains Redux infrastructure and Template-owned Redux state.

Redux is a technology and not an architecture layer.

State belongs to the layer that owns the corresponding responsibility.

### `src/template/state/store`

Contains the current Redux store infrastructure.

The existing runtime store and root reducer remain active.

The repository also contains a prepared extensible store composition for
combining Template reducers with Application reducers.

That new store factory is currently prepared infrastructure and should not be
treated as the active runtime store until it has been intentionally connected
and tested.

### `src/template/styles`

Contains reusable theme and styling infrastructure.

### `src/template/update`

Contains reusable update orchestration and update watchers.

---

## Styling

The project uses Unistyles for reusable theme-aware styling.

Styling responsibilities are separated between reusable theme definitions,
themed primitives and higher-level stylistic components.

---

## Theme Structure

Reusable styling infrastructure is located under:

```text
src/template/styles/
```

Theme-specific values such as colors, typography and other global visual
properties should be defined at the theme level where appropriate.

Component-specific layout properties such as local spacing, alignment or
component composition remain close to the corresponding component.

For example, layout behavior for the reusable header is located with the
header implementation under:

```text
src/template/components/layout/Header.tsx
```

---

## Design System

The reusable design system is located at:

```text
src/template/components/design-system/
```

Important areas include:

```text
design-system/
├── icons/
├── stylistic/
├── themed/
└── ui-elements/
```

Theme-aware base components are located under:

```text
src/template/components/design-system/themed/
```

Stylistic components are located under:

```text
src/template/components/design-system/stylistic/
```

Reusable UI elements are located under:

```text
src/template/components/design-system/ui-elements/
```

Examples include reusable buttons, cards, dialogs, dropdowns, tables, tabs,
inputs and other common UI building blocks.

For a more detailed component overview, see:

```text
doc/components.md
```

---

## Unistyles

The project uses Unistyles as its current styling solution.

Theme-aware styles can be declared using the Unistyles `StyleSheet` API.

Example:

```ts
const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
  },
}));
```

The current application imports the Unistyles configuration during bootstrap.

When changing global visual behavior, prefer extending the reusable theme and
design-system infrastructure instead of duplicating styles across screens.

---

## API

The repository contains API-related code below:

```text
src/api/
```

OpenAPI-based integrations are generated where appropriate.

The OpenAPI specifications are maintained separately by EnFlexIT and generated
implementations are consumed by the application.

When updating generated APIs:

1. Update the relevant API definition.
2. Regenerate the implementation using the repository's API scripts.
3. Review generated changes carefully.
4. Avoid manually editing generated files unless explicitly required.

API ownership should follow the architecture model:

```text
Generic technical API capability
        -> Core or Template, depending on responsibility

Product-specific backend integration
        -> Application
```

Concrete ownership should be determined by responsibility rather than by the
fact that code communicates with a backend.

---

## State Management

The project uses Redux Toolkit.

Redux itself is not an architecture layer.

State belongs to the layer that owns the corresponding functionality.

Conceptually:

```text
Template-owned feature
        |
        v
Template Redux state

Application-owned feature
        |
        v
Application Redux state
```

The current runtime store is still based on the existing Template store and
root reducer.

A new extensible store factory has been prepared to allow Template and
Application reducers to be composed safely.

The prepared composition includes infrastructure for:

```text
Template reducers
        +
Application reducers
        |
        v
Combined store
```

This new composition should not be connected to the runtime until the related
state typing and hook integration are ready and tested.

See:

```text
doc/redux-state-management.md
```

for detailed information.

---

## Architecture Decisions

Architecture Decision Records are stored under:

```text
doc/architecture/decisions/
```

Current ADRs:

```text
ADR-0001-core-first.md
ADR-0002-redux-root-reducer.md
ADR-0003-core-base-template-and-product-applications.md
ADR-0004-separate-menu-engine-and-application-menu.md
ADR-0005-navigation-infrastructure-in-template.md
```

Current status:

```text
ADR-0001 -> Accepted
ADR-0002 -> Accepted
ADR-0003 -> Accepted
ADR-0004 -> Superseded
ADR-0005 -> Accepted
```

ADR-0004 originally assigned reusable menu infrastructure to Core.

ADR-0005 supersedes that ownership decision and assigns reusable React
navigation infrastructure to Template while keeping concrete product
navigation configuration in Application.

---

## Additional Documentation

More detailed documentation is available in the `doc` directory.

### Architecture

- [Architecture Vision](doc/architecture/00-vision.md)
- [Core](doc/architecture/01-core-platform.md)
- [Current Architecture State](doc/architecture/05-current-state.md)
- [Application Contract](doc/architecture/application-contract.md)
- [Platform Architecture](doc/architecture/platform-architecture.md)
- [Application Separation](doc/application-separation.md)
- [Project Structure](doc/project-structure.md)

### Runtime and Features

- [Authentication](doc/authentication.md)
- [Server Check and Server Switching](doc/server-check-and-switching.md)
- [Update System](doc/update-system.md)
- [File Configuration Upload](doc/file-configuration-upload.md)
- [Redux State Management](doc/redux-state-management.md)
- [Components](doc/components.md)

### Build and Release

- [Production Release Workflow](doc/release-workflow.md)
- [Test Release](doc/test-release.md)

### Development and Review

- [Review Notes](doc/review-notes.md)
- [AI Context](doc/ai-context.md)

---

## Architecture Summary

The central architecture rule is:

```text
Application --> Template --> Core
```

The Base Template contains:

```text
Template
Core
```

Concrete products contain:

```text
Application
```

The intended long-term repository structure is:

```text
Base Template Repository
├── Template
└── Core

Agent.Workbench Repository
└── Application

HEMS Repository
└── Application

Future Application Repository
└── Application
```

The migration is incremental.

Existing functionality should first be assigned clear ownership and stable
contracts before it is physically moved between repositories.