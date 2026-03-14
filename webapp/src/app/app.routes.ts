import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home/home.page';
import { WorkspaceConfigPageComponent } from './pages/workspace-config/workspace-config.page';
import { EntityConfigPageComponent } from './pages/entity-config/entity-config.page';
import { EntityListPageComponent } from './pages/entity-list/entity-list.page';
import { EntityCreatePageComponent } from './pages/entity-create/entity-create.page';
import { EntityDetailPageComponent } from './pages/entity-detail/entity-detail.page';
import { EntityBulkCreatePageComponent } from './pages/entity-bulk-create/entity-bulk-create.page';
import { ListsPageComponent } from './pages/lists/lists.page';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomePageComponent },
  { path: 'workspace-config', component: WorkspaceConfigPageComponent },
  { path: 'workspace-config/entity/:key', component: EntityConfigPageComponent },
  { path: 'entity-create/:key', component: EntityCreatePageComponent },
  { path: 'entity-bulk-create/:key', component: EntityBulkCreatePageComponent },
  { path: 'entity/:key/:id', component: EntityDetailPageComponent },
  { path: 'entity/:key', component: EntityListPageComponent },
  { path: 'lists/:id', component: ListsPageComponent }
];
