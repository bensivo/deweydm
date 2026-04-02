# Modal State Management

## Description
Reusable utility class for managing modal open/close state with "pending" and "committed" data patterns. Maintains two separate copies of data—one displayed in the modal (pending) and one persisted (committed)—to support confirmation/cancellation workflows without losing original state.

## Trigger
- User clicks "Columns" or "Select Fields" button in a component
- Component calls `modalState.open()` to initialize the modal
- Modal visibility is bound to `modalState.isOpen$`

## Data Flow

1. **Component initialization** (`entity-list.page.ts`, `entity-bulk-create.page.ts`, `lists.page.ts`):
   - Instantiate `ModalState` with initial data and optional copy function
   - Example: `columnModalState = new ModalState<Set<string>>(new Set(), (set) => new Set(set))`

2. **Modal open** → `ModalState.open()` is called:
   - Syncs `pending$` from current `committed$` state using provided `copyFn`
   - Sets `isOpen$` to true
   - Template binds `[(nzVisible)]="modalState.isOpen$"` to trigger ng-zorro modal

3. **User interaction in modal**:
   - Component directly updates `pending$` signal with user changes
   - Example: `columnModalState.pending$.set(newValue)`

4. **User confirms** → `ModalState.confirm()` is called:
   - Copies `pending$` to `committed$` using `copyFn`
   - Sets `isOpen$` to false
   - Modal closes with confirmed changes persisted

5. **User cancels** → `ModalState.cancel()` is called:
   - Sets `isOpen$` to false without updating `committed$`
   - Pending changes are discarded
   - Modal closes, state reverts to last committed

6. **Computed derived state**:
   - `visibleFields$` or similar computed signal filters based on `committed$` value
   - Template reads from `committed$` to display persisted state
   - Pending changes visible only within the modal

## State Changes

- `isOpen$`: false → true (open) → false (confirm/cancel)
- `pending$`: updated with user input while modal is open; reverted on cancel
- `committed$`: remains unchanged until confirm is called; then synced from pending$
- Derived signals (e.g., `visibleFields$` in entity-list) react only to `committed$` changes, ensuring UI updates after confirmation

## External Integrations
None. ModalState is a self-contained utility class using Angular Signals. No API calls, side effects, or external dependencies.

## Important Notes

- **Copy function is critical**: Entities like `Set` and arrays require a copy function to avoid reference-based mutations. Primitives can use default identity function.
- **Signals pattern**: Uses writable signals; components can call `.set()` and `.update()` on pending$ directly for flexibility.
- **Read-only committed state**: Generally used as `committed$()` in computed signals; mutation only via `.confirm()`.
- **Multiple instances**: Each feature can have multiple independent ModalState instances (e.g., entity-list has one for columns, entity-bulk-create has one for fields).
- **Framework agnostic**: Uses only Angular's Signal API; easily adoptable in other components without modification.
