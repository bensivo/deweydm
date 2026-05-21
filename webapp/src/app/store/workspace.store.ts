import { Injectable, signal } from '@angular/core';

import { Workspace } from '../models/workspace.model';

@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
    private workspacesSignal = signal<Workspace[]>([]);
    private activeWorkspaceIdSignal = signal<string | null>(null);

    public workspaces$ = this.workspacesSignal.asReadonly();
    public activeWorkspaceId$ = this.activeWorkspaceIdSignal.asReadonly();

    setAll(workspaces: Workspace[]): void {
        this.workspacesSignal.set(workspaces);
    }

    getAll(): Workspace[] {
        return this.workspacesSignal();
    }

    getActiveId(): string | null {
        return this.activeWorkspaceIdSignal();
    }

    getActive(): Workspace | undefined {
        const activeId = this.activeWorkspaceIdSignal();
        return this.workspacesSignal().find(w => w.id === activeId);
    }

    add(workspace: Workspace): void {
        this.workspacesSignal.update(workspaces => [...workspaces, workspace]);
    }

    remove(id: string): void {
        this.workspacesSignal.update(workspaces => workspaces.filter(w => w.id !== id));
    }

    setActiveId(id: string): void {
        this.activeWorkspaceIdSignal.set(id);
    }

    setDefault(id: string): void {
        this.workspacesSignal.update(workspaces =>
            workspaces.map(w => ({ ...w, isDefault: w.id === id }))
        );
    }
}
