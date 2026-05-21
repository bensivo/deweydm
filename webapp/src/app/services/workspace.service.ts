import { Inject, Injectable } from '@angular/core';

import { Workspace } from '../models/workspace.model';
import { WorkspaceStore } from '../store/workspace.store';
import { BACKEND_API } from '../backend/backend-api.token';
import { Backend } from '../backend/backend-api.interface';
import { EntityService } from './entity.service';
import { EntityRecordService } from './entity-record.service';
import { ViewService } from './view.service';
import { DocumentService } from './document.service';
import { NoteService } from './note.service';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
    constructor(
        private workspaceStore: WorkspaceStore,
        private entityService: EntityService,
        private entityRecordService: EntityRecordService,
        private viewService: ViewService,
        private documentService: DocumentService,
        private noteService: NoteService,
        @Inject(BACKEND_API) private backend: Backend,
    ) {}

    get workspaces$() {
        return this.workspaceStore.workspaces$;
    }

    get activeWorkspace$() {
        return this.workspaceStore.getActive.bind(this.workspaceStore);
    }

    /**
     * Loads all workspaces from the backend, updates the store, and sets the
     * active workspace to whichever has is_default = true. Then triggers entity
     * and record loading for that workspace.
     */
    async loadAll(): Promise<void> {
        const workspaces: Workspace[] = await this.backend.workspaceGetAll();
        this.workspaceStore.setAll(workspaces);

        const defaultWorkspace = workspaces.find(w => w.isDefault) ?? workspaces[0];
        if (defaultWorkspace) {
            await this.setActiveWorkspace(defaultWorkspace.id);
        }
    }

    /**
     * Creates a new workspace with the given name.
     * @param name - The display name of the workspace.
     */
    async createWorkspace(name: string): Promise<void> {
        const workspace: Workspace = await this.backend.workspaceCreate(name);
        this.workspaceStore.add(workspace);
    }

    /**
     * Deletes a workspace by id.
     * @param id - The workspace ID to delete.
     */
    async deleteWorkspace(id: string): Promise<void> {
        await this.backend.workspaceDelete(id);
        this.workspaceStore.remove(id);
    }

    /**
     * Switches the active workspace on the client and reloads all entities and
     * records scoped to the new workspace.
     * @param id - The workspace ID to activate.
     */
    async setActiveWorkspace(id: string): Promise<void> {
        this.workspaceStore.setActiveId(id);
        await this.entityService.loadAll(id);
        await this.entityRecordService.loadAll();
        await this.viewService.loadAll(id);
        await this.documentService.loadAll(id);
        await this.noteService.loadAll(id);
    }

    /**
     * Persists the default workspace flag to the backend and updates the store.
     * @param id - The workspace ID to mark as default.
     */
    async setDefaultWorkspace(id: string): Promise<void> {
        await this.backend.workspaceSetDefault(id);
        this.workspaceStore.setDefault(id);
    }
}
