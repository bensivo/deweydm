# Test Cases

- Feature: CRUD Entities
  - TC: Create, List, View, Delete Entities
  - TC: Entities appear in side-nav

- Feature: CRUD Records
  - TC: Create record from entity-list page
  - TC: Create record from global create button
  - TC: See records in entity-list page
  - TC: Edit record
  - TC: Delete record
  - TC: Bulk create records
  - TC: Bulk edit records

- Feature: Entity Fields
  for all basic field types (short-text, long-text, number, option): 
    - TC: Add that field to an entity
    - TC: Edit that field on a record, with appropriate inputs
    - TC: View that field on a record, in record-detail
    - TC: View that field on a record, in the entity-list view (if applicable)

  for reference, reference-list, backlink fields:
    - TC: Add that field to an entity, with appropriate field configs
    - TC: Edit that field on a record, with appropriate inputs
    - TC: Add new linked record inline from edit page
    - TC: View that field on a record, in record-detail, as a link
    - TC: View that field on a record, in entity-list, as a link

- Feature: Record Browsing
  - TC: Customize pagination
  - TC: Go to page 2, click on record, then go back (preserves page state)
  - TC: Local search within entity, by name, desc, any fields
  - TODO: Local seaerch by name of reference or reference-list
  - TC: Filter by fields:
    - string: equals, not equals, contains, not contains
    - option: equals, not equals
    - reference: equals, not equals
    - number: equals, lt, gt, lte, gte
  - TODO: Filter by fields (extension):
    - option: one of
    - reference-list: one of
  - TC: Order by field
  - TC: Multiple order by (do first, then second, etc.)
  - TODO: Order by option, use order of options (not alphabetical)
  - TC: Column visibility toggles

- Feature: Views
  - TC: Create view from filters
  - TC: Delete view
  - TODO: Update view in-place
  - TODO: Don't show 'save as view' from a view

- Feature: Global Search
  - TC: search by name
  - TC: select entity by clicking
  - TC: arrows + Enter to select entity
  - TODO: keyboard shortcut to global search

- Feature: Workspaces
  - TC: create new workspaces
  - TC: create in workspace, and switch:
    - entities
    - records
    - views
    - documents
    - notes
  - TC: set default workspace, load on start
  - TC: delete workspace

- Feature: Documents
  - TC: Upload document
  - TC: Set name, description
  - TC: Preview doc types:
    - jpeg
    - png
    - pdf
  - TC: Download doc
    - BUG: no button for previewed images
  - TC: Search docs by name
  - TODO: Search docs by description
  - TODO: Link records to doc (from doc page)
  - TC: Link records to doc (from record page)
 
- Feature: Notes
  - TC: Create new note
  - TC: MD shortcuts for:
    - headings with #
    - bold with **
    - italic with * or _
    - unordered lists
      - BUG: duplicate bullet in nested lists
      - BUG: shift-tab to get out of ordered list doens't work
    - numbered lists
    - inline codeblocks with `
      - BUG: styling for inline codeblocks
    - BUG: multiline code blocks with ```
  - TODO: paste in markdown text
  - TODO: paste in images
  - TODO: auto-save
  - TC: link note to records
  - TC: unlink note from records

- Feature: CLI
  - TC: CRUD workspaces
  - TC: CRUD entities
  - TC: CRUD records
  - TC: CRUD documents
  - TC: CRUD notes
  - TODO: search

- Feature: Import Export
  - TC: Export entities in a worksapce
  - TC: Import workspace entities