# Update System

## 1. Purpose

The update system checks whether updates are available for the frontend
WebApp or the backend server.

It supports:

- loading the configured update strategy
- checking for frontend updates
- checking for backend updates
- displaying update notifications
- manually installing updates
- reloading the WebApp after a frontend update
- reconnecting and logging out after a backend update

The update system does not automatically install updates.

The `autoUpdate` setting controls automatic update checks only.
Installation always requires an explicit user action.

---

## 2. Scope

The update system consists of four areas:

```text
Update System

├── Redux state and API communication
├── Background watchers
├── Update user interface
└── Browser reload infrastructure