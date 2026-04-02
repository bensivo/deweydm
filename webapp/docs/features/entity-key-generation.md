# Entity Key Generation

## Description
Converts entity names into URL-friendly slugs (keys) for use in route parameters. Transforms text by lowercasing, trimming whitespace, replacing spaces with hyphens, and removing special characters. Enables deterministic, readable URLs for entity pages (e.g., `/entity/my-entity-name/record-id`).

## Trigger
- User creates or navigates to an entity
- Any component/service needs to reference an entity in a URL

## Data Flow
1. **User creates entity** → `workspace-config.page.ts:onClickCreateEntityButton()` calls `EntityService.createEntity(name, pluralName)`
2. **EntityService** → `entity.service.ts:createEntity()` adds entity to `EntityStore`
3. **Navigation** → Multiple pages call `generateEntityKey(entity.name)` when building route links:
   - `entity-list.page.ts:155` → `router.navigate(['/entity-create', generateEntityKey(...)])`
   - `entity-detail.page.ts:127` → `router.navigate(['/entity', generateEntityKey(...)])`
   - `entity-reference.component.ts:70` → returns key for `[routerLink]` binding
4. **Route Resolution** → Route parameters contain key (e.g., `:key` in `/entity/:key/:id`)
5. **Page Lookup** → Pages match incoming route key to entity:
   - `entity-list.page.ts:47` → `computed(() => entities.find(e => generateEntityKey(e.name) === key))`
   - `entity-detail.page.ts:44` → Same pattern to resolve entity from route param
6. **Display in Workspace** → `workspace-config.page.ts:88` calls `getEntityKey(name)` for sidebar links and key previews

## State Changes
- **Route Parameter**: `:key` segment set when navigating to entity pages
- **Entity Lookup**: Computed signal in page components derives `entity$` by matching route key against all entities
- **No data mutations**: Key generation is pure, stateless function

## External Integrations
None. Pure string transformation with no external dependencies.

## Important Notes
- Key generation is deterministic: same name always produces same key
- Works as inverse lookup: route key matches against multiple entity names to find the entity object
- Used throughout app for URL construction, avoiding need to store keys in Entity model
- Handles edge cases: consecutive spaces, leading/trailing whitespace, non-alphanumeric chars
- Component tree: `App` (calls in template for nav links) → Pages (in computed signals for lookups) → Services/Components (for navigation)
