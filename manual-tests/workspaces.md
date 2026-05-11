### Switch Workspaces - Entities Are Scoped
Users can:
- Create two workspaces each with different entities
- Switch between them and see only that workspace's data

Steps:
1. Open the app and navigate to `/workspaces`
2. Click "+ New Workspace", enter "Work A", confirm
3. Click "+ New Workspace", enter "Work B", confirm
4. Click "Switch" on "Work A"
5. Navigate to Workspace Config, create an entity called "Alpha Entity"
6. Navigate to `/workspaces`, click "Switch" on "Work B"
7. Navigate to Workspace Config
8. Verify "Alpha Entity" is NOT listed — only "Work B" entities appear

---

### Switch Workspaces - Records Are Scoped
Users can:
- Add records to one workspace and verify they don't appear in another

Steps:
1. With "Work A" active, navigate to the entity list for "Alpha Entity"
2. Create a record with some values
3. Navigate to `/workspaces`, click "Switch" on "Work B"
4. Navigate to Workspace Config — verify no "Alpha Entity" exists
5. Navigate back to `/workspaces`, click "Switch" on "Work A"
6. Navigate to "Alpha Entity" list
7. Verify the record you created in step 2 is still there

---

### App Startup Loads Default Workspace
Users can:
- Set a default workspace and have it load automatically on next launch

Steps:
1. Create two workspaces: "Work A" and "Work B"
2. Create an entity "Alpha Entity" while "Work A" is active
3. Navigate to `/workspaces`, click "Set Default" on "Work A"
4. Verify the "Default" badge appears on "Work A"
5. Quit and relaunch the app
6. Navigate to Workspace Config
7. Verify "Alpha Entity" is listed — "Work A" was loaded on startup

---

### Set Default Workspace - Badge Updates
Users can:
- Change which workspace is the default and see the badge move

Steps:
1. Open `/workspaces`
2. Verify one workspace has a "Default" badge
3. Click "Set Default" on a different workspace
4. Verify the "Default" badge moves to the new workspace
5. Verify the previously-default workspace no longer shows a "Default" badge

---

### Create Workspace - Appears in List
Users can:
- Create a new workspace and see it immediately in the list

Steps:
1. Navigate to `/workspaces`
2. Note the current number of workspaces listed
3. Click "+ New Workspace", enter "My New Workspace", confirm
4. Verify "My New Workspace" appears in the list without a page reload
5. Verify it does NOT have an "Active" or "Default" badge

---

### Delete Workspace - Removed from List
Users can:
- Delete a non-active workspace and have it removed from the list

Steps:
1. Navigate to `/workspaces`
2. Create a workspace "Temp Workspace" if fewer than 2 exist
3. Ensure "Temp Workspace" is not the active workspace (switch to another if needed)
4. Click "Delete" on "Temp Workspace"
5. Verify "Temp Workspace" is removed from the list immediately

---

### Delete Active Workspace - Button Disabled
Users can:
- See that the Delete button is disabled for the currently active workspace

Steps:
1. Navigate to `/workspaces`
2. Identify which workspace has the "Active" badge
3. Verify its "Delete" button is disabled or absent
4. Verify all other workspaces have an enabled "Delete" button

---

### Switch Workspaces - Active Badge Updates
Users can:
- See the "Active" badge move to the new workspace after switching

Steps:
1. Navigate to `/workspaces`
2. Note which workspace has the "Active" badge
3. Click "Switch" on a different workspace
4. After being redirected to `/home`, navigate back to `/workspaces`
5. Verify the "Active" badge is now on the workspace you switched to
6. Verify the previously-active workspace no longer shows an "Active" badge

---

### Default Workspace - Backward Compatibility
Users can:
- Open the app with pre-existing entity data and have it assigned to a "Default" workspace automatically

Steps:
1. Open the app fresh (or with a database that has entities but no workspaces)
2. Navigate to `/workspaces`
3. Verify a "Default" workspace exists with the "Default" and "Active" badges
4. Navigate to Workspace Config
5. Verify all pre-existing entities are visible under the active "Default" workspace
