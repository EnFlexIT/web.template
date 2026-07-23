# Current Architecture

## Purpose

This document provides an initial classification of the current
`web.template` source structure.

The classification reflects the current repository state and serves as the
basis for the ongoing architectural separation into:

- Core Platform
- Base Template Modules
- Optional Modules
- Product Applications

The migration is performed incrementally. Only completed, tested and reviewed
changes are reflected in this document.

---

# Implemented Core Platform Modules

The first reusable technical modules have already been extracted into the
dedicated `src/core` directory.

The current Core structure is:

```text
src/core
├── authentication
│   ├── http
│   ├── jwt
│   ├── logout
│   └── session
├── server
└── update