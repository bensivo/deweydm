# Columns Badge Feature Plan

## Overview
Add a visual indicator badge to the "Columns" button in the entity-list toolbar that shows how many columns are currently selected, matching the pattern used by the "Filters" button.

Example display: "Columns (5 of 6)" when 5 out of 6 available fields are visible.

## Feature Details

### User Experience
- User sees "Columns" button in toolbar
- Badge appears adjacent to button text showing format: `(X of Y)` where:
  - X = number of currently visible columns
  - Y = total number of available columns for the entity
- Badge styling matches the existing filter badge design (light blue background with blue text)
- Badge only shows when at least one column is hidden (i.e., X < Y)

### Display Logic
- Badge visibility: Show when `visibleFields.length < entity.fields.length`
- Badge text format: `(${visibleFieldCount} of ${totalFieldCount})`
- Only the visible count and total count need to be displayed—no computation of which specific columns are selected is needed

## Implementation Details

### Changes to `entity-list.page.ts`

Add a helper method to the component:
```typescript
getVisibleColumnsInfo(): { visibleCount: number; totalCount: number; shouldShowBadge: boolean } {
  const entity = this.entity$();
  if (!entity) return { visibleCount: 0, totalCount: 0, shouldShowBadge: false };
  
  const committed = this.columnModalState.committed$();
  const visibleCount = committed.size;
  const totalCount = entity.fields.length;
  
  return {
    visibleCount,
    totalCount,
    shouldShowBadge: visibleCount < totalCount
  };
}
```

This method:
- Reads the current entity from `this.entity$()`
- Gets the committed visible fields from `this.columnModalState.committed$()`
- Computes visible count (size of committed set)
- Computes total count (number of entity fields)
- Returns both counts and a boolean indicating if badge should display
- Works with the reactive signal system—template will re-evaluate when `committed$` changes

### Changes to `entity-list.page.html`

Update the Columns button (line 22) from:
```html
<button nz-button nzSize="large" (click)="onClickColumnsButton()">Columns</button>
```

To:
```html
<button nz-button nzSize="large" (click)="onClickColumnsButton()">
  Columns
  <div class="toolbar-columns-badge" *ngIf="getVisibleColumnsInfo().shouldShowBadge">
    <span class="badge">({{ getVisibleColumnsInfo().visibleCount }} of {{ getVisibleColumnsInfo().totalCount }})</span>
  </div>
</button>
```

Structure mirrors the existing filters badge (lines 23-29):
- Badge wrapped in a div with class `toolbar-columns-badge`
- Badge span displays the count information
- Conditionally rendered with `*ngIf` only when badge should show

### Changes to `entity-list.page.less`

Add new CSS rule after the existing `.toolbar-filters-badge` rule (after line 132):

```less
.toolbar-columns-badge {
  display: inline-block;
  margin-left: 8px;

  .badge {
    display: inline-block;
    padding: 4px 8px;
    background-color: #e6f4ff;
    color: #1890ff;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }
}
```

This is identical to the `.toolbar-filters-badge` styling, maintaining visual consistency.

## Testing Strategy

1. **Column Selection**: Navigate to entity list, click Columns button to open modal
2. **Badge Appearance**: With all columns selected, badge should not appear (X = Y)
3. **Badge Update**: Uncheck one column and confirm, badge should appear showing "(X-1 of Y)"
4. **Badge Disappearment**: Check all columns again and confirm, badge should disappear
5. **Multiple Columns**: Test with different numbers of hidden columns to ensure count is accurate
6. **Reactivity**: Verify badge updates immediately after confirming column changes (no page refresh needed)

## Notes

- **No state changes needed**: Uses existing `columnModalState.committed$()` signal
- **No service changes needed**: Pure presentation layer
- **Consistent pattern**: Follows the exact pattern of the filters badge
- **No new methods required in services**: All data already available in component
- **Performance**: Minimal—just counts set size and array length, no expensive operations
