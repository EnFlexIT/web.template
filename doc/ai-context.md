# AI Context for EnFlexIT/web.template

> **Purpose**
>
> This document provides the complete project context for AI assistants working on the
> **EnFlexIT/web.template** repository.
>
> It should be used as the primary context whenever a new ChatGPT conversation starts.
>
> The goal is that an AI assistant understands:
>
> - the project architecture
> - development philosophy
> - folder structure
> - workflows
> - coding conventions
> - documentation strategy
> - current roadmap
> - future direction

---

# Project Overview

`web.template` is a reusable React Native / Expo Web / TypeScript application template for EnFlex.IT web applications.

Originally developed as a reusable base template, it has evolved into a complete application framework that provides common infrastructure for future EnFlex.IT projects.

The template focuses on providing reusable building blocks rather than project-specific functionality.

Current infrastructure includes:

- Authentication
- OpenID Connect
- Update System
- Release Management
- Test Release Management
- Server Switching
- Server Availability Checks
- Static Menu Infrastructure
- Notification System
- User Profile Handling
- File Configuration Upload
- Feature Flags
- Theme Support
- Localization
- Version Information
- Redux Infrastructure

---

# Project Vision

The long-term goal is to evolve `web.template` into a reusable framework for all EnFlex.IT web applications.

Whenever possible, new functionality should be implemented as reusable infrastructure instead of application-specific code.

Future applications should be able to reuse:

- authentication
- navigation
- server communication
- update handling
- configuration management
- feature management
- branding
- localization
- user management
- release management

without duplicating code.

---

# Tech Stack

- React Native
- Expo Web
- TypeScript
- Redux Toolkit
- React Navigation
- React Native Unistyles
- Axios
- i18next
- OpenAPI generated clients
- GitHub Actions

---

# Project Architecture

```
Application
│
├── UI
│
├── Navigation
│
├── Redux State
│
├── API Layer
│
├── Services
│
├── Localization
│
├── Components
│
├── Update System
│
└── Server Communication
```

---

# Important Project Areas

## API

```
src/api
```

Contains

- OpenAPI definitions
- generated clients
- API configuration
- custom services

Important files:

- apiConfig.ts
- publicApiConfig.ts

---

## Components

```
src/components
```

Contains reusable UI.

Examples

- Cards
- Buttons
- Dialogs
- Footer
- Header
- Notification Popup
- Routing helpers

AI should always reuse existing components before creating new ones.

---

## Redux

```
src/redux
```

Shared application state.

Important slices include

- updateSlice
- serverSlice
- connectivitySlice
- notificationSlice
- sessionTimeSlice
- appReleaseSlice
- featureFlags
- themeSlice

Redux should only contain shared application state.

---

## Screens

```
src/screens
```

Contains all application screens.

Important areas

Login

Settings

Notifications

Logout

Server Settings

Update Screens

User Profile

Server Switch Overlay

Offline Overlay

Menu Hub

---

# Main Features

## Authentication

Supports

- JWT
- OpenID Connect

including

- Login
- Logout
- Session Time
- JWT Renewal
- User Profile

---

## Server Management

Supports

- Server Switching
- Availability Check
- Connectivity State
- Footer Status

---

## Update System

Supports

- Update Detection
- Update Execution
- Release Handling

---

## Release Management

GitHub Actions

Normal Release

```
export-put-release.yml
```

Test Release

```
export-put-test-release.yml
```

---

## Notifications

Central notification infrastructure.

---

## Static Menu

Menu and tabs are configurable through feature flags.

---

## Localization

```
assets/locales
```

Languages

- German
- English

Feature-based localization.

---

# Documentation Strategy

README.md

↓

Overview

↓

doc/

↓

Detailed documentation

Examples

- authentication.md

- update-system.md

- redux.md

- components.md

- release-workflow.md

- ai-context.md

README should stay small.

---

# Release Workflow

Development

↓

Git Commit

↓

GitHub

↓

GitHub Action

↓

Release Export

↓

Test Release

↓

Validation

↓

Production Release

---

# Coding Guidelines

AI should

✔ follow existing architecture

✔ reuse existing components

✔ preserve project structure

✔ keep functions focused

✔ use descriptive names

✔ avoid duplicated logic

✔ prefer reusable solutions

Avoid

❌ rewriting large files unnecessarily

❌ changing architecture without request

❌ introducing duplicate functionality

❌ bypassing Redux architecture

---

# AI Working Rules

Before changing code:

1. Understand the existing implementation.

2. Search for reusable components.

3. Search for existing Redux logic.

4. Search for localization.

5. Search for existing APIs.

6. Explain architectural impact before large changes.

7. Prefer incremental improvements.

---

# Protected Areas

Unless explicitly requested, never redesign

- Authentication

- Redux Architecture

- Navigation

- Update Workflow

- Localization Structure

- API Generation

---

# Documentation Rules

Every feature documentation should explain

- Purpose

- Architecture

- Data Flow

- Configuration

- Important Files

- Troubleshooting

- Future Extensions

---

# Commit Message Convention

Examples

```
feat(login): Add OpenID redirect

fix(update): Prevent duplicate update check

docs: Improve authentication documentation

refactor(api): Simplify service initialization
```

---

# Current Roadmap

Current development focus

✔ Server Master

✔ Update Process

✔ Base Server Settings

✔ OpenID Connect

✔ Event Logging

✔ Build Types

✔ Feature Installation

✔ Central Configuration

Future ideas

- Version History

- Automatic Release Notes

- Feature Management

- Dynamic Branding

- Configurable Applications

---

# Future Architecture

Long-term planned infrastructure

Application

↓

Configuration

↓

Feature Management

↓

Branding

↓

Authentication

↓

Updates

↓

Version History

↓

Notifications

↓

Business Modules

---

# AI Prompt

Whenever starting a new conversation:

```

I am working on the EnFlexIT/web.template repository.

Please use this AI context document as the primary project documentation.

Always

- understand existing architecture first
- reuse existing components
- preserve coding style
- avoid duplicate functionality
- explain architectural decisions
- keep documentation inside doc/

Current task:

[INSERT CURRENT TASK HERE]

```