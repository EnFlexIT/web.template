# ADR-0002

## Title

Extract Redux Root Reducer

---

## Status

Accepted

---

## Context

The Redux configuration was previously concentrated inside `store.ts`.

This made reducer composition, testing and future state modularization more difficult.

The platform architecture now separates responsibilities between:

```text
Application --> Template --> Core
```

Reusable Redux infrastructure belongs to Template.

State ownership follows architectural responsibility.

---

## Decision

The Redux root reducer is defined separately from store creation.

The relevant Template store infrastructure includes:

```text
src/template/state/store/
├── createTemplateStore.ts
├── rootReducer.ts
├── store.ts
├── templateReducers.ts
├── types.ts
├── useAppDispatch.ts
└── useAppSelector.ts
```

The separation allows store creation and reducer composition to evolve independently.

Template owns reusable reducers and standard Agent.Workbench state.

Concrete Applications may optionally provide Application-specific reducers through the supported extension point.

---

## Redux Ownership

The architectural ownership model is:

```text
Template
|
+-- reusable Redux infrastructure
+-- Template reducers
+-- Agent.Workbench standard state

Application
|
+-- optional Application-specific reducers
+-- concrete product-specific state
```

Core does not own the application Redux store.

Agent.Workbench standard reducers are not Application reducers.

---

## Application Reducer Extension

Concrete Applications may provide additional reducers when they own genuine product-specific state.

The current Application extension point is:

```text
src/application/state/applicationReducers.ts
```

Application reducers must not override Template-owned reducer keys.

The current Agent.Workbench Application composition does not require meaningful Application-specific Redux state.

This is valid.

---

## Consequences

### Advantages

* store creation is separated from reducer composition
* Redux infrastructure is easier to test
* reusable Template reducers have a clear owner
* optional Application reducers can be integrated without reversing dependencies
* future state composition can evolve without concentrating all logic in `store.ts`
* ownership remains consistent with `Application --> Template --> Core`

### Tradeoffs

* reducer ownership must be kept explicit
* Template and Application reducer keys must remain conflict-free
* state must be classified by responsibility rather than by naming alone

---

## Architecture Rules

This ADR establishes the following rules:

1. Redux infrastructure belongs to Template.
2. Root reducer composition remains separate from store creation.
3. Standard Agent.Workbench state belongs to Template.
4. Concrete product-specific state may belong to Application.
5. Application reducers are optional.
6. Application reducers must not override Template-owned reducer keys.
7. Core must not depend on the application Redux store.
8. Template must not import concrete Application reducer implementations.

---

## Result

The root reducer remains separated from store creation.

The resulting state architecture supports:

```text
Template reducers
        +
optional Application reducers
        |
        v
Redux store
```

while preserving the dependency direction:

```text
Application
    |
    v
Template
    |
    v
Core
```
