# Notes Feature Planning

Core Question: What form should 'notes' take in the application? 


## Option 1 - Notes as properties
Description:
- Create a new property with a 'MD' field type, which users could use as a note-taking application

Pros:
- Allows setting semantic meanings to notes, e.g. a "Meeting" entity with 3 separate fields "transcript", "meeting notes", and "exec summary"
- Notes won't have to be handled separately, just need to handle editing and rendering UIs. 

Cons:
- Could be too restrictive on actual user workflows - most unstructured notes are written first, then pushed into something like this. So allowing the user to write the note first, then link entities later might be a better workflow. 
- Limits notes to only 1 entity, but that doesn't fit cleanly into how most notes are used. A "Meeting transcript" might get linked to 1 interaction, 3 users, and a project. 

## Option 2 - Notes as a reserved entity
Description:
- Just like "Documents", create "Notes" as a resserved entity which just always exists for all workspaces. 
- Users can create notes without creating any specific entities, and then can link those to other entities as they wish. 
- Add new field types, "Note" and "Note List", to be able to link notes to an entity, with some kind of semantic field label. 

Pros:
- Fits user workflows better, creating the note first, then linking to relevant entities. 

Cons:
- Do we lose the ability to have semantic notes? It'd still be nice.


## Decision - Notes as a reserved entity
We'll go with option 2

Justification: 
- This option makes note authorship the easiest, and in most knowledge bases, authorship is the hardest part
- This opens up some interesting workflows with AI - create the note, then let the AI system link to entities

Potential Consequences:
- Users that wanted to be able to create a 'Note' entity would have to use some other name
- Users that don't want notes at all will see this as unecessary cog load
- If we want users to use thsi app as their main note-taking tool, we have to build a UX that's just as good as things like obsidian, notion, confluence, etc..
- We might have to implement a folder system in the notes themselves, so users can organize notes. 