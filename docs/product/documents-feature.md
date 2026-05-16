# Documents Feature Planning

Core Question: how should we implement "documents" in this application? Where documents are unstructured files that could be related to multiple entities, and are often the source of real information. documents could be MD, Docx, PPT, PDF, or raw text. 

Question: Shoudl all documents be MD files? 
    - Pro: easy implementation, easy parsability and indexing
    - Con: we have to handle attachment separately
    - Answer: no. we should tread MD, docx, ppt all as the same core entity. 

Question: Should we have special consideration for MD documents?
    - Pro: MD support would let people take notes directly within the application
    - Con: More work for sure.
    - Answer: yes, because using the app as an editor itself would be great

Question: Should documents be tied to a single entity record?
    - Pro: Makes it obvious where the note 'belongs', no changes to existing document organization structures
    - Con: Loses information - documents could definitely involve multiple records
    - Answer: no, the ablity to link a document to multiple entities is very valuable. 

Question: What is the main purpose of having documents in the application?
    - To augment an entity with additional details that aren't captured in the entity fields, like "insights" in jira product discovery
    - To serve as the original sources of information, the original data where entities and records are extracted from
    - To unify the knowledge-graph capabilities of the application with standard document-stores - turning it into an all-in-one data storage solution
    - Answer: ...all of the above?

Question: Should 'documents' or 'documetns' be treated as a first-class ciitzen, or just registered as a record field?
    - First-class lets us build more features specifically about document processing, like parsing and entity-extraction
    - Just registered as a record field forces people to configure it properly
    - Answer: first-class citizen next to records, so that we can build more opinionated workflows around them


User Journey - Documents as properties
1. A user has the applicaiton conifgured as a CRM, with "Accounts", "Leads", "Opportunities", and "Interactions"
3. The "interactions" entity is configured with a "Transcript" field, which has type "document". 
2. The user has an interaction with a lead, and records that in the app. They upload the transcript as a document in the interaction
4. This transcript shows up in 2 places:
   1. Linked in the "interaction" record
   2. Listed in the broader "documents" page, which shows all the documents uploaded in this workspace
5. If the user goes to the transcript record, they can see the document
6. If the user goes to the documents page, they can also see the document, and see the entities it's linked to
7. Optionally, the user can run indexing on the document to link it to more entities if they want to. 


User Journey - Document as raw data
1. A user has the application configured as a project tracker, with "Projects", "Teams", and "Tasks" configured
2. The user has a meeting about the project, and identities 3 tasks, assigned to 2 different teams, all releated to 1 project.
3. The user uploads the meeting minutes to the application, directly in the "Documents" section
4. They then link taht document to all the relevant entities, the 3 created tasks, the 2 teams, and the project especially. 
5. In the core entities, users could configure a "Docuemtns" backlink field, which shows all the document that reference that entity. 


NOTE: This is just a new entity called "Documents", with a name, date, descirption, and links to different entities. The links are just different in that they can go to any kind of entity, not just the one mentioned
