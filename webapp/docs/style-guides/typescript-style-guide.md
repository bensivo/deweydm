# TypeScript Style Guide

- [TypeScript Style Guide](#typescript-style-guide)
  - [Formatting](#formatting)
    - [Indentation](#indentation)
    - [Line Length](#line-length)
    - [Brackets](#brackets)
    - [String Quoting](#string-quoting)
    - [Semicolons](#semicolons)
  - [Naming Conventions](#naming-conventions)
    - [Variables](#variables)
    - [Classes](#classes)
    - [Functions](#functions)
    - [Files and Folders](#files-and-folders)
  - [Comments](#comments)
    - [Block Comments](#block-comments)
    - [Function Comments](#function-comments)
    - [Class Comments](#class-comments)
    - [File Comments](#file-comments)
  - [Code Organization](#code-organization)
    - [Function Order](#function-order)
    - [Import Order](#import-order)
    - [Default Imports](#default-imports)


## Formatting

### Indentation
Use 4 spaces for indentation. If deep nesting becomes a problem, refactor your code.

### Line Length
There is no line length limit. Modern IDEs handle text wrapping automatically.

### Brackets
Open brackets at the end of the previous line, not on a new line.
``` ts
function asdf() {
    // Good
}

function asdf() 
{
    // Bad
}
```

### String Quoting
Use single quotes for all strings. Only use double quotes when the string contains a single quote itself.

### Semicolons
Always use semicolons at the end of statements.

## Naming Conventions

### Variables
Use camelCase with long, descriptive names to reduce cognitive load. Include the variable type if it is not obvious from the instantiation.
```ts
const applicationState: ApplicationState; // Good
const state: ApplicationState; // Bad, can be confused with any other state
```

Boolean variables should start with a signifier like `is`, `has`, or `does`, unless the name makes it obvious it is boolean.
```ts
let isModalOpen: boolean = false; // Good
let modalOpen: boolean = false; // Bad, not clear this is a boolean signal

let errorDetected: boolean = false; // Ok, because it's obvious this is boolean
```

Variables that represent common patterns or abstractions should have the abstraction name as a suffix, as these often inform developers on how these variables should be used. 
```ts
const applicationStateSignal = signal<ApplicationState>(); // Good
const applicationStateSignal: Signal<ApplicationState> = signal<ApplicaitonState>(); // Unecessary, the extra verbosity here doesn't add any clarity
```

### Classes
Use PascalCase. 

Just like variables, if the class is an instance of a common abstraction or pattern, add the name of that abstraction to the end of the classname. 

```ts 
class ModalComponent {} // Good
class AppState {} // Good

class UsersRepository implements Repository{} // Good
class Users implements Repository {} // Bad, not very clear that this is a 'repository'
```


### Functions
Use camelCase with long, descriptive names, which represent verbs or actions. 
``` ts
function calculateTaxes(invoice: Invoice) {} // Good
function taxes(invoice: Invoice) {} // Bad, not a verb. Could overlap with a 'taxes' local variable
```

One exception to this rule is event handlers. Event handlers should start with "on", then the name of the event.
``` ts
function onClickSubmit(clickEvent: HTMLMouseEvent) {} // good
function submit(clickEvent: HTMLMouseEvent) {} // bad
```

### Files and Folders
All files and folders should use lowercase letters, using hyphens as separators between words. 
```
my-service.ts // good
MyService.ts // bad
my_service.ts // bad
```

Files that represent common abstractiosn should suffix the file name with their abstraction type, separated by periods: 
```
modal.component.ts
app-state.service.ts
```

Common abstractions I use include: `.component.ts`, `.service.ts`, `.model.ts`, `.dto.ts`, `.interface.ts`, `.repository.ts`

## Comments

### Block Comments
Add single-line `//` comments above blocks of code for skimmability and to explain non-obvious behavior, and to explain the context and 'why' behind blocks of code. 
```ts
// Becuase of user input errors, sometimes duplicate line items appear on invoices. 
// We catch this by summing the line items ourselves and comparing to the invoice subtotal (which is always correct).
let calculatedInvoiceSubtotal: int = 0;
for(const lineItem of invoice.lineItems) {
    calculatedInvoiceSubtotal += lineItem.amount;
}
if (calculatedInvoiceSubtotal !== invoice.subtotal) {
    throw InputException('...')
}
```

### Function Comments
Add a comment above each function describing what it does and when it might be used. Include `@param` for each parameter and `@returns` for the return value, and `@throws` for any planned exceptions.

Use newlines after the description, and before `@returns`
``` ts
/**
 * Check that the invoice doesn't include any erroneous duplicate line items. By manually totalling line-item totals and comparing the end result to the invoice subtotal
 *
 * @param invoice, The invoice to validate
 * 
 * @returns void, if validation passes
 * @throws InputException, if validation fails
 */
function validateInvoiceLineItems(invoice: Invoice) { }
```

NOTE: you can leave out any of the `@` blocks that don't apply

### Class Comments
Add a comment above each class describing what it does
```ts
/** 
 * A data container for invoices, including the line items, and
 * any pre-calculated subtotals, taxes, tips. 
 */
class Invoice {}
```

### File Comments
Add a comment at the top of each file, unless the file contains only a single class or function that already has its own comment.

## Code Organization

### Function Order
Place all public functions at the top of the class / file, followed by private functions below.

### Import Order
Organize imports into two sections separated by one blank line. First, list all library imports, then all project imports. Project imports should always use relative paths.

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { User } from '../models/user.model';
import { AuthStore } from '../stores/auth.store';
```

### Default Imports
Never use default imports, unless that's the only option provided by an external library. Prefer named exports and imports, as they improve overall tracability of code (especially when it is read outside of an IDE). 