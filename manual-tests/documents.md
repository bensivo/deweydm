### Upload Document - Appears in List
Users can:
- Upload a document and see it appear in the Documents list

Steps:
1. Navigate to `/documents`
2. Note the current number of documents listed
3. Click "+ Upload"
4. Enter a name (e.g., "My File") and select a file from disk, confirm
5. Verify the new document appears in the list without a page reload
6. Verify it shows the correct name, original filename, and a "Created At" timestamp

---

### Search Documents - Filters by Name
Users can:
- Type in the search bar and see the list filtered to matching documents

Steps:
1. Upload at least two documents with distinct names (e.g., "Alpha Doc" and "Beta Doc")
2. Navigate to `/documents`
3. Type "Alpha" in the search bar
4. Verify only "Alpha Doc" is shown in the table
5. Clear the search bar
6. Verify both documents are shown again

---

### Click Document Row - Opens Detail Page
Users can:
- Click a row in the documents list to open that document's detail page

Steps:
1. Navigate to `/documents`
2. Click on any document row
3. Verify the app navigates to `/documents/<id>`
4. Verify the document's name is shown as the page title

---

### Document Detail - Edit Name and Description
Users can:
- Edit a document's name and description from the detail page

Steps:
1. Navigate to a document's detail page
2. Click "Edit" in the Details card
3. Change the Name field to "Updated Name"
4. Change the Description field to "Updated description text"
5. Click "Save"
6. Verify the page title and field values reflect the updated name and description
7. Navigate away and back — verify the changes persisted

---

### Document Detail - Cancel Edit Discards Changes
Users can:
- Cancel an edit and have the original values restored

Steps:
1. Navigate to a document's detail page
2. Click "Edit" in the Details card
3. Change the Name to something different
4. Click "Cancel"
5. Verify the original name is still shown and no changes were saved

---

### Document Detail - Delete Document
Users can:
- Delete a document from its detail page and be returned to the list

Steps:
1. Navigate to a document's detail page
2. Click "Delete"
3. Confirm the popconfirm prompt
4. Verify the app navigates back to `/documents`
5. Verify the deleted document is no longer in the list

---

### Document Detail - Preview Renders for Supported File Types
Users can:
- See an inline preview for images, PDFs, and plain text files

Steps:
1. Upload an image file (e.g., `.png` or `.jpg`) and open its detail page
2. Verify an `<img>` preview is shown in the Preview section
3. Upload a PDF file and open its detail page
4. Verify an `<iframe>` preview is shown
5. Upload a `.txt` file and open its detail page
6. Verify the file's text content is shown in a `<pre>` block

---

### Document Detail - Download Link for Unsupported File Types
Users can:
- Download files whose type cannot be previewed inline

Steps:
1. Upload a file with an unsupported type (e.g., `.zip` or `.csv`)
2. Open its detail page
3. Scroll to the Preview section
4. Verify a "Preview not available" message and a download link are shown
5. Click the download link and verify the file downloads

---

### Document Detail - Add Linked Record
Users can:
- Link a document to an entity record from the document detail page

Steps:
1. Ensure at least one entity with at least one record exists
2. Navigate to a document's detail page
3. In the "Linked Records" section, select an entity from the entity dropdown
4. Select a record from the record dropdown
5. Click "Add"
6. Verify the linked record appears in the Linked Records list as "EntityName / RecordName"
6. Verify the linked document appears in the entity's detail page. 

---

### Document Detail - Remove Linked Record
Users can:
- Remove a linked record from a document

Steps:
1. Navigate to a document that has at least one linked record
2. Click the ✕ button next to a linked record
3. Confirm the popconfirm prompt
4. Verify the link is removed from the Linked Records list

---

### Entity Detail - Upload Document from Record Page
Users can:
- Upload a new document directly from a record's detail page and have it linked automatically

Steps:
1. Navigate to any entity record detail page
2. Scroll to the Documents card
3. Click "+ Upload"
4. Enter a name and select a file, confirm
5. Verify the new document appears in the Documents card on the record page
6. Navigate to `/documents`
7. Verify the document appears in the global documents list

---

### Entity Detail - Link Existing Document from Record Page
Users can:
- Link an already-uploaded document to a record from that record's detail page

Steps:
1. Ensure at least one document exists (upload one if needed)
2. Navigate to any entity record detail page
3. Scroll to the Documents card
4. Click "+ Link Existing"
5. Select an existing document from the modal
6. Verify the document appears in the Documents card on the record page

---

### Entity Detail - Unlink Document from Record Page
Users can:
- Unlink a document from a record without deleting the document

Steps:
1. Navigate to a record that has at least one linked document
2. Click the disconnect (unlink) icon next to the document
3. Verify the document disappears from the record's Documents card
4. Navigate to `/documents`
5. Verify the document still exists in the global list

---

### Document Linked Records - Bidirectional Consistency
Users can:
- Link a document from a record page and see it reflected on the document's detail page

Steps:
1. Navigate to a record detail page and link a document via "+ Link Existing"
2. Click the document name link in the Documents card to open the document detail page
3. Verify the record appears in the document's "Linked Records" section

---
