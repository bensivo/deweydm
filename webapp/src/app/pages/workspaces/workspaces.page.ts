import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';

import { WorkspaceService } from '../../services/workspace.service';
import { WorkspaceStore } from '../../store/workspace.store';
import { Workspace } from '../../models/workspace.model';

@Component({
    selector: 'app-workspaces-page',
    imports: [
        CommonModule,
        FormsModule,
        NzListModule,
        NzButtonModule,
        NzModalModule,
        NzTagModule,
        NzInputModule,
        NzFormModule,
    ],
    templateUrl: './workspaces.page.html',
    styleUrl: './workspaces.page.less'
})
export class WorkspacesPageComponent {
    isAddModalOpen = signal(false);
    newWorkspaceName = '';

    constructor(
        private workspaceService: WorkspaceService,
        private workspaceStore: WorkspaceStore,
        private router: Router,
    ) {}

    get workspaces$() {
        return this.workspaceService.workspaces$;
    }

    get activeWorkspaceId$() {
        return this.workspaceStore.activeWorkspaceId$;
    }

    onClickAddWorkspace(): void {
        this.newWorkspaceName = '';
        this.isAddModalOpen.set(true);
    }

    async onConfirmAddWorkspace(): Promise<void> {
        if (!this.newWorkspaceName.trim()) {
            return;
        }
        await this.workspaceService.createWorkspace(this.newWorkspaceName.trim());
        this.isAddModalOpen.set(false);
    }

    onCancelAddWorkspace(): void {
        this.isAddModalOpen.set(false);
    }

    async onClickSwitch(workspace: Workspace): Promise<void> {
        await this.workspaceService.setActiveWorkspace(workspace.id);
        this.router.navigate(['/home']);
    }

    async onClickSetDefault(workspace: Workspace): Promise<void> {
        await this.workspaceService.setDefaultWorkspace(workspace.id);
    }

    async onClickDelete(workspace: Workspace): Promise<void> {
        await this.workspaceService.deleteWorkspace(workspace.id);
    }
}
