# Inline Create for Reference, Reference-List, and Backlink Fields

## Goal

On the Entity Detail page, allow the user to quickly create a new linked record directly from a reference, reference-list, or backlink field, without navigating away from the page. The newly created record is automatically linked to the field that triggered the create.

## User Stories

1. **Reference field (Story -> Epic):** While viewing or editing a Story that has a `reference` field pointing to Epic, the user clicks a "+ Create" button under the Epic field. A modal opens to create a new Epic. On submit, the Epic is created and the Story's reference field is set to the new Epic's id.
2. **Reference-list field:** Same as above, but the new record's id is appended to the comma-separated list of reference ids.
3. **Backlink field (Epic -> Story):** While viewing an Epic that has a `backlink` field listing Stories, the user clicks "+ Create" under the Story backlink field. A modal opens to create a new Story; the new Story's reference field (the one that produces the backlink, `backlinkSourceFieldId`) is pre-populated with the current Epic's id. The Story is created and immediately appears in the backlink list.

## Affected Files

### Edited
- `webapp/src/app/pages/entity-detail/entity-detail.page.html` - add "+ Create" buttons under the three field types, and a single inline-create modal at the bottom of the template.
- `webapp/src/app/pages/entity-detail/entity-detail.page.ts` - add state and handlers for the inline-create flow.
- `webapp/src/app/pages/entity-detail/entity-detail.page.less` - small spacing for the "+ Create" button under each field.

### Reused (no edits needed)
- `webapp/src/app/components/global-create/form-modal.component.ts` (`FormModalComponent`, selector `app-global-create-form`) - already a generic, reusable "create a record for entity X with form data Y" modal. Inputs: `isOpen`, `entity`, `formData`. Outputs: `onSubmit`, `onCancel`.
- `EntityRecordService.createRecord(entityId, data)` - creates a record and returns it.
- `EntityRecordService.updateRecord(id, data)` - used to write the new record's id back into the current record's reference / reference-list field.
- `EntityStore.getById(entityId)` - to look up the target Entity for the modal.

## Design

### State (entity-detail.page.ts)

Add three signals to track the inline-create flow:

```ts
// Whether the inline-create modal is open
isInlineCreateModalOpen = signal(false);

// The Entity being created in the modal (e.g. Epic or Story)
inlineCreateEntity = signal<Entity | null>(null);

// Pre-populated form data passed into the modal
inlineCreateFormData = signal<Record<string, string>>({});

// Context: which field on the current record triggered the create,
// so we know how to wire up the link after the record is created.
// - For reference / reference-list: the field on the CURRENT record to write the new id into.
// - For backlink: null (the link is established via the new record's own field, set via formData).
private inlineCreateTriggerField = signal<EntityField | null>(null);
```

### Click Handler

A single handler dispatches based on field type:

```ts
onClickInlineCreate(field: EntityField): void {
    const currentRecord = this.record$();
    const currentEntity = this.entity$();
    if (!currentRecord || !currentEntity) return;

    let targetEntityId: string | null = null;
    let initialFormData: Record<string, string> = {};

    if (field.type === 'reference' || field.type === 'reference-list') {
        targetEntityId = field.referenceEntityId ?? null;
        // No prefill on the new record; we wire the link after create.
    } else if (field.type === 'backlink') {
        targetEntityId = field.backlinkSourceEntityId ?? null;
        // Prefill the source field on the new record with the current record id.
        if (field.backlinkSourceFieldId) {
            initialFormData[field.backlinkSourceFieldId] = currentRecord.id;
        }
    }

    if (!targetEntityId) return;
    const targetEntity = this.entityStore.getById(targetEntityId);
    if (!targetEntity) return;

    this.inlineCreateTriggerField.set(field);
    this.inlineCreateEntity.set(targetEntity);
    this.inlineCreateFormData.set(initialFormData);
    this.isInlineCreateModalOpen.set(true);
}
```

### Submit Handler

```ts
async onInlineCreateSubmit(data: Record<string, string>): Promise<void> {
    const triggerField = this.inlineCreateTriggerField();
    const targetEntity = this.inlineCreateEntity();
    const currentRecord = this.record$();
    if (!triggerField || !targetEntity || !currentRecord) return;

    try {
        const newRecord = await this.entityRecordService.createRecord(targetEntity.id, data);

        if (triggerField.type === 'reference') {
            // Overwrite the reference field on the current record.
            const newData = { ...currentRecord.data, [triggerField.id]: newRecord.id };
            await this.entityRecordService.updateRecord(currentRecord.id, newData);
        } else if (triggerField.type === 'reference-list') {
            // Append new id to the comma-separated list.
            const existing = currentRecord.data[triggerField.id] ?? '';
            const ids = existing ? existing.split(',') : [];
            ids.push(newRecord.id);
            const newData = { ...currentRecord.data, [triggerField.id]: ids.join(',') };
            await this.entityRecordService.updateRecord(currentRecord.id, newData);
        }
        // For backlink, the link was established via the prefilled field on the new record; nothing to do here.

        // If in edit mode, also reflect the change in editData so the user sees the new id immediately.
        if (this.isEditMode() && (triggerField.type === 'reference' || triggerField.type === 'reference-list')) {
            const updatedRecord = this.record$();
            if (updatedRecord) {
                this.editData.set({ ...updatedRecord.data });
            }
        }

        this.messageService.success(`${targetEntity.name} created and linked`);
    } catch (error) {
        this.messageService.error(`Failed to create ${targetEntity.name}`);
    }

    this.isInlineCreateModalOpen.set(false);
    this.inlineCreateTriggerField.set(null);
    this.inlineCreateEntity.set(null);
    this.inlineCreateFormData.set({});
}

onInlineCreateCancel(): void {
    this.isInlineCreateModalOpen.set(false);
    this.inlineCreateTriggerField.set(null);
    this.inlineCreateEntity.set(null);
    this.inlineCreateFormData.set({});
}
```

### Template Changes (entity-detail.page.html)

Add a "+ Create" button under each of the three relevant field types. The button should appear in both view mode and edit mode so users can use it either way. Use small button styling consistent with the existing "+ New" buttons in the Notes and Documents cards.

For the `reference` field block (view mode), after the existing `<app-entity-reference>` / `<span>—</span>`:
```html
<button nz-button nzType="default" nzSize="small" class="inline-create-btn"
        (click)="onClickInlineCreate(field)">+ Create</button>
```

For the `reference-list` view block, after the list of links:
```html
<button nz-button nzType="default" nzSize="small" class="inline-create-btn"
        (click)="onClickInlineCreate(field)">+ Create</button>
```

For the `backlink` view block, after the list of links:
```html
<button nz-button nzType="default" nzSize="small" class="inline-create-btn"
        (click)="onClickInlineCreate(field)">+ Create</button>
```

For the edit-mode `reference` and `reference-list` `<nz-select>` blocks, also add the same button below the select so the user can inline-create while editing.

At the bottom of the template, add the modal:
```html
<app-global-create-form
    [isOpen]="isInlineCreateModalOpen()"
    [entity]="inlineCreateEntity()"
    [formData]="inlineCreateFormData()"
    (onSubmit)="onInlineCreateSubmit($event)"
    (onCancel)="onInlineCreateCancel()">
</app-global-create-form>
```

### Imports

In `entity-detail.page.ts`, add:
```ts
import { FormModalComponent } from '../../components/global-create/form-modal.component';
import { Entity } from '../../models/entity.model';
```
and include `FormModalComponent` in the component's `imports` array.

### Styles (entity-detail.page.less)

Add a small top margin to the inline-create button so it sits cleanly under the field value/list:
```less
.inline-create-btn {
    margin-top: 8px;
}
```

## Edge Cases & Notes

- If `field.referenceEntityId` (for reference / reference-list) or `field.backlinkSourceEntityId` / `field.backlinkSourceFieldId` (for backlink) is missing or the target entity is not found, the click handler does nothing.
- Backlink links are not written explicitly to the current record - they are derived from the new record's reference field, which we pre-populate via `inlineCreateFormData`.
- For `reference-list`, append rather than overwrite so existing links are preserved.
- The `FormModalComponent` already excludes `backlink` fields from the form, so the prefilled backlink-source field (a normal `reference` field on the source entity) shows up normally and the user can change it if they want.
- After create + link, the existing signal-based reactivity on `entity$` / `record$` / `linkedNotes$` style computed signals will cause the view to re-render with the new link.

## Out of Scope

- No changes to the entity-create page itself.
- No new service methods - all behavior is composed from existing `createRecord` / `updateRecord` calls in the page component.
- No new store properties.
- No backend changes.

## Manual Test Plan

1. Create entities Epic and Story, where Story has a reference field "epic" pointing to Epic, and Epic has a backlink field "stories" derived from Story.epic.
2. Open a Story detail page. Verify "+ Create" appears under the Epic field. Click it, fill out the modal, submit. The Story's Epic field should now show the new Epic.
3. Repeat in edit mode - the inline create should still link the new Epic and the edit form should reflect it.
4. Open an Epic detail page. Verify "+ Create" appears under the Stories backlink. Click it, fill out the form (note that the Epic field is pre-populated with the current Epic id). Submit. The new Story appears in the backlink list.
5. Create an entity with a reference-list field and verify that inline-create appends rather than overwrites existing links.
