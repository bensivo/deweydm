import * as sqlite3 from 'sqlite3';

import { WorkspaceService } from '../../../electron/src/service/workspace.service';
import { EntityService } from '../../../electron/src/service/entity.service';
import { EntityRecordService } from '../../../electron/src/service/entity-record.service';
import { ColumnVisibilityService } from '../../../electron/src/service/column-visibility.service';
import { DocumentService } from '../../../electron/src/service/document.service';
import { NoteService } from '../../../electron/src/service/note.service';
import { ViewService } from '../../../electron/src/service/view.service';

export type FlagType = 'string' | 'number' | 'json' | 'csv' | 'file-path' | 'boolean';

export interface FlagDefinition {
    name: string;
    description: string;
    required: boolean;
    type: FlagType;
}

export interface CommandContext {
    db: sqlite3.Database;
    documentsDir: string;
    services: {
        workspace: WorkspaceService;
        entity: EntityService;
        entityRecord: EntityRecordService;
        columnVisibility: ColumnVisibilityService;
        document: DocumentService;
        note: NoteService;
        view: ViewService;
    };
}

export interface CommandDefinition {
    resource: string;
    action: string;
    description: string;
    flags: FlagDefinition[];
    run: (args: Record<string, unknown>, ctx: CommandContext) => Promise<unknown>;
}
