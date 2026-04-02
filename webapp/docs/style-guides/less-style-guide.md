# Less/CSS Style Guide

- [Less/CSS Style Guide](#lesscss-style-guide)
  - [Formatting](#formatting)
    - [Indentation](#indentation)
    - [Brace Style](#brace-style)
    - [Property Spacing](#property-spacing)
    - [Property Grouping](#property-grouping)
  - [Naming Conventions](#naming-conventions)
    - [Class Names](#class-names)
    - [Modifiers](#modifiers)
  - [Selector Patterns](#selector-patterns)
    - [Nesting Depth](#nesting-depth)
    - [Parent Selector Usage](#parent-selector-usage)
  - [Less Features](#less-features)
  - [Code Organization](#code-organization)
    - [File Organization](#file-organization)
    - [Component Scoping](#component-scoping)
  - [Colors and Sizing](#colors-and-sizing)
    - [Color Values](#color-values)
    - [Sizing Units](#sizing-units)
    - [Spacing Scale](#spacing-scale)
    - [Border Radius](#border-radius)

## Formatting

### Indentation
Use 4 spaces per nesting level, consistent with TypeScript indentation.

### Brace Style
Opening brace on the same line as the selector, closing brace on a new line.

```less
.attachment-details {
  padding: 24px;
}
```

### Property Spacing
Single space after the colon in property declarations.

```less
.example {
  padding: 24px;           // Good
  margin:24px;             // Bad - missing space
}
```

### Property Grouping
Group related properties together in this order:

1. Position properties (position, top, left, right, bottom)
2. Box model (width, height, padding, margin)
3. Display and layout (display, flex, align-items, justify-content)
4. Visual effects (background, opacity, transition, z-index)

```less
.drop-overlay {
  // Position
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  // Box model
  padding: 24px;

  // Display and layout
  display: flex;
  align-items: center;
  justify-content: center;

  // Visual effects
  background: rgba(24, 144, 255, 0.1);
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 1000;
}
```

## Naming Conventions

### Class Names
Use kebab-case for all CSS class names. Follow a hierarchical naming structure (BEM-adjacent):

```less
// Block names
.attachment-details { }
.modal-form { }
.attachment-list-item { }

// Child elements (nested in Less)
.details-header { }
.form-field { }
.drop-overlay { }
```

### Modifiers
State-based modifiers use simple class names:

```less
.attachment-list-item {
  &.active {
    background-color: #e6f4ff;
    border-left: 3px solid #1890ff;
  }
}

nz-layout {
  &.drag-over {
    .drop-overlay {
      opacity: 1;
    }
  }
}
```

## Selector Patterns

### Nesting Depth
Maintain a maximum of 2-3 levels of nesting to avoid CSS specificity issues.

```less
// 1 level - Block with pseudo-class/modifier
.attachment-list-item {
  &:hover { }
  &.active { }
}

// 2 levels - Block > Element > Property
.modal-form {
  .form-field {
    label { }
    input { }
  }
}

// 3 levels maximum - Block > Element > Sub-element
.drop-overlay {
  .drop-message {
    .drop-icon { }
  }
}
```

### Parent Selector Usage
Use the parent selector (`&`) for:

1. Pseudo-classes (`:hover`, `:focus`, `:active`)
2. State modifiers (`.active`, `.disabled`)
3. Compound selectors

```less
.attachment-list-item {
  padding: 12px 16px;
  cursor: pointer;

  &:hover {
    background-color: #f5f5f5;
  }

  &.active {
    background-color: #e6f4ff;
    border-left: 3px solid #1890ff;
  }
}
```

## Less Features
This codebase uses Less pragmatically with minimal advanced features:

**Features Used:**
- Nesting (primary feature)
- Parent selector (`&`)

**Features Not Used:**
- Variables (colors are hardcoded)
- Mixins
- Functions

This approach keeps styling simple and relies on ng-zorro-antd's design system for consistency.

## Code Organization

### File Organization
Each Angular component has its own co-located `.less` file:

```
angular/src/
├── styles.less                              # Global imports
├── app/
│   ├── app.less                             # App container styles
│   └── components/
│       ├── header/header.component.less
│       ├── attachments-list/attachments-list.component.less
│       ├── attachment-details/attachment-details.component.less
│       └── add-attachment-modal/add-attachment-modal.component.less
```

### Component Scoping
Styles are component-scoped through Angular's style encapsulation. Each component references its own `.less` file:

```ts
@Component({
  selector: 'app-attachment-details',
  templateUrl: './attachment-details.component.html',
  styleUrl: './attachment-details.component.less'
})
```

Global styles and third-party imports go in `styles.less`:

```less
@import 'ng-zorro-antd/ng-zorro-antd.less';
```

## Colors and Sizing

### Color Values
Use the Ant Design color palette (consistent with ng-zorro-antd):

| Purpose | Color |
|---------|-------|
| Primary blue | `#1890ff` |
| Dark text | `#262626` |
| Secondary text | `#595959` |
| Light gray (disabled) | `#8c8c8c` |
| Background (light) | `#f5f5f5` |
| Background (white) | `#fff` |
| Border gray | `#d9d9d9`, `#f0f0f0` |
| Active background | `#e6f4ff` |

```less
.attachment-list-item {
  &:hover {
    background-color: #f5f5f5;
  }
  &.active {
    background-color: #e6f4ff;
    border-left: 3px solid #1890ff;
  }
}
```

For overlays and shadows, use rgba:
```less
background: rgba(24, 144, 255, 0.1);
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
```

### Sizing Units
Use `px` as the primary unit for most sizing:

```less
font-size: 14px;
padding: 48px 64px;
border-radius: 8px;
```

### Spacing Scale
Follow a consistent spacing scale based on multiples of 4px/8px:

| Size | Usage |
|------|-------|
| `4px` | Small margins, tight spacing |
| `8px` | Standard gap, small padding |
| `12px` | Medium gap |
| `16px` | Standard padding |
| `24px` | Section padding, large gaps |
| `48px` | Container padding |
| `64px` | Large container padding |

```less
.container {
  padding: 48px 64px;
  gap: 24px;
}

.item {
  padding: 8px;
  margin-bottom: 4px;
}
```

### Border Radius
Use consistent border radius values:

| Element Type | Radius |
|--------------|--------|
| Buttons, inputs | `4px` |
| Cards, containers | `8px` |
| Modals, overlays | `12px` |

```less
.site-layout-content {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.drop-message {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```