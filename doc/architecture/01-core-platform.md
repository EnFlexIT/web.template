# Core Architecture

## Purpose

The Core provides the reusable infrastructure shared by every EnFlexIT web application.

It is designed to be application-independent and must not contain any business-specific logic.

Applications such as HEMS, Assist or future projects build on top of the Core.

---

# Overview

The Core consists of several independent modules.

```
Core
│
├── Bootstrap
├── Authentication
├── Authorization
├── Configuration
├── API
├── Redux
├── Navigation
├── Update
├── Notifications
├── User Profile
├── Dynamic Content
├── Shared Components
├── Localization
└── Theme
```

---

# Core Modules

## Bootstrap

### Responsibility

Starts the application and initializes all required services.

### Examples

- Application startup
- Service initialization
- Provider registration
- Dependency initialization

---

## Authentication

### Responsibility

Handles user authentication.

### Examples

- Login
- Logout
- OpenID Connect
- Token management
- Session handling

---

## Authorization

### Responsibility

Controls access to application resources.

### Examples

- Roles
- Permissions
- Protected routes
- Feature access

---

## Configuration

### Responsibility

Loads and manages the application configuration.

### Examples

- Branding configuration
- Feature configuration
- Environment configuration
- Server configuration

---

## API

### Responsibility

Provides communication with backend services.

### Examples

- REST client
- Request handling
- Authentication headers
- Error handling
- API configuration

---

## Redux

### Responsibility

Provides global application state management.

### Examples

- Store
- Root reducer
- Shared slices
- Middleware

Business-specific state should remain inside the application.

---

## Navigation

### Responsibility

Provides reusable navigation infrastructure.

### Examples

- Routing
- Menu rendering
- Dynamic navigation
- Route guards

---

## Update

### Responsibility

Handles update detection and update workflow.

### Examples

- Version checking
- Update notification
- Reload handling
- Update status

---

## Notifications

### Responsibility

Displays application notifications.

### Examples

- Information
- Warning
- Errors
- Background events

---

## User Profile

### Responsibility

Provides user information and profile management.

### Examples

- User data
- Preferences
- Profile settings

---

## Dynamic Content

### Responsibility

Loads content dynamically from backend services.

### Examples

- Dynamic pages
- Dynamic menus
- Dynamic widgets

---

## Shared Components

### Responsibility

Reusable UI components.

### Examples

- Buttons
- Cards
- Dialogs
- Inputs
- Layout components

Applications should reuse these components instead of creating duplicates.

---

## Localization

### Responsibility

Provides multilingual support.

### Examples

- i18next
- Translation loading
- Language switching

---

## Theme

### Responsibility

Defines the visual appearance.

### Examples

- Colors
- Typography
- Icons
- Light/Dark Mode

---

# Design Rules

The Core follows the following rules:

## Rule 1

The Core must never contain business logic.

---

## Rule 2

The Core must never reference a specific application.

---

## Rule 3

Every module should have a single responsibility.

---

## Rule 4

Communication between modules should happen through clearly defined interfaces.

---

## Rule 5

Applications should extend the Core instead of modifying it.

---

# Dependencies

```
Core

↓

Base Template Modules

↓

Product Applications
```

Dependencies always point downward.

The Core does not depend on Applications.

---

# Long-Term Objective

The Core should become a stable platform that rarely changes.

Most future development should happen inside applications rather than inside the Core.

This keeps the platform maintainable while allowing individual applications to evolve independently.