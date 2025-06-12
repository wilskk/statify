# Modal Component Separation Guide

This guide outlines a streamlined approach for structuring modal components in the Statify frontend. The goal is to enhance maintainability, reusability, and clarity with a simple yet robust structure.

## 1. Core Principles

*   **Clarity over Granularity**: Create separate files/folders only when it genuinely improves understanding and reduces complexity. For very simple modals, fewer files might be appropriate.
*   **Logical Grouping**: Group related logic, UI, and type definitions together.
*   **Readability**: Write self-documenting code with clear names. Add comments only for non-obvious logic.

## 2. Recommended Structure (Flexible)

Start with a base structure and expand as needed:

```
ModalName/
├── index.tsx         # Main modal component: layout, core state, event handling
├── hooks/            # Custom React hooks for complex logic, state, side effects
└── types.ts          # TypeScript interfaces and types for this modal (or types/ if many)
```

As your modal grows in complexity, you can introduce:

```
ModalName/
├── components/       # Smaller, reusable UI components specific to this modal
├── services/       # API calls or other external interactions (or services/ if many)
├── utils/         # Shared utility functions specific to this modal (or utils/ if many)
... (and the core files from above)
```

## 3. Component & File Responsibilities

### a. Main Modal Component (`index.tsx`)
*   **Orchestration**: The entry point. Manages overall layout and assembles different parts.
*   **Core State & Event Handling**: Handles primary modal state (e.g., visibility, simple form states) and top-level events (open, close, submit). Delegates complex logic to hooks.

### b. Custom Hooks (`hooks/`)
*   **Business Logic**: Encapsulates complex state management (e.g., `useReducer`, multi-step form logic), side effects (`useEffect`), and data transformations.
*   **Focus**: Keeps `index.tsx` lean and focused on presentation. Hooks should be testable in isolation.
*   **Preparing for Web Workers**: If a hook orchestrates a CPU-intensive task (e.g., client-side processing of large data), consider isolating that intensive logic into pure, dedicated functions (which might reside in `utils/` or be part of the hook initially). These functions should have clear inputs and outputs. This makes it significantly easier to later move this specific logic into a Web Worker, with the hook then managing the communication with the worker.

### c. Type Definitions (`types.ts` or `types/`)
*   **Data Contracts**: Defines all TypeScript interfaces, types, and enums specific to the modal's props, state, and data structures.

### d. Sub-components (`components/`) - *If needed*
*   **UI Decomposition**: Break down the modal's UI into smaller, manageable components if `index.tsx` becomes too large or if parts of the UI are reused within the modal.

### e. Services (`services.ts` or `services/`) - *If needed*
*   **External Interactions**: Isolates API calls or other interactions with external systems (e.g., *via* Web Workers if the service layer orchestrates worker tasks, browser APIs). This makes hooks and components cleaner.

### f. Utilities (`utils.ts` or `utils/`) - *If needed*
*   **Shared Helpers**: Contains pure utility functions used by multiple parts of the modal (hooks, components) that don't fit naturally within them. Avoid creating this for single-use helpers.
*   **Candidate for Web Workers**: Computationally intensive utility functions (e.g., complex parsing, data algorithms) are prime candidates for being moved into a Web Worker if they cause UI unresponsiveness. Designing them as pure functions from the start facilitates this transition.

## 4. Example: The `Print` Modal

The `Print` modal (`frontend/components/Modals/File/Print/`) demonstrates these principles. While it might use a more granular structure (e.g., separate `services/` and `utils/` directories), the core idea is to separate concerns:

*   `index.tsx`: Orchestrates the print dialog.
*   `hooks/`: Manages print settings state, validation, and print submission logic.
*   `types/`: Defines print option types.
*   `components/`: May contain specific UI elements like a print preview area.
*   `services/`: Handles the actual print job submission to a backend or browser API.

For a simpler modal, some of these (like `components/` or `services/`) might be integrated into `index.tsx` or `hooks/` directly.

## 5. Code Style and Readability

*   **Naming**: Use clear, descriptive names for variables, functions, and components.
*   **Minimal Comments**:
    *   Write code that is as self-explanatory as possible.
    *   **Avoid comments that state the obvious** (e.g., `// increment counter` for `count++`).
    *   Use comments primarily to explain *why* a particular piece of complex or non-obvious logic exists, or to clarify business rules.
*   **Simplicity**: Prefer straightforward code. Avoid over-engineering.
*   **Consistency**: Follow established coding patterns and formatting within the project.

## 6. Benefits

*   **Maintainability**: Easier to understand, modify, and debug.
*   **Scalability**: Structure can adapt as modal complexity grows.
*   **Testability**: Smaller, focused units (especially hooks and services) are easier to test.

## 7. Conclusion

This flexible, principles-based approach to modal structure aims to keep development efficient and the codebase healthy. Adapt the level of separation to the complexity of the modal at hand, always prioritizing clarity and maintainability. 