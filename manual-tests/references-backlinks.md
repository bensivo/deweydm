## Entity Config Tests
Testing the entity configuration features of the app. The ability to create entities, define their fields, and link them to each other


### CRUD Entities
Users can:
- Create an entity
- Delete an entity
- Add basic fields to an entity
- Rename an entity

Steps:
1. Import the test dataset `empty.json`
2. Go to Workspace Config
3. Use "+Add Entity" to create 2 entities, called "Epics", "Stories"
4. Delete them

### References, Reference Links, Backlinks
Users can:
- Create reference fields, and use them appropriately
- Create reference-list fields, and use them appropriately
- Create backlink fields, and see them appropriately

Steps:
1. Import the data `project-management-skeleton.json`
2. Configure the 'story' entity, add a field 'Epic' of type 'reference'
3. Configure the 'story' entity, add a field 'Assignees' of type 'reference-list'
4. Configure the 'epic' entity, add a field 'Stories' of type 'Backlink'

5. Bulk create 2 people, 'Alice' and 'Bob'
6. Create 1 epic, 'Project Alpha'
7. Create 2 stories, 'Fuck around' and 'Find out'
   1. Assign both to the epic
   2. Assign Alice and Bob to 'Fuck around'
   3. Assign just Bob to 'Find out'

8. Find the story, verify that links to the epic and asignees work
9. Find the epic, verify that the 2 stories show up 


### Edit References, Reference Links
Users can:
- Edit a 'reference' or 'reference-link' field appropriately

Steps:
1. Import the data `project-management-populated.json`
2. Edit any of the stories
   1. Switch the epic
   2. Switch the assignees


### Delete referenced field
Users can:
- Choose to cascade delete or not

Steps:
1. Import the data `project-management-populated.json`
2. Go to 'Project alpha', and delete it
3. (not implemented yet) See teh option to cascade delete, or set to null, or replace referenc