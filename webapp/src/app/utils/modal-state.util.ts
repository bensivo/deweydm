import { signal, Signal, WritableSignal } from '@angular/core';

/**
 * Reusable modal state manager for handling open/close and pending/confirmed data patterns.
 * Manages two copies of data: one for display (pending) and one committed.
 * Use this for modals that have confirmation/cancel buttons with a "pending" working state.
 *
 * Usage:
 * ```ts
 * // In component
 * modal = new ModalState(initialValue, (v) => deepCopy(v));
 *
 * onClickOpenButton(): void {
 *     modal.open();
 * }
 *
 * onConfirm(): void {
 *     modal.confirm();
 * }
 *
 * onCancel(): void {
 *     modal.cancel();
 * }
 *
 * // In template
 * [open]="modal.isOpen$ | signal"
 * [(ngModel)]="modal.pending$ | signal"
 * ```
 */
export class ModalState<T> {
    isOpen$: WritableSignal<boolean>;
    pending$: WritableSignal<T>;
    committed$: WritableSignal<T>;

    private copyFn: (value: T) => T;

    constructor(
        initialValue: T,
        copyFn?: (value: T) => T
    ) {
        this.committed$ = signal<T>(initialValue);
        this.pending$ = signal<T>(initialValue);
        this.isOpen$ = signal<boolean>(false);
        this.copyFn = copyFn || ((v) => v);
    }

    /**
     * Open the modal and sync pending to current committed data
     */
    open(): void {
        this.pending$.set(this.copyFn(this.committed$()));
        this.isOpen$.set(true);
    }

    /**
     * Confirm changes: copy pending to committed and close modal
     */
    confirm(): void {
        this.committed$.set(this.copyFn(this.pending$()));
        this.isOpen$.set(false);
    }

    /**
     * Cancel changes: discard pending and close modal (reverts to committed)
     */
    cancel(): void {
        this.isOpen$.set(false);
    }
}
