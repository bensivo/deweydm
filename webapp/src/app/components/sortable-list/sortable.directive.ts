import {
    Directive,
    ElementRef,
    Output,
    EventEmitter,
    AfterViewInit,
    OnDestroy
} from '@angular/core';
import Sortable, { MultiDrag } from 'sortablejs';

Sortable.mount(new MultiDrag());

export interface SortableEvent {
    oldIndices: number[];
    newIndex: number;
}

@Directive({
    selector: '[sortable]',
    standalone: true
})
export class SortableDirective implements AfterViewInit, OnDestroy {
    @Output() sortableSort = new EventEmitter<SortableEvent>();

    private sortableInstance: Sortable | null = null;

    constructor(private el: ElementRef<HTMLElement>) { }

    ngAfterViewInit(): void {
        this.sortableInstance = Sortable.create(this.el.nativeElement, {
            handle: '.sortable-handle',
            ghostClass: 'sortable-ghost',
            multiDrag: true,
            onEnd: (e) => {
                if (e.oldIndicies && e.oldIndicies.length > 0) {
                    // Multiple items were moved together as a group
                    const oldIndices = e.oldIndicies.map((item: any) => item.index);
                    const newIndex = e.newIndicies[0].index;

                    this.sortableSort.emit({ oldIndices, newIndex });
                    return;
                }

                if (e.oldIndex === undefined || e.newIndex === undefined) {
                    return;
                }

                // Single item was moved
                this.sortableSort.emit({
                    oldIndices: [e.oldIndex],
                    newIndex: e.newIndex
                });
            }
        });
    }

    ngOnDestroy(): void {
        this.sortableInstance?.destroy();
        this.sortableInstance = null;
    }
}
