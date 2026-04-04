### Text Filter - Contains

Users can filter records by text field using "contains" operator.

Setup:
1. Load the 'Project Tracker' quickstart template
2. Go to 'Tasks' entity list

Steps:
1. Click the "Filters" button to show the filters section
2. Click "+ Add Filter"
3. Select a text field (like "Name")
4. Select operator "Contains"
5. Type "Design" in the value input
6. Press Enter
7. Verify only stories with "Design" in the name appear

### Text Filter - Equals

Users can filter records by exact text match.

Setup:
1. Load the 'Project Tracker' quickstart template
2. Go to 'Tasks' entity list

Steps:
1. Click the "Filters" button
2. Click "+ Add Filter"
3. Select a text field
4. Select operator "Equals"
5. Type an exact value (e.g., a story name)
6. Click away from the input
7. Verify only records with exact match appear

### Number Filter

Users can filter records by number fields with comparison operators.

Setup:
1. Load the 'Project Tracker' quickstart template
2. Go to 'Tasks' entity list

Steps:
1. Click the "Filters" button
2. Click "+ Add Filter"
3. Select a number field (like "Story Points")
4. Select operator "Greater Than"
5. Type "5" in the value input
6. Press Enter
7. Verify only stories with points greater than 5 appear

### Multiple Filters - AND Logic

Users can apply multiple filters together; all must match.

Setup:
1. Load the 'Project Tracker' quickstart template
2. Go to 'Tasks' entity list

Steps:
1. Click the "Filters" button
2. Click "+ Add Filter"
3. Select a text field, operator "Contains", type "Design"
4. Press Enter
5. Click "+ Add Another Filter"
6. Select a number field (like "Story Points")
7. Select operator "Less Than"
8. Type "10"
9. Press Enter
10. Verify only stories matching BOTH conditions appear (contains "Design" AND points < 10)

### Remove Filter

Users can remove filters from the list.

Setup:
1. Load the 'Project Tracker' quickstart template
2. Go to 'Tasks' entity list with filters applied

Steps:
1. Click the "Filters" button
2. Click "+ Add Filter" twice to create 2 filters
3. Set up both filters with different criteria
4. Click the X button on the first filter row
5. Verify that filter is removed and table updates
6. Click X on the remaining filter
7. Verify all stories appear again (no filters)

### Filter Badge Count

Users can see a count badge showing how many filters are active.

Setup:
1. Load the 'Project Tracker' quickstart template
2. Go to 'Tasks' entity list

Steps:
1. Verify no badge appears with 0 filters
2. Click the "Filters" button
3. Click "+ Add Filter" and set it up
4. Verify badge appears showing "1"
5. Click "+ Add Another Filter" and set it up
6. Verify badge shows "2"
7. Remove a filter
8. Verify badge shows "1"

### Filter Persistence Across Entities

Users can use filters on different entities without mixing them.

Setup:
1. Load the 'Project Tracker' quickstart template

Steps:
1. Go to 'Tasks' entity list
2. Click "Filters" and add a filter
3. Go to 'Tasks' entity list
4. Verify no filters appear (filters from Tasks don't carry over)
5. Add a different filter to Tasks
6. Go back to 'Tasks'
7. Verify the Tasks filter is still there (intact)
8. Go back to 'Tasks'
9. Verify the Tasks filter is still there

### Reference Field Filter

Users can filter by reference fields.

Setup:
1. Load the 'Project Tracker' quickstart template
2. Go to 'Tasks' entity list

Steps:
1. Click "Filters"
2. Click "+ Add Filter"
3. Select a reference field (like "Epic")
4. Verify operator options are for references (equals, not-equals)
5. Select an epic from the dropdown
6. Press Enter
7. Verify only stories linked to that epic appear

### Option Field Filter

Users can filter by option fields with predefined values.

Setup:
1. Load the 'Project Tracker' quickstart template
2. Go to 'Tasks' entity list

Steps:
1. Click "Filters"
2. Click "+ Add Filter"
3. Select an option field (like "Status")
4. Select an option value from the dropdown (e.g., "In Progress")
5. Press Enter
6. Verify only stories with that status appear

### Enter Key Applies Filter

Users can press Enter to apply a filter without clicking away.

Setup:
1. Load the 'Project Tracker' quickstart template
2. Go to 'Tasks' entity list

Steps:
1. Click "Filters"
2. Click "+ Add Filter"
3. Select a text field, operator "Contains"
4. Type a value in the input
5. Press Enter (don't click away)
6. Verify the filter is applied immediately

### Blur Applies Filter

Users can click away from a filter input to apply it.

Setup:
1. Load the 'Project Tracker' quickstart template
2. Go to 'Tasks' entity list

Steps:
1. Click "Filters"
2. Click "+ Add Filter"
3. Select a number field, operator "Greater Than"
4. Type a value in the input
5. Click on another input field (blur)
6. Verify the filter is applied immediately

### Filter Toggle Button

Users can show/hide the filters section.

Setup:
1. Load the 'Project Tracker' quickstart template
2. Go to 'Tasks' entity list with filters applied

Steps:
1. Add a filter so badge shows
2. Click "Filters" button
3. Verify filters section appears
4. Click "Filters" button again
5. Verify filters section hides
6. Click "Filters" button
7. Verify the same filters are still there (not deleted)
