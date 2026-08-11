# web.template

Base Template for reusable EnFlexIT web applications.

The repository provides reusable technical capabilities and application-shell
functionality for concrete products such as Agent.Workbench, HEMS and future
EnFlexIT applications.

The central architecture follows the dependency direction:

```text
Application --> Template --> Core
```

The Base Template consists of:

```text
Template
Core
```

Concrete products provide their own Application layer and are intended to live
in separate Application repositories.

---

## Table of Contents

- [About](#about)
- [Architecture](#architecture)
- [Repository Responsibilities](#repository-responsibilities)
- [Requirements](#requirements)
- [Working with web.template](#working-with-webtemplate)
- [Creating a New Application](#creating-a-new-application)
- [Connecting an Application to web.template](#connecting-an-application-to-webtemplate)
- [Updating an Application from web.template](#updating-an-application-from-webtemplate)
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
- [Documentation](#documentation)
- [Architecture Summary](#architecture-summary)

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

The repository can currently also be developed and executed as a standalone
project.

At the same time, it acts as the Base Template for concrete applications such
as Agent.Workbench and HEMS.

The goal is to keep reusable functionality in one common place while concrete
products remain independently configurable and developable.

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

Each concrete Application supplies its own product configuration and
functionality through explicit contracts.

The current repository is still in an incremental migration phase.

Some Agent.Workbench-specific functionality may therefore still physically
exist below:

```text
src/template/
```

Its temporary physical location does not automatically define its final
architectural ownership.

---

## Requirements

To download, install and run the project locally, the following tools are
required:

- Git
- Node.js
- npm

The GitHub Actions release workflows currently use:

```text
Node.js 20
npm 10
```

After installing the required software, verify the installation:

```bash
git --version
node -v
npm -v
```

All three commands should return an installed version.

---

## Working with web.template

The Base Template repository can be cloned and executed directly on a
developer PC.

Clone the repository:

```bash
git clone git@github.com:EnFlexIT/web.template.git
```

Enter the project directory:

```bash
cd web.template
```

Install all dependencies:

```bash
npm install
```

The project uses generated Application configuration.

For normal web development, start the application with:

```bash
npm run web
```

Alternatively:

```bash
npm start
```

The npm commands should be preferred because npm lifecycle hooks automatically
generate the Application configuration before startup.

The application configuration can also be generated manually:

```bash
npm run config:generate
```

TypeScript can be checked without generating build output using:

```bash
npx tsc --noEmit
```

### Normal local development flow

A typical local setup therefore looks like:

```bash
git clone git@github.com:EnFlexIT/web.template.git
cd web.template
npm install
npm run web
```

After Metro/Expo has started, the application can be opened in the browser.

The exact development URL is displayed by Expo.

### Direct Expo startup

Directly running:

```bash
npx expo start
```

is not the preferred normal startup path.

The reason is that direct Expo commands bypass npm lifecycle hooks such as:

```text
prestart
preweb
```

These hooks currently ensure that the Application configuration is generated
before startup.

---

## Creating a New Application

Concrete products should live in their own Application repositories while
using `web.template` as their shared Base Template.

Examples are:

```text
Agent.Workbench
HEMS
Future Application
```

Conceptually:

```text
web.template
├── Template
└── Core

Agent.Workbench
└── Application

HEMS
└── Application
```

### Create the repository on GitHub

If the `web.template` repository provides the GitHub template functionality,
a new Application can initially be created through:

```text
GitHub
    |
    v
web.template
    |
    v
Use this template
    |
    v
Create new repository
```

The newly created repository is the concrete product repository.

For example:

```text
Agent.Workbench
```

or:

```text
HEMS
```

The new repository contains the initial Base Template source while its normal
Git remote:

```text
origin
```

points to the concrete Application repository.

### Clone the new Application

After creating the Application repository, clone it locally:

```bash
git clone <application-repository-url>
```

Enter the project:

```bash
cd <application-repository-directory>
```

Install its dependencies:

```bash
npm install
```

Generate the Application configuration:

```bash
npm run config:generate
```

Start the Application:

```bash
npm run web
```

At this point the Application repository can be developed independently.

The next step is to connect it to the shared `web.template` repository.

---

## Connecting an Application to web.template

An Application repository uses two Git remotes with different
responsibilities.

Conceptually:

```text
Application Repository
|
+-- origin
|   |
|   +-- concrete Application repository
|
+-- template
    |
    +-- shared web.template repository
```

### `origin`

`origin` points to the concrete product.

For example:

```text
origin -> Agent.Workbench
```

or:

```text
origin -> HEMS
```

Application-specific development is pushed to this repository.

### `template`

`template` points to the shared Base Template:

```text
EnFlexIT/web.template
```

Reusable Template and Core changes can be fetched from this repository.

### Configure the Template remote

Add `web.template` as an additional Git remote:

```bash
git remote add template git@github.com:EnFlexIT/web.template.git
```

Fetch the Base Template repository:

```bash
git fetch template
```

Create a local `template` branch based on the remote Base Template `master`
branch:

```bash
git branch template template/master
```

These are the three essential commands for connecting an Application
repository with the Base Template:

```bash
git remote add template git@github.com:EnFlexIT/web.template.git
git fetch template
git branch template template/master
```

No additional setup script is required for this.

### Verify the remotes

Check the configured Git remotes:

```bash
git remote -v
```

A correctly configured Application repository should conceptually contain:

```text
origin    -> concrete Application repository
template  -> EnFlexIT/web.template
```

You can also inspect all branches:

```bash
git branch -a
```

The Git setup now separates product development from shared Base Template
development:

```text
origin
  = Application repository

template
  = Base Template repository
```

---

## Updating an Application from web.template

When reusable functionality changes in `web.template`, an Application can
retrieve those changes through the `template` remote.

First fetch the newest Base Template state:

```bash
git fetch template
```

Switch to the local Template branch:

```bash
git switch template
```

Integrate the newest remote Template state:

```bash
git merge template/master
```

The local Template branch now contains the latest fetched Base Template state.

Return to the Application branch.

For example:

```bash
git switch master
```

If the concrete Application uses another development branch, switch to that
branch instead.

Then merge the Template changes into the Application:

```bash
git merge template
```

Conceptually:

```text
web.template
      |
      | git fetch template
      v
template/master
      |
      v
local template branch
      |
      | git merge template
      v
Application branch
```

Template changes should always be reviewed before completing the merge.

The Application may contain:

- Product-specific configuration
- Product-specific screens
- Product-specific Redux state
- Branding
- Backend integrations
- Build configuration
- Deployment configuration

Merge conflicts therefore have to be resolved according to architectural
ownership.

The Git `template` branch is only a synchronization mechanism.

It is not an additional architecture layer.

The architecture remains:

```text
Application --> Template --> Core
```

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

The configuration intentionally uses simple key-value properties.

Developers should not need to modify TypeScript or JSON files just to configure
basic Application metadata.

The configuration generator is located at:

```text
src/template/config/build/generateApplicationConfig.mjs
```

It generates:

```text
src/application/generated/applicationConfig.generated.ts
```

Generate the configuration manually with:

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

The application entry point combines concrete Application configuration with
the reusable Template.

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

When implementing functionality, architectural ownership should be determined
before choosing its physical location.

A useful rule is:

```text
Product-specific?
    |
    +--> Application

Reusable application-shell behavior?
    |
    +--> Template

Focused technical capability without UI or product ownership?
    |
    +--> Core
```

Optionality does not create another architecture layer.

An optional feature may still belong to:

```text
Application
Template
Core
```

Ownership is determined by responsibility.

---

## Build and Deployment

The repository currently contains GitHub Actions workflows for production and
test releases.

Release and deployment workflows currently still live in `web.template`
during the architecture migration.

Long term, concrete product release and deployment configuration belongs to
the respective Application repository.

Reusable build tooling may remain part of the Base Template.

---

## Manual Web Build

Before creating a manual web export, generate the Application configuration:

```bash
npm run config:generate
```

Check TypeScript:

```bash
npx tsc --noEmit
```

Then export the Expo web application:

```bash
npx expo export -p web
```

Expo writes the generated web application to:

```text
dist/
```

A recommended local validation sequence is therefore:

```bash
npm run config:generate
npx tsc --noEmit
npx expo export -p web
```

Relevant automated tests should also be executed before producing a final
release.

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

The currently verified workflow performs:

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

The production workflow currently requires the following repository secrets:

```text
FTP_UPLOAD_URL
FTP_USER
FTP_PSWD
PROJECT_NAME
PROJECT_PATH
```

### Archive naming

The generated ZIP archive follows this pattern:

```text
<PROJECT_NAME>_<package.version>_<yyyyMMdd-HHmm>.zip
```

For example:

```text
Agent.Workbench_0.0.4_20260811-0915.zip
```

The actual project name is supplied through:

```text
PROJECT_NAME
```

### GitHub release tag

The GitHub release uses:

```text
v<package.version>
```

For example:

```text
v0.0.4
```

### Current configuration-generation gap

The production workflow currently executes:

```bash
npx expo export -p web
```

directly.

It does not currently explicitly execute:

```bash
npm run config:generate
```

immediately before the export.

Direct Expo commands do not invoke npm lifecycle hooks.

Therefore the generated Application configuration is not currently guaranteed
to be refreshed immediately before the production export.

The desired production sequence is:

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

Detailed production release documentation is available at:

```text
doc/release-workflow.md
```

---

## Test Release

The test release workflow is located at:

```text
.github/workflows/export-put-test-release.yml
```

It provides a separate release path for testing and internal validation.

Production and test releases must remain clearly distinguishable.

Detailed documentation is available at:

```text
doc/test-release.md
```

---

## Project Structure

The current main source structure is:

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

Generated API code should not be broadly moved or rewritten without carefully
reviewing the resulting changes.

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

Contains the reusable Application bootstrap and integration contract.

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

State belongs to the architectural owner of the corresponding functionality.

### `src/template/state/store`

Contains the current Redux store infrastructure.

The existing runtime store and root reducer remain active.

The repository also contains a prepared extensible store composition for
combining Template reducers with Application reducers.

This new store factory is prepared infrastructure and must not be treated as
the active runtime store until it has intentionally been connected and tested.

### `src/template/styles`

Contains reusable theme and styling infrastructure.

### `src/template/update`

Contains reusable update orchestration and update watchers.

---

## Styling

The project uses Unistyles for reusable theme-aware styling.

Styling responsibilities are separated between:

```text
Theme definitions
Themed primitives
Stylistic components
Reusable UI elements
Component-specific layout
```

---

## Theme Structure

Reusable styling infrastructure is located under:

```text
src/template/styles/
```

Theme-specific values such as:

- Colors
- Typography
- Global visual properties

should be defined at the theme level where appropriate.

Component-specific layout properties such as:

- Margin
- Padding
- Alignment
- Flex behavior
- Local component composition

remain close to their corresponding component.

For example, layout behavior for the reusable header is located under:

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

Examples include:

- Buttons
- Cards
- Dialogs
- Dropdowns
- Tables
- Tabs
- Inputs
- Modals
- Common visual building blocks

Detailed component documentation is available at:

```text
doc/components.md
```

---

## Unistyles

The project uses Unistyles as its current styling solution.

Theme-aware styles can be declared through the Unistyles `StyleSheet` API.

Example:

```ts
const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
  },
}));
```

The current application imports the Unistyles configuration during bootstrap.

When changing global visual behavior, prefer extending the reusable theme or
design-system infrastructure instead of duplicating equivalent styles across
screens.

---

## API

API-related source code is located below:

```text
src/api/
```

OpenAPI-based integrations are generated where appropriate.

A typical API development workflow is:

```text
API specification
      |
      v
Update local API definition
      |
      v
Generate API implementation
      |
      v
Review generated changes
      |
      v
Use generated client
```

Generated API files should be reviewed carefully after regeneration.

Broad automated refactoring of generated files should be avoided.

API ownership follows the architecture responsibility model.

Conceptually:

```text
Generic technical API capability
        |
        +--> Core or Template

Product-specific backend integration
        |
        +--> Application
```

The correct owner depends on responsibility, not simply on whether code
communicates with a backend.

---

## State Management

The project uses Redux Toolkit.

Redux itself is not an architecture layer.

State belongs to the architectural layer that owns the corresponding
functionality.

Conceptually:

```text
Template-owned feature
        |
        v
Template Redux state
```

and:

```text
Application-owned feature
        |
        v
Application Redux state
```

The current runtime store is still based on the existing Template store and
root reducer.

A new extensible store factory has been prepared to allow Template and
Application reducers to be composed safely.

Conceptually:

```text
Template reducers
        +
Application reducers
        |
        v
Combined store
```

This new composition is currently prepared infrastructure.

It must not be connected to the runtime until the related typing and hook
integration are ready and tested.

Detailed Redux documentation is available at:

```text
doc/redux-state-management.md
```

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

ADR-0005 supersedes that ownership decision.

Reusable React navigation infrastructure now belongs to Template.

Concrete product navigation configuration belongs to Application.

---

## Documentation

The official project documentation is maintained in the `doc` directory.

The README provides the main developer entry point and an overview of the
architecture, setup and development workflow.

Detailed architecture, runtime, feature and release documentation is maintained
in the documents listed below.

```text
doc/
```

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

The intended repository structure is:

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

A concrete Application repository is connected to the Base Template through
two Git remotes:

```text
origin
    |
    +--> Application repository

template
    |
    +--> web.template repository
```

The initial Git setup is:

```bash
git remote add template git@github.com:EnFlexIT/web.template.git
git fetch template
git branch template template/master
```

The architecture migration is incremental.

Existing functionality should first receive:

```text
clear ownership
stable contracts
clear dependency boundaries
safe extension points
```

before it is physically moved between repositories.