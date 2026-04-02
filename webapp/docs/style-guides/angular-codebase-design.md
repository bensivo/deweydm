# Angular Codebase Design
- [Angular Codebase Design](#angular-codebase-design)
  - [Architecture Overview](#architecture-overview)
    - [The Three Layers](#the-three-layers)
    - [Single-Directional Data Flow](#single-directional-data-flow)
  - [Layer Responsibilities](#layer-responsibilities)
    - [Presentation Layer](#presentation-layer)
    - [Service Layer](#service-layer)
    - [Data Layer](#data-layer)
  - [Folder Structure](#folder-structure)
    - [Top-Level Organization](#top-level-organization)
    - [The components/ Folder](#the-components-folder)
    - [The pages/ Folder](#the-pages-folder)
    - [The services/ Folder](#the-services-folder)
    - [The store/ Folder](#the-store-folder)
  - [Component File Organization](#component-file-organization)
    - [File Naming](#file-naming)
    - [Component Folder Structure](#component-folder-structure)
  - [Data Flow Rules](#data-flow-rules)
    - [Components Do Not Write to State](#components-do-not-write-to-state)
    - [Services Do Not Call Components](#services-do-not-call-components)
    - [Flow Diagram](#flow-diagram)


## Architecture Overview

### The Three Layers
This codebase follows a three-layer architecture to maintain separation of concerns and testability:

1. **Presentation Layer** - Components that render UI and handle user interactions
2. **Service Layer** - Business logic, orchestration, and side effects
3. **Data Layer** - State management and data persistence

Each layer has a single responsibility and communicates with adjacent layers through well-defined interfaces.

### Single-Directional Data Flow
Data flows in one direction through the application:

```
User Action → Component → Service → Store → Component (re-render)
```

This pattern makes the application predictable and easy to debug. You can always trace where data comes from and where changes originate.

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌─────────────┐                                            │
│  │  Component  │◄────── reads state (signals/observables)   │
│  └──────┬──────┘                                            │
│         │                                                    │
│         │ calls methods (user actions)                       │
│         ▼                                                    │
├─────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER                           │
│  ┌─────────────┐                                            │
│  │   Service   │ ◄──── business logic, validation, API calls│
│  └──────┬──────┘                                            │
│         │                                                    │
│         │ writes state                                       │
│         ▼                                                    │
├─────────────────────────────────────────────────────────────┤
│                       DATA LAYER                             │
│  ┌─────────────┐                                            │
│  │    Store    │ ◄──── state container                      │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```


## Layer Responsibilities

### Presentation Layer
Components are responsible for:
- Reading data from state
- Rendering that data to the DOM
- Capturing user events (clicks, inputs, etc.)
- Invoking service functions

Components should **not** perform:
- Business logic or data transformations
- Direct state mutations
- API calls or other side effects
- Complex conditional logic

```ts
// Good - component delegates to service
@Component({ ... })
export class InvoiceListComponent {
    @Inject(InvoiceService) 
    private invoiceService: InvoiceService;

    invoices = this.invoiceService.invoices;

    onClickDelete(invoiceId: string) {
        this.invoiceService.deleteInvoice(invoiceId);
    }
}

// Bad - component contains business logic
@Component({ ... })
export class InvoiceListComponent {
    invoices = signal<Invoice[]>([]);

    onClickDelete(invoiceId: string) {
        const invoice = this.invoices().find(i => i.id === invoiceId);
        if (invoice.status === 'paid') {
            throw new Error('Cannot delete paid invoices');
        }
        this.http.delete(`/api/invoices/${invoiceId}`).subscribe(() => {
            this.invoices.update(list => list.filter(i => i.id !== invoiceId));
        });
    }
}
```

### Service Layer
Services are responsible for:
- Defining functions that can be invoked by components or other services
- Orchestrating operations across multiple stores or APIs
- Handling side effects (API calls, localStorage, etc.)
- Calculating new state values and updating state

Services should **not**:
- Store application state (use stores for that)
- Directly manipulate the DOM
- Call methods on components

```ts
// Good - service contains all logic
@Injectable({ providedIn: 'root' })
export class InvoiceService {
    invoices = this.invoiceStore.invoices;

    constructor(
        private invoiceStore: InvoiceStore,
        private http: HttpClient
    ) {}

    deleteInvoice(invoiceId: string) {
        const invoice = this.invoiceStore.getById(invoiceId);
        if (invoice.status === 'paid') {
            throw new Error('Cannot delete paid invoices');
        }

        this.http.delete(`/api/invoices/${invoiceId}`).subscribe(() => {
            this.invoiceStore.remove(invoiceId);
        });
    }
}
```

### Data Layer
Stores are responsible for:
- Holding application state
- Providing basic CRUD operations on state values 
- Providing subscribable state values (through observables or signals)

Simple applications should use simple signals as state containers, because they can be made subscribable and read-only. More complex applications may decide to use a more complex state container like NGRX for advanced features like undo-redo, logging, and persistence. 

Stores should not **not**:
- Define business logic or validation
- Make API calls or define side effects
- Import components or services

```ts
// Good - store is a simple state container
@Injectable({ providedIn: 'root' })
export class InvoiceStore {
    private invoicesSignal = signal<Invoice[]>([]);
    public invoices$ = this.invoicesSignal.asReadonly();

    getById(id: string): Invoice | undefined {
        return this.invoicesSignal().find(i => i.id === id);
    }

    set(invoices: Invoice[]) {
        this.invoicesSignal.set(invoices);
    }

    add(invoice: Invoice) {
        this.invoicesSignal.update(list => [...list, invoice]);
    }

    remove(id: string) {
        this.invoicesSignal.update(list => list.filter(i => i.id !== id));
    }
}
```


## Folder Structure

### Top-Level Organization
```
src/app/
├── components/          # Reusable UI components
├── pages/               # Route-level components
├── services/            # Business logic services
├── store/               # State management
├── models/              # TypeScript interfaces and types
└── app.component.ts     # Root component
```

### The components/ Folder
Contains reusable UI components that can be used across multiple pages. These components:
- Expose all interactions via native Angular inputs and outputs
- Could be extracted to a component library

These components should **not**:
- Read app state
- Import and call application services

```
components/
├── button/
├── modal/
├── card/
├── data-table/
└── file-upload/
```

Examples of what belongs here:
- A generic `ModalComponent` that displays any content
- A `ButtonComponent` with configurable styles
- A `DataTableComponent` that renders any tabular data

Examples of what does **not** belong here:
- An `InvoiceCardComponent` - this is domain-specific, put it in the invoices page folder
- A `UserProfileModalComponent` - too specific, put it with user-related pages

### The pages/ Folder
Contains route-level components and their associated domain-specific components. Each page folder is self-contained with everything needed for that route.

```
pages/
├── home/
│   ├── home.page.ts
│   └── home.page.html
├── invoices/
│   ├── invoices.page.ts
│   ├── invoices.page.html
│   ├── invoice-card/
│   │   ├── invoice-card.component.ts
│   │   └── invoice-card.component.html
│   └── invoice-filters/
│       ├── invoice-filters.component.ts
│       └── invoice-filters.component.html
└── settings/
    ├── settings.page.ts
    └── settings.page.html
```

Page components:
- Are mounted directly by the router
- Inject services and pass data down to children

### The services/ Folder
Contains all services organized by domain.

```
services/
├── invoice.service.ts
├── user.service.ts
├── auth.service.ts
└── file-upload.service.ts
```

### The store/ Folder
Contains all state management stores.

```
store/
├── invoice.store.ts
├── user.store.ts
├── auth.store.ts
└── app-settings.store.ts
```


## Component File Organization
### File Naming
Follow the convention of `{name}.component.ts` for components and `{name}.page.ts` for page-level components.

```
button.component.ts       # Good
button.component.html
button.component.less

invoices.page.ts          # Good - page-level component
invoices.page.html
invoices.page.less
```

### Component Folder Structure
Each component should have its own folder containing all related files.

```
button/
├── button.component.ts       # Component class
├── button.component.html     # Template
├── button.component.less     # Styles
└── button.component.spec.ts  # Tests
```

Always use external files, do not use inline templates or styles.
```ts
// Bad: Compiles and renders, but makes life harder for automated code scanning tools and linters
@Component({
    selector: 'app-icon',
    template: `<i class="icon icon-{{name()}}"></i>`,
})
export class IconComponent {
    name = input.required<string>();
}
```


## Data Flow Rules

### Components Do Not Write to State
Components should never directly mutate application state. Always go through a service.

```ts
// Bad - component writes to store directly
@Component({ ... })
export class InvoiceListComponent {
    constructor(private invoiceStore: InvoiceStore) {}

    onClickDelete(id: string) {
        this.invoiceStore.remove(id); // Don't do this
    }
}

// Good - component calls service
@Component({ ... })
export class InvoiceListComponent {
    constructor(private invoiceService: InvoiceService) {}

    onClickDelete(id: string) {
        this.invoiceService.deleteInvoice(id);
    }
}
```

This rule ensures all business logic lives in services, making it testable and reusable.

### Services Do Not Call Components
Services should never hold references to components or call component methods. Communication flows downward through data bindings.

```ts
// Bad - service calls component method
@Injectable({ providedIn: 'root' })
export class InvoiceService {
    private invoiceListComponent: InvoiceListComponent;

    registerComponent(component: InvoiceListComponent) {
        this.invoiceListComponent = component;
    }

    deleteInvoice(id: string) {
        // Don't do this. Instead, just update the state,
        // and let the component automatically rerender.
        this.invoiceListComponent.refreshList();
    }
}

// Good - service updates state, component reacts
@Injectable({ providedIn: 'root' })
export class InvoiceService {
    deleteInvoice(id: string) {
        // ... logic
        this.invoiceStore.remove(id); // Component will re-render automatically
    }
}
```

### Flow Diagram