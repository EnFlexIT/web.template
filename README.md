# web.template

Reusable Base Template for EnFlexIT web applications.

`web.template` provides:

* reusable technical capabilities
* reusable React application-platform functionality
* standard Agent.Workbench functionality
* an explicit integration contract for concrete Applications

The authoritative dependency direction is:

```text id="n1d9oc"
Application --> Template --> Core
```

Standard Agent.Workbench functionality belongs to the Base Template.

Concrete products such as HEMS are Applications that consume the Base Template.

---

## Table of Contents

* [About](#about)
* [Architecture](#architecture)
* [AgentWorkbench Ownership](#agentworkbench-ownership)
* [Repository Model](#repository-model)
* [Requirements](#requirements)
* [Local Development](#local-development)
* [Application Configuration](#application-configuration)
* [Feature Selection](#feature-selection)
* [Application Navigation](#application-navigation)
* [Application Screens](#application-screens)
* [Creating a Concrete Application](#creating-a-concrete-application)
* [Application Integration](#application-integration)
* [Project Structure](#project-structure)
* [State Management](#state-management)
* [Navigation](#navigation)
* [Authentication](#authentication)
* [Server Infrastructure](#server-infrastructure)
* [Update System](#update-system)
* [Design System](#design-system)
* [API Ownership](#api-ownership)
* [Build and Deployment](#build-and-deployment)
* [Manual Web Build](#manual-web-build)
* [Production Release](#production-release)
* [Test Release](#test-release)
* [Architecture Validation](#architecture-validation)
* [Architecture Decisions](#architecture-decisions)
* [Documentation](#documentation)
* [Architecture Summary](#architecture-summary)

---

# About

`web.template` is the reusable EnFlexIT web application platform.

The repository contains two reusable architecture layers:

```text id="3qo612"
Template
Core
```

and the in-repository Agent.Workbench Application composition under:

```text id="4lf6pv"
src/application/
```

The current Agent.Workbench Application composition validates the Application integration contract.

It is not Agent.Workbench.

Reusable platform functionality includes areas such as:

* Application bootstrap
* authentication and session handling
* server selection
* technical server checks
* navigation
* Redux infrastructure
* design system
* notifications
* update infrastructure
* dynamic content
* reusable screens
* runtime utilities
* technical Core capabilities
* standard Agent.Workbench functionality

---

# Architecture

The authoritative dependency direction is:

```text id="v1ovp4"
Application
    |
    v
Template
    |
    v
Core
```

The layers represent architectural responsibility.

They are not merely directory names.

---

## Application

Application contains concrete product composition.

Typical responsibilities include:

* Application identity
* Application metadata
* semantic Template feature selection
* Application-specific navigation extensions
* Application-specific screens
* Application translations
* optional Application-specific Redux state
* concrete product business logic
* concrete product backend integration
* product branding
* product-specific build configuration
* product-specific deployment configuration

Application may use supported Template and Core surfaces.

Template and Core must not depend on concrete Application implementation.

---

## Template

Template contains the reusable application platform.

Typical responsibilities include:

* `TemplateApp`
* `createTemplateApp`
* `ApplicationConfig`
* `ApplicationConfigContext`
* React application shell
* navigation infrastructure
* Template navigation definitions
* Template screen registry
* Redux infrastructure
* authentication and session orchestration
* server selection
* settings
* design system
* notifications
* update orchestration
* localization infrastructure
* reusable screens
* reusable hooks
* reusable components
* standard Agent.Workbench functionality
* Agent.Workbench state
* reusable Agent.Workbench API integration where appropriate

Template may depend on Core.

Template must not depend on a concrete Application.

---

## Core

Core contains focused reusable technical capabilities.

Current high-level areas include:

```text id="2dxk29"
src/core/authentication/
src/core/runtime/
src/core/server/
src/core/update/
```

Typical Core responsibilities include:

* technical authentication helpers
* authentication-related technical types
* runtime helpers
* server normalization
* server validation
* technical server checks
* environment detection
* technical update helpers
* framework-independent technical behavior

Core must not depend on:

```text id="c9n2xu"
Template
Application
```

React presentation and Redux application orchestration generally do not belong in Core.

---

# Agent.Workbench Ownership

Standard Agent.Workbench functionality is intentionally part of the Base Template.

The ownership decision is:

```text id="z64oqp"
Agent.Workbench standard functionality
    -> Template
```

Examples include:

```text id="gac8qw"
Program Start
Data Analyzing
Database configuration
Server configuration
Live Console
Settings
Agent.Workbench navigation
Agent.Workbench state
reusable Agent.Workbench API integration
```

Agent.Workbench is **not** a separate concrete Application in the accepted architecture.

The architecture therefore does not require:

```text id="p6dt2j"
a separate Agent.Workbench Application
a separate Agent.Workbench Application repository
Agent.Workbench state extraction
Agent.Workbench screen extraction
Agent.Workbench navigation extraction
```

Agent.Workbench-related naming alone does not make functionality Application-owned.

Ownership follows responsibility.

---

# Repository Model

The current repository contains:

```text id="mnedw1"
web.template
|
+-- src/application/
|
+-- src/template/
|
+-- src/core/
```

Responsibilities are:

```text id="aujmdf"
src/application/
    Agent.Workbench Application composition

src/template/
    reusable Base Template
    including standard Agent.Workbench functionality

src/core/
    reusable technical capabilities
```

Future concrete Applications such as HEMS may consume the Base Template from their own repositories.

Conceptually:

```text id="cppmc7"
                 web.template
                 Base Template
                      ^
                      |
              +-------+-------+
              |               |
            HEMS        Future Application
```

Agent.Workbench is not shown as a separate consumer because its standard functionality is already part of the Base Template.

---

# Requirements

Local development requires:

* Git
* Node.js
* npm

Verify the installed tools with:

```bash id="pxexkt"
git --version
node -v
npm -v
```

The committed GitHub Actions workflows define the Node.js and npm versions used for automated builds.

When changing release infrastructure, always verify the current workflow YAML rather than relying only on documentation.

---

# Local Development

Clone the repository:

```bash id="y00ns9"
git clone git@github.com:EnFlexIT/web.template.git
```

Enter the repository:

```bash id="mmpoqq"
cd web.template
```

Install dependencies:

```bash id="3ux4ko"
npm install
```

Generate Application configuration:

```bash id="tj7wja"
npm run config:generate
```

Start web development:

```bash id="vyn8gc"
npm run web
```

or:

```bash id="zzdnmj"
npm start
```

Normal npm startup commands are preferred because project lifecycle hooks may perform required setup before Expo starts.

---

## TypeScript Validation

Run:

```bash id="0wx3af"
npx tsc --noEmit
```

---

## Tests

Run the test suite with:

```bash id="tofj8j"
npm test -- --runInBand
```

Run targeted tests when working on a specific subsystem.

---

## Standard Validation Sequence

A useful validation sequence is:

```bash id="e2jp2m"
npm run config:generate
npx tsc --noEmit
npm test -- --runInBand
git diff --check
git status --short
```

---

# Application Configuration

Developer-facing Application configuration is located under:

```text id="ggkcsh"
src/application/config/
```

The current configuration consists of:

```text id="qvwj5r"
application.properties
features.properties
navigation.properties
```

These files have different responsibilities.

---

## application.properties

Contains Application identity and metadata.

Conceptually:

```properties id="yma4zy"
ApplicationId=example-application
ApplicationTitle=Application composition example
ApplicationLogo=../assets/bild.png
ApplicationContact=admin@example.com
ApplicationOwner=EnFlexIT
```

The exact supported property set is defined by the configuration tooling.

Application developers should not need to edit TypeScript or JSON for normal metadata configuration.

---

## features.properties

Controls reusable Template capabilities semantically.

Examples:

```properties id="zusakd"
feature.notifications.enabled=true
feature.appearance.enabled=true
feature.serverSettings.enabled=true
feature.liveConsole.enabled=true
feature.programStart.enabled=true
feature.dataAnalyzing.enabled=true
feature.database.general.enabled=true
```

Application selects the capability.

Template owns the implementation.

---

## navigation.properties

Contains Application-specific navigation extensions.

Example:

```properties id="cruidc"
menu.example.enabled=true
menu.example.caption=exampleApplication
menu.example.parent=settings
menu.example.position=99
menu.example.screen=example-screen
```

Application navigation extends Template navigation.

It does not replace the complete Template navigation tree.

---

## Configuration Generation

Configuration tooling is located under:

```text id="pqp3t1"
src/template/config/build/
```

A central generator is:

```text id="g41zrd"
src/template/config/build/generateApplicationConfig.mjs
```

Generated Application artifacts are written under:

```text id="6y6zmw"
src/application/generated/
```

Generate them with:

```bash id="ydwz1c"
npm run config:generate
```

Conceptually:

```text id="uo46gs"
Application .properties
        |
        v
Template configuration tooling
        |
        v
generated runtime configuration
        |
        v
Application composition
        |
        v
Template runtime
```

Generated TypeScript is runtime/build output.

It is not the normal developer-facing configuration surface.

---

# Feature Selection

Feature ownership and feature enablement are separate concepts.

For example:

```text id="58ly2c"
Live Console
    -> Template-owned

feature.liveConsole.enabled=false
    -> Application selection
```

Disabling a Template feature does not make it Application-owned.

Likewise, enabling a feature does not move its implementation into Application.

---

# Application Navigation

Template owns reusable navigation.

Application owns only concrete Application extensions.

The ownership model is:

```text id="kg2kcz"
Template
|
+-- routing
+-- menu rendering
+-- menu tree construction
+-- Template navigation definitions
+-- Template screen registry
+-- visibility integration
+-- standard Agent.Workbench navigation
+-- Template menu ordering

Application
|
+-- Application-specific navigation extensions
+-- Application-specific screen references
+-- optional custom ordering
```

Conceptually:

```text id="3zqsx7"
Template navigation
        +
Application navigation extensions
        |
        v
runtime navigation
```

Applications must not reproduce the complete Template menu structure.

---

## Internal Navigation IDs

Application configuration must not depend on Template-internal numeric IDs.

Application should express semantic intent.

For example:

```properties id="f58ki6"
menu.example.parent=settings
menu.example.screen=example-screen
```

rather than referencing unstable internal implementation details.

The general rule is:

```text id="q0nomb"
Application describes intent.

Template resolves implementation details.
```

---

## Menu Ordering

Normal Template menu positions are derived from sibling order in the Template menu catalog.

Application custom navigation may optionally provide a position.

When no custom position exists, MenuHub uses a deterministic fallback.

Relevant implementation:

```text id="75tg0n"
src/template/screens/menu/MenuHubScreen.tsx
```

---

# Application Screens

Application-specific screens live under:

```text id="ql7w4g"
src/application/screens/
```

The current Agent.Workbench Application composition contains:

```text id="164zyv"
src/application/screens/ExampleScreen.tsx
```

Application screens are discovered automatically.

Discovery implementation:

```text id="n2tggl"
src/template/config/build/applicationScreenDiscovery.mjs
```

Examples:

```text id="viykqi"
ExampleScreen.tsx
    -> example-screen

ExampleScreen2.tsx
    -> example-screen2

HemsOverviewScreen.tsx
    -> hems-overview-screen
```

The generated registry is:

```text id="6bk0gl"
src/application/generated/applicationScreenRegistry.generated.ts
```

Template must not manually import concrete Application screens.

---

# Creating a Concrete Application

A concrete Application focuses on product-specific composition while consuming reusable Base Template functionality.

HEMS is the primary concrete example.

Conceptually:

```text id="vi78gq"
HEMS Application
        |
        v
web.template
        |
        +-- Template
        |
        +-- Core
```

A concrete Application may provide:

```text id="vxj1fp"
application.properties
features.properties
navigation.properties
Application-specific screens
Application translations
optional Application-specific Redux state
product business logic
product-specific APIs
product branding
product build/deployment configuration
```

The Base Template should not require HEMS-specific implementation.

---

## Consumer Repository Model

A future consumer repository may conceptually contain:

```text id="f496mc"
HEMS Repository
|
+-- Application configuration
+-- Application screens
+-- Application translations
+-- optional Application state
+-- product business logic
+-- product branding
+-- build/deployment
```

and consume:

```text id="l81ybk"
web.template
|
+-- Template
+-- Core
```

The exact repository integration mechanism should be validated with a real consumer rather than inferred from an old Agent.Workbench extraction model.

---

# Application Integration

Template exposes explicit integration contracts.

Important files include:

```text id="arij86"
src/template/application/ApplicationConfig.ts
src/template/application/ApplicationConfigContext.tsx
src/template/application/createTemplateApp.tsx
src/template/application/TemplateApp.tsx
```

Conceptually:

```text id="0m7dxk"
Concrete Application
        |
        v
ApplicationConfig
        |
        v
createTemplateApp(...)
        |
        v
TemplateApp
        |
        v
Template runtime
```

Template defines the reusable contract.

Application provides concrete composition.

---

## No Runtime Product Resolver

Template does not decide which concrete Application is active.

The following model is intentionally avoided:

```text id="pjfcc4"
Template
|
+-- detect HEMS
+-- detect Product A
+-- detect Product B
+-- select Application
```

Instead:

```text id="omr05v"
Concrete Application
        |
        v
Base Template
```

Agent.Workbench is not part of product resolution because standard Agent.Workbench functionality already belongs to Template.

---

# Project Structure

The current main source structure is conceptually:

```text id="yrb739"
src/
├── api/
├── application/
│   ├── config/
│   ├── generated/
│   ├── screens/
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

Detailed structure documentation is maintained in:

```text id="wig3fw"
doc/project-structure.md
```

---

## src/api

Contains API definitions and generated API implementations.

Generated API code must not be broadly rewritten during architecture cleanup.

Ownership depends on responsibility.

An Agent.Workbench-related API name does not automatically make code Application-owned.

---

## src/application

Contains the in-repository Agent.Workbench Application composition and Application integration.

Important areas include:

```text id="xayr7s"
src/application/config/
src/application/generated/
src/application/screens/
src/application/state/
```

The current Agent.Workbench Application composition is not Agent.Workbench.

---

## src/core

Contains focused reusable technical capabilities.

Current areas include:

```text id="3lt5jk"
src/core/authentication/
src/core/runtime/
src/core/server/
src/core/update/
```

Core must remain independent from Template and Application.

---

## src/template

Contains the reusable Base Template platform.

Important areas include:

```text id="5meq4i"
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

Standard Agent.Workbench functionality belongs here where it is part of the reusable Base Template platform.

---

# State Management

The project uses Redux Toolkit.

Redux is an implementation technology, not an architecture layer.

State ownership follows responsibility.

```text id="38rr60"
Template
|
+-- reusable Template state
+-- Agent.Workbench state
+-- Redux infrastructure

Application
|
+-- optional concrete product-specific state
```

Core does not own the application Redux store.

---

## Template Redux Infrastructure

Known store infrastructure includes:

```text id="f6fq3d"
src/template/state/store/
├── createTemplateStore.ts
├── rootReducer.ts
├── store.ts
├── templateReducers.ts
├── types.ts
├── useAppDispatch.ts
└── useAppSelector.ts
```

Standard Agent.Workbench state belongs to Template.

Known area:

```text id="k99tmp"
src/template/state/agent-workbench/
```

This state is not waiting for extraction into a separate Agent.Workbench Application.

---

## Application Redux Extension

Applications may optionally provide product-specific reducers through:

```text id="q9ixsj"
src/application/state/applicationReducers.ts
```

The current Agent.Workbench Application composition does not require meaningful product-specific Redux state.

That is valid.

Application reducers must not override Template-owned reducer keys.

Detailed documentation:

```text id="jjmc1b"
doc/redux-state-management.md
```

---

# Navigation

Reusable React navigation belongs to Template.

Core does not own React navigation infrastructure.

Current navigation ownership is defined by:

```text id="4jehyq"
doc/architecture/decisions/ADR-0005-navigation-infrastructure-in-template.md
```

Template owns:

* navigation infrastructure
* Template navigation definitions
* standard Agent.Workbench navigation
* Template screen registration
* reusable visibility integration
* menu ordering

Application owns:

* Application-specific navigation extensions
* Application-specific screens

---

# Authentication

Authentication responsibilities are split.

```text id="xga4cz"
Core
|
+-- technical authentication helpers
+-- technical auth types
+-- technical request integration

Template
|
+-- login experience
+-- session orchestration
+-- reusable auth state
+-- logout orchestration

Application
|
+-- concrete product-specific auth behavior where required
```

Detailed documentation:

```text id="bytsl0"
doc/authentication.md
```

---

# Server Infrastructure

Server responsibilities are also split.

```text id="kwue01"
Core
|
+-- normalization
+-- validation
+-- technical checks
+-- environment detection

Template
|
+-- server-selection state
+-- connectivity state
+-- server-selection UI
+-- reconnect orchestration

Application
|
+-- product-specific server configuration where required
```

Detailed documentation:

```text id="z6nzha"
doc/server-check-and-switching.md
```

---

# Update System

Update ownership follows the same architecture.

```text id="shoznv"
Core
|
+-- technical update helpers

Template
|
+-- update state
+-- hooks
+-- watchers
+-- notifications
+-- dialogs
+-- reusable update orchestration

Application
|
+-- product-specific update behavior where genuinely required
```

Detailed documentation:

```text id="y95v0c"
doc/update-system.md
```

---

# Design System

Reusable React presentation belongs to Template.

The design system lives under:

```text id="f1tbp7"
src/template/components/design-system/
```

Important areas include:

```text id="u7g4ib"
icons/
stylistic/
themed/
ui-elements/
```

Reusable UI elements include components such as:

* buttons
* cards
* dialogs
* dropdowns
* tables
* tabs
* inputs
* modals
* typography
* icons

Core must not import React presentation components.

Detailed documentation:

```text id="cu30in"
doc/components.md
```

---

## Styling

Reusable theme infrastructure is located under:

```text id="wljcsb"
src/template/styles/
```

The project uses Unistyles for theme-aware styling.

Example:

```ts id="0wpq3s"
const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
  },
}));
```

Global visual behavior should be implemented through the reusable theme/design-system infrastructure where appropriate.

Component-specific layout should remain near the owning component.

---

# API Ownership

API ownership follows responsibility.

Conceptually:

```text id="txvlrf"
generic technical communication
    -> Core where appropriate

reusable Base Template / Agent.Workbench integration
    -> Template where appropriate

concrete product business API
    -> Application
```

Generated API implementation should be treated carefully.

Do not broadly move or rewrite generated files during unrelated architecture cleanup.

---

# Build and Deployment

Concrete consumer Applications should own their product-specific build and deployment configuration.

For example, a future HEMS consumer may own:

```text id="epmgiq"
HEMS release configuration
HEMS deployment destination
HEMS infrastructure configuration
HEMS build workflow
```

The Base Template may provide reusable tooling.

The current `web.template` repository also contains release workflows because it remains runnable and testable itself.

This does not require a separate Agent.Workbench Application repository.

---

# Manual Web Build

Before exporting the web application, generate the Application configuration:

```bash id="xwmu6z"
npm run config:generate
```

Run TypeScript validation:

```bash id="53p5qk"
npx tsc --noEmit
```

Run relevant tests:

```bash id="2tzp87"
npm test -- --runInBand
```

Export:

```bash id="im92l7"
npx expo export -p web
```

Expo writes the web export to:

```text id="s9r12k"
dist/
```

Recommended local sequence:

```bash id="f16h28"
npm run config:generate
npx tsc --noEmit
npm test -- --runInBand
npx expo export -p web
```

---

# Production Release

The production workflow is located at:

```text id="5fs919"
.github/workflows/export-put-release.yml
```

Detailed documentation:

```text id="7jnu72"
doc/release-workflow.md
```

Before relying on documentation, verify the committed workflow.

A release build should deterministically generate Application configuration before Expo export.

Desired sequence:

```text id="2a2vtv"
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

If the current workflow does not contain the explicit generation step, it should be handled as a release-workflow improvement.

---

# Test Release

The test workflow is located at:

```text id="l2wcb9"
.github/workflows/export-put-test-release.yml
```

Detailed documentation:

```text id="odk092"
doc/test-release.md
```

Production and test deployment behavior must remain distinguishable.

The backend/frontend release-type workflow is independent from whether Agent.Workbench is a separate Application.

---

# Architecture Validation

Useful architecture checks include:

```bash id="pxt7sr"
git grep -n "@/application/" -- src/template
```

Template must not import concrete Application implementation.

Review Application imports with:

```bash id="qmrtrt"
git grep -n "@/template/" -- src/application
```

Application may use supported Template integration surfaces.

Do not remove imports blindly based only on grep output.

---

## Full Validation

Before an architecture checkpoint:

```bash id="mrkujh"
npm run config:generate
npx tsc --noEmit
npm test -- --runInBand
git diff --check
git status --short
```

Runtime validation should also be performed when implementation behavior changed.

---

# Architecture Decisions

Architecture Decision Records are stored under:

```text id="1p6af5"
doc/architecture/decisions/
```

Current ADRs include:

```text id="5mtlm4"
ADR-0001-core-first.md
ADR-0002-redux-root-reducer.md
ADR-0003-core-base-template-and-product-applications.md
ADR-0004-separate-menu-engine-and-application-menu.md
ADR-0005-navigation-infrastructure-in-template.md
```

Current status:

```text id="ff2wxk"
ADR-0001 -> Accepted
ADR-0002 -> Accepted
ADR-0003 -> Accepted
ADR-0004 -> Superseded
ADR-0005 -> Accepted
```

Important architectural decisions include:

```text id="8b231o"
Application --> Template --> Core

Agent.Workbench standard functionality -> Template

HEMS -> concrete Application

Navigation infrastructure -> Template

Application navigation -> extensions only

Application screens -> automatic discovery

Application-specific Redux state -> optional
```

ADR-0004 remains as historical context.

ADR-0005 is authoritative for current navigation ownership.

---

# Documentation

Project documentation is maintained under:

```text id="j3hzbb"
doc/
```

---

## Architecture

* [Architecture Vision](doc/architecture/00-vision.md)
* [Core Platform](doc/architecture/01-core-platform.md)
* [Current Architecture State](doc/architecture/05-current-state.md)
* [Application Contract](doc/architecture/application-contract.md)
* [Platform Architecture](doc/architecture/platform-architecture.md)
* [Application Separation](doc/application-separation.md)
* [Project Structure](doc/project-structure.md)

---

## Runtime and Features

* [Authentication](doc/authentication.md)
* [Server Check and Switching](doc/server-check-and-switching.md)
* [Update System](doc/update-system.md)
* [File Configuration Upload](doc/file-configuration-upload.md)
* [Redux State Management](doc/redux-state-management.md)
* [Components](doc/components.md)

---

## Build and Release

* [Production Release Workflow](doc/release-workflow.md)
* [Test Release](doc/test-release.md)

---

## Development and Review

* [Review Notes](doc/review-notes.md)
* [AI Context](doc/ai-context.md)

---

# Legacy Architecture That Must Not Be Reintroduced

The following statements do not describe the accepted architecture:

```text id="3olqah"
"Agent.Workbench is a concrete Application."

"Agent.Workbench requires its own Application repository."

"Agent.Workbench state inside Template is transitional."

"Agent.Workbench screens must move into Application."

"Agent.Workbench navigation must move into Application."

"Application owns all menu definitions."

"Application owns all tab definitions."

"menu.properties is planned Application configuration."

"tabs.properties is planned Application configuration."

"featureFlags.properties is planned Application configuration."

"menuFeatureFlags.properties defines menu visibility."

"tabFeatureFlags.properties defines tab visibility."
```

The current developer-facing configuration is:

```text id="o9nkcx"
application.properties
features.properties
navigation.properties
```

---

# Architecture Summary

The central architecture rule is:

```text id="o9q07i"
Application --> Template --> Core
```

Core provides reusable technical capabilities.

Template provides the reusable application platform.

Standard Agent.Workbench functionality belongs to Template.

Application provides concrete product composition.

The current repository contains:

```text id="wbscrq"
src/application/
    Agent.Workbench Application composition

src/template/
    reusable Base Template
    standard Agent.Workbench functionality

src/core/
    reusable technical capabilities
```

Developer-facing Application configuration uses:

```text id="t9nbq6"
application.properties
features.properties
navigation.properties
```

Application navigation extends Template navigation.

Application screens are discovered automatically.

Application-specific Redux state is optional.

HEMS is a concrete consumer Application.

Future concrete consumer repositories may consume the Base Template without requiring Template to import their implementation.

A separate Agent.Workbench Application repository is not part of the accepted architecture.
