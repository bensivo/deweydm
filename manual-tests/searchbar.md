### Search by Display Name - Click
Users can:
- Search records by their display name across all entities
- Click a result to navigate to that record
- See the entity name in the dropdown for context

Steps:
1. Import the dataset `project-management-populated.json`
2. Type 'Alpha' in the searchbar
3. Click the 'Alpha Sprint' result
4. Verify you navigate to the Sprint detail page for 'Alpha Sprint'

### Search by Display Name - Keyboard (Arrow Keys)
Users can:
- Use arrow keys to navigate search results
- Press Enter to navigate to a result

Steps:
1. Import the dataset `project-management-populated.json`
2. Type 'Story' in the searchbar
3. Press down arrow to highlight a result
4. Press Enter
5. Verify you navigate to that story's detail page

### Search by Display Name - Keyboard (Quick Enter)
Users can:
- Press Enter immediately after typing to select the top result

Steps:
1. Import the dataset `project-management-populated.json`
2. Type 'Alpha' in the searchbar
3. Press Enter immediately
4. Verify you navigate to the first result (Alpha Sprint)

### Case-Insensitive Search
Users can:
- Search with any case and find matching records

Steps:
1. Import the dataset `project-management-populated.json`
2. Type 'alpha' (lowercase) in the searchbar
3. Verify 'Alpha Sprint' appears in results
4. Clear and type 'ALPHA' (uppercase)
5. Verify same results appear

### No Results Message
Users can:
- See feedback when their search has no matches

Steps:
1. Import the dataset `project-management-populated.json`
2. Type 'xyz999nonexistent' in the searchbar
3. Verify "No records found" message appears

### Cross-Entity Search
Users can:
- Search across multiple entities at once
- Distinguish results by entity name

Steps:
1. Import the dataset `project-management-populated.json`
2. Type 'Alice' in the searchbar
3. Verify results show both stories and other entities that reference 'Alice'
4. Each result displays `(Entity: entityName)` for clarity
