# Vision

## Purpose

The current `web.template` project has evolved beyond a simple application template.

Its long-term goal is to become a reusable platform that serves as the common foundation for multiple EnFlexIT web applications.

Examples include:

- HEMS
- Assist
- WebPortal
- Future customer-specific applications

Instead of maintaining multiple independent applications with duplicated functionality, all common infrastructure should be implemented only once inside the Core.

Each application should only provide its own business logic and configuration.

---

# Motivation

Today, different applications require many identical features, for example:

- Authentication
- OpenID Connect
- Update System
- Notifications
- User Profile
- Server Management
- Dynamic Navigation
- Shared UI Components
- Dynamic Content
- Internationalization

Maintaining these features separately increases development effort, testing effort and long-term maintenance costs.

A shared Core allows improvements to be implemented once and reused by every application.

---

# Vision

The future architecture separates the project into two major parts.

```
                 Applications
        ┌────────────────────────────┐
        │ HEMS                       │
        │ Assist                     │
        │ WebPortal                  │
        │ Future Applications        │
        └──────────────┬─────────────┘
                       │
                       ▼
                Shared Core Platform
        ┌────────────────────────────┐
        │ Bootstrap                  │
        │ Authentication             │
        │ Navigation                 │
        │ Redux                      │
        │ API                        │
        │ Notifications              │
        │ Update System              │
        │ User Profile               │
        │ Dynamic Content            │
        │ Shared Components          │
        │ Localization               │
        │ Theme                      │
        └────────────────────────────┘
```

The Core contains all reusable infrastructure.

Applications extend the Core by providing their own:

- Branding
- Feature configuration
- Menus
- Screens
- Widgets
- Backend endpoints
- Business logic

---

# Goals

The architecture should achieve the following goals:

- Create a reusable platform for multiple applications.
- Reduce duplicated code.
- Clearly separate infrastructure from business logic.
- Simplify maintenance and testing.
- Allow new applications to be created with minimal development effort.
- Improve scalability for future projects.
- Keep the Core independent from individual applications.

---

# Design Principles

The architecture follows these principles:

1. The Core must not depend on any application.

2. Applications depend on the Core.

3. Shared functionality belongs to the Core.

4. Business-specific functionality belongs to the application.

5. Configuration should be preferred over code duplication.

6. Refactoring should be performed incrementally to minimize risk and preserve stability.

---

# Long-Term Objective

The final result should be a modular platform where new applications can be created primarily by adding configuration and business functionality instead of copying existing projects.

This architecture enables sustainable growth while keeping the platform maintainable and extensible over time.