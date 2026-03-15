import { Component, OnInit, computed, signal, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSelectModule } from 'ng-zorro-antd/select';

import { EntityService } from '../../services/entity.service';
import { EntityRecordService } from '../../services/entity-record.service';
import { EntityStore } from '../../store/entity.store';
import { EntityField } from '../../models/entity.model';
import { generateEntityKey } from '../../services/entity-key.util';

@Component({
    selector: 'app-entity-create-page',
    imports: [
        CommonModule,
        FormsModule,
        NzButtonModule,
        NzInputModule,
        NzFormModule,
        NzCardModule,
        NzSelectModule
    ],
    templateUrl: './entity-create.page.html',
    styleUrl: './entity-create.page.less'
})
export class EntityCreatePageComponent implements OnInit, AfterViewInit {
    private entityKeySignal = signal<string>('');

    entity$ = computed(() => {
        const key = this.entityKeySignal();
        const entities = this.entityService.entities$();
        return entities.find(e => generateEntityKey(e.name) === key);
    });

    editableFields$ = computed(() => {
        const entity = this.entity$();
        if (!entity) {
            return [];
        }

        // 'backlink' fields are just read-only, so we don't include them in the form
        return entity.fields.filter(f => f.type !== 'backlink');
    });

    // All form values, keyed by field id
    formData = signal<Record<string, string>>({});

    // Cache for reference-list values to avoid infinite change detection loops
    private refListValueCache = '';
    private refListValueCacheArray: string[] = [];

    @ViewChild('firstInput') firstInput: any;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private entityService: EntityService,
        private entityRecordService: EntityRecordService,
        private entityStore: EntityStore
    ) {}

    getReferenceOptions(field: EntityField){
        return this.entityRecordService.getReferenceOptions(field)
    }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const key = params['key'];
            this.entityKeySignal.set(key);
            const entity = this.entity$();
            if (!entity) {
                this.router.navigate(['/']);
                return;
            }
            // Initialize all fields to empty string
            const initialData: Record<string, string> = {};
            for (const field of entity.fields) {
                initialData[field.id] = '';
            }
            this.formData.set(initialData);
        });
    }

    ngAfterViewInit(): void {
        this.firstInput?.nativeElement?.focus();
    }

    getFieldValue(fieldId: string): string {
        return this.formData()[fieldId] ?? '';
    }

    setFieldValue(fieldId: string, value: string): void {
        this.formData.update(current => ({ ...current, [fieldId]: value }));
    }

    getRefListValues(fieldId: string): string[] {
        const value = this.getFieldValue(fieldId);
        // Cache the array to avoid creating new references on every change detection cycle
        if (value !== this.refListValueCache) {
            this.refListValueCache = value;
            this.refListValueCacheArray = value ? value.split(',') : [];
        }
        return this.refListValueCacheArray;
    }

    setRefListValues(fieldId: string, values: string[]): void {
        const joined = values.join(',');
        this.setFieldValue(fieldId, joined);
    }

    onClickBackButton(): void {
        const entity = this.entity$();
        if (entity) {
            this.router.navigate(['/entity', generateEntityKey(entity.name)]);
        } else {
            this.router.navigate(['/']);
        }
    }

    onClickSubmit(): void {
        const entity = this.entity$();
        if (!entity) {
            return;
        }
        const record = this.entityRecordService.createRecord(entity.id, this.formData());
        this.router.navigate(['/entity', generateEntityKey(entity.name), record.id]);
    }
}
