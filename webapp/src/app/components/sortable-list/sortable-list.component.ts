import {
    Component,
    input,
    output,
    TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { SortableDirective, SortableEvent } from './sortable.directive';

/**
 * Generic sortable list component that renders a draggable list of items
 * and emits events when the item order changes. Accepts an optional template
 * for customizing how each item is rendered.
 */
@Component({
    selector: 'app-sortable-list',
    imports: [CommonModule, SortableDirective],
    templateUrl: './sortable-list.component.html',
    styleUrl: './sortable-list.component.less'
})
export class SortableListComponent<T> {
    // Input: array of items to display
    items = input.required<T[]>();

    // Input: optional template for rendering each item
    itemTemplate = input<TemplateRef<{ $implicit: T }>>();

    // Output: emitted when items are reordered
    onItemsChanged = output<T[]>();

    /**
     * Handle item reordering via drag and drop.
     *
     * @param event SortableEvent with oldIndices (array of source positions)
     *              and newIndex (destination position for the group)
     */
    onSort(event: SortableEvent): void {
        const currentItems = this.items();
        const reorderedItems = [...currentItems];

        // Extract items in original order
        const itemsToMove = event.oldIndices.map(index => currentItems[index]);

        // Remove items in reverse order to avoid index shifts
        event.oldIndices
            .slice()
            .sort((a, b) => b - a)
            .forEach(index => reorderedItems.splice(index, 1));

        // Insert all items at their destination position
        reorderedItems.splice(event.newIndex, 0, ...itemsToMove);

        this.onItemsChanged.emit(reorderedItems);
    }
}
