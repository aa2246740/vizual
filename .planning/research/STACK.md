# Stack Research: Vizual v1.1 -- Interactive Components + DocView

**Domain:** Interactive visualization components for json-render
**Researched:** 2026-04-16
**Confidence:** HIGH (direct type definition analysis of json-render 0.17.0 + source code review)

---

## What Changed from v1.0

v1.0 shipped 37 read-only/display components. v1.1 adds two capabilities that require new stack decisions:

1. **Interactive input components** -- InputText, InputSelect, InputFile, FormBuilder that read/write state through json-render's binding system
2. **DocView annotation layer** -- Text selection, highlighting, annotation panel, AI revision loop for document-style content

The good news: json-render 0.17.0 already ships all the state management, validation, visibility, event, and action primitives needed. No new state management library is required.

---

## Recommended Stack Additions

### New npm Dependencies

| Library | Version | Purpose | Why This One |
|---------|---------|---------|--------------|
| `react-highlight-words` | ^0.21.0 | Text highlight rendering for DocView annotations | Only actively maintained React highlight library (647 dependents, last publish 2025); supports custom mark renderer for click/interaction handlers |

### No New Dependencies Needed For

| Capability | Built Into | Mechanism |
|------------|-----------|-----------|
| State management | `@json-render/core` 0.17.0 | `StateStore`, `createStateStore`, `StateProvider`, `useStateStore`, `useStateValue` |
| Two-way input binding | `@json-render/core` 0.17.0 | `$bindState` / `$bindItem` prop expressions + `useBoundProp` hook |
| Form validation | `@json-render/core` 0.17.0 | `ValidationProvider`, `useFieldValidation`, `check.*` helpers (required, email, minLength, pattern, min, max, url, numeric, matches, equalTo, lessThan, greaterThan, requiredIf) |
| Conditional visibility | `@json-render/core` 0.17.0 | `VisibilityProvider`, `evaluateVisibility`, `visibility.when/unless/eq/neq/gt/gte/lt/lte/and/or` |
| Event handling | `@json-render/react` 0.17.0 | `emit(event)`, `on(event) -> EventHandle`, element-level `on` field mapping to `ActionBinding` |
| State watchers | `@json-render/core` 0.17.0 | Element-level `watch` field monitors state paths and fires `ActionBinding` on change |
| Repeat/array rendering | `@json-render/react` 0.17.0 | `RepeatScopeProvider`, `$item` / `$index` / `$bindItem` expressions |
| Actions (catalog-level) | `@json-render/core` 0.17.0 | `ActionProvider`, `useActions`, `ActionBinding`, `onSuccess/onError` handlers |
| Computed values | `@json-render/core` 0.17.0 | `$computed` prop expression with registered functions |

---

## How Interactive Components Map to json-render APIs

### Input Component Pattern

Every interactive component follows the `ComponentRenderProps` pattern. The key APIs:

```typescript
// ComponentRenderProps from @json-render/react
interface ComponentRenderProps<P> {
  element: UIElement<string, P>   // has on, watch, repeat, visible
  children?: ReactNode
  emit: (event: string) => void
  on: (event: string) => EventHandle   // { emit, shouldPreventDefault, bound }
  bindings?: Record<string, string>     // prop name -> state path (from $bindState/$bindItem)
  loading?: boolean
}

// useBoundProp for two-way binding
import { useBoundProp } from '@json-render/react'
const [value, setValue] = useBoundProp<string>(props.value, bindings?.value)
```

Example InputText implementation:

```typescript
import { useBoundProp, useFieldValidation, type ComponentRenderer } from '@json-render/react'

export const InputText: ComponentRenderer<InputTextProps> = ({ props, bindings, emit, on }) => {
  const [value, setValue] = useBoundProp<string>(props.value, bindings?.value)
  const { errors, isValid, touch, validate } = useFieldValidation(bindings?.value ?? '', props.validation)

  return <input
    value={value ?? ''}
    placeholder={props.placeholder}
    onChange={(e) => { setValue(e.target.value); touch() }}
    onBlur={() => validate()}
  />
}
```

### FormBuilder Component Pattern

FormBuilder is a meta-component that takes a field definitions array and renders input components dynamically. It uses:

- `$bindState` expressions in each field's `value` prop for two-way binding
- `ValidationProvider` wrapping the form for field-level validation
- `on` events on submit button for form submission action
- `watch` on the form state for cascading field dependencies

### Catalog Actions (New in v1.1)

The catalog currently has `actions: {}`. For interactive components, we add:

```typescript
// In catalog.ts
actions: {
  setState: {
    params: z.object({
      statePath: z.string(),
      value: z.unknown(),
    }),
    description: 'Set a value in the application state.',
  },
  submitForm: {
    params: z.object({
      formPath: z.string(),
    }),
    description: 'Validate and submit form data.',
  },
}
```

In registry.tsx, corresponding action handlers:

```typescript
export const { registry, handlers, executeAction } = defineRegistry(renderKitCatalog, {
  components: { /* ... */ },
  actions: {
    setState: async (params, setState) => {
      setState(prev => ({ ...prev, [params.statePath]: params.value }))
    },
    submitForm: async (params, setState) => {
      // validate + process form
    },
  },
})
```

---

## DocView Annotation Architecture

### What react-highlight-words Provides

- Highlight specific text ranges by search terms or custom findChunks function
- Custom `markTag` renderer -- can render interactive highlighted spans
- Unstyled by default (we control all styling)

### What We Must Build Custom

react-highlight-words handles rendering highlights but does NOT provide:

1. **Text selection detection** -- Use browser `Selection` API + `Range` API directly (no library needed)
2. **Annotation storage** -- Store in json-render `StateStore` at paths like `/annotations`, each annotation: `{ id, rangeStart, rangeEnd, text, note, author, color, createdAt }`
3. **Annotation panel** -- Standard React component rendering annotation list from state
4. **AI revision loop** -- Event binding: annotation action triggers `emit('requestRevision')` which maps to an `ActionBinding` that calls an external API

### Why Custom (Not Existing Libraries)

| Library | Status | Why Rejected |
|---------|--------|-------------|
| `@recogito/recogito-js` | **Deprecated** (Nov 2024) | Maintainers shut down the project; GitHub archived |
| `react-text-annotate` | **Unmaintained** (5 years) | Last publish 2021; React 16 era; no TS types |
| `react-annotation` | SVG only | Designed for SVG overlays, not text selection in HTML |
| `prosemirror` | Full editor | Overkill -- we annotate existing content, not edit it |
| `tiptap` | Full editor | Same as prosemirror; annotation is a small part of a massive editor |
| `hypothesis` | Full platform | Complete annotation platform; too heavy, opinionated |

The annotation feature set (select text, highlight, comment, AI suggest) is narrow enough that building on `react-highlight-words` + browser Selection API + json-render StateStore is simpler than integrating a heavy framework.

---

## Installation

```bash
# New dependency for DocView highlighting
npm install react-highlight-words@^0.21.0

# No new peer dependencies needed
# @json-render/core ^0.17.0 -- already installed
# @json-render/react ^0.17.0 -- already installed
```

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Zustand** | json-render has built-in `StateStore` + `createStoreAdapter` for external stores if needed later | `StateStore` from `@json-render/core` |
| **Redux** | Same reason; json-render provides `createStoreAdapter(config)` to wrap any store | `StateStore` from `@json-render/core` |
| **React Hook Form** | json-render has built-in `ValidationProvider` + `useFieldValidation` with 13+ built-in validators | `ValidationProvider` + `useFieldValidation` from `@json-render/react` |
| **Formik** | Same as React Hook Form; json-render validation is catalog-aware | `ValidationProvider` from `@json-render/react` |
| **@recogito/recogito-js** | Deprecated Nov 2024; project archived | Custom solution on `react-highlight-words` |
| **ProseMirror / TipTap** | Full document editors; we need annotation, not editing | Browser Selection API + `react-highlight-words` |
| **@dnd-kit** (for inputs) | Input components don't need drag-and-drop | Standard React form elements |
| **Yup / Joi** | Zod v4 is already the schema layer; json-render validation uses Zod | Zod v4 + `check.*` helpers |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `react-highlight-words` 0.21.0 | Custom `mark` tag + Range API only | If we need sub-word highlighting or overlapping annotations that react-highlight-words cannot express |
| json-render built-in StateStore | `@json-render/zustand` adapter | If the host application already uses Zustand and wants a single source of truth (not published to npm yet as of 0.17.0) |
| json-render built-in validation | Zod `refine`/`transform` in schemas | For cross-field validation that depends on business logic beyond visibility conditions |
| `useBoundProp` hook | `useStateStore` direct | If a component needs to read/write multiple state paths not exposed through `$bindState` bindings |

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@json-render/core` 0.17.0 | `@json-render/react` 0.17.0 | Must match minor versions |
| `@json-render/react` 0.17.0 | React 18+ / React 19 | Works with both (tested against React 19.2.5 in devDeps) |
| `@json-render/core` 0.17.0 | Zod ^3.25.0 | json-render imports `z` from 'zod' directly; 3.25+ has v4 API under the hood |
| `react-highlight-words` 0.21.0 | React 18+ | Peer dep is `react: ">= 16.0.0"`; works fine |
| `mviz` 1.6.4 | ECharts ^5.5.0 | mviz builds ECharts options; must use compatible ECharts |
| `esbuild` 0.28+ | TypeScript 6.x | esbuild strips types; no TSC needed for build |

---

## Confidence Assessment

| Decision | Confidence | Risk | Reason |
|----------|-----------|------|--------|
| No new state management | 95% | LOW | json-render 0.17.0 `StateStore` verified from type definitions; `useBoundProp` hook confirmed; `createStoreAdapter` available for future external store needs |
| `react-highlight-words` for DocView | 85% | LOW-MEDIUM | Actively maintained, 647 dependents, but may need custom `findChunks` for complex annotation ranges; will need integration testing |
| Built-in validation sufficient | 90% | LOW | 13+ built-in validators cover common cases; custom validators supported via catalog `validationFunctions`; `validateOn: change/blur/submit` covers timing |
| No form library needed | 85% | LOW-MEDIUM | json-render validation + `$bindState` covers 90% of form needs; complex multi-step wizard forms may need additional patterns later |
| Catalog actions for interactivity | 95% | LOW | `ActionBinding`, `ActionProvider`, `onSuccess/onError` handlers all verified from type definitions |
| Custom annotation solution | 75% | MEDIUM | Text selection + highlighting + state storage is straightforward, but edge cases in selection across DOM boundaries and re-rendering highlights on content change need testing |

---

## Key API Surface for v1.1 Implementation

### State Binding (for InputText, InputSelect, InputFile, FormBuilder)

```
@json-render/core exports:
  PropExpression types: $state, $bindState, $bindItem, $item, $index
  resolvePropValue(value, ctx) -> resolved value
  resolveBindings(props, ctx) -> { propName: statePath }
  resolveElementProps(props, ctx) -> resolved props object

@json-render/react exports:
  useBoundProp<T>(propValue, bindingPath?) -> [value, setValue]
  useStateStore() -> { state, get, set, update, getSnapshot }
  useStateValue<T>(path) -> T | undefined
  StateProvider { store?, initialState?, onStateChange? }
```

### Validation (for FormBuilder field validation)

```
@json-render/core exports:
  check.required(email, minLength, maxLength, pattern, min, max, url, numeric, matches, equalTo, lessThan, greaterThan, requiredIf)
  ValidationConfig { checks?, validateOn?: "change"|"blur"|"submit", enabled?: VisibilityCondition }
  runValidation(config, ctx) -> ValidationResult { valid, errors, checks }

@json-render/react exports:
  ValidationProvider { customFunctions? }
  useFieldValidation(path, config?) -> { state, validate, touch, clear, errors, isValid }
```

### Events and Actions (for all interactive components)

```
UIElement fields:
  on?: Record<string, ActionBinding | ActionBinding[]>   -- event -> action
  watch?: Record<string, ActionBinding | ActionBinding[]> -- state path -> action on change

ComponentRenderProps:
  emit(event: string) -> void
  on(event: string) -> EventHandle { emit, shouldPreventDefault, bound }
  bindings?: Record<string, string>   -- from $bindState/$bindItem

ActionBinding:
  { action, params?, confirm?, onSuccess?, onError?, preventDefault? }

Catalog actions:
  defineCatalog(schema, { components: {...}, actions: { actionName: { params: ZodSchema, description } } })

Registry actions:
  defineRegistry(catalog, { components: {...}, actions: { actionName: async (params, setState, state) => {} } })
```

### Visibility (for conditional fields in FormBuilder)

```
@json-render/core exports:
  visibility.when(path), visibility.unless(path)
  visibility.eq(path, value), visibility.neq(path, value)
  visibility.gt/gte/lt/lte(path, value)
  visibility.and(...conditions), visibility.or(...conditions)
  evaluateVisibility(condition, ctx) -> boolean

@json-render/react exports:
  VisibilityProvider
  useIsVisible(condition) -> boolean
```

---

## Sources

- `@json-render/core` 0.17.0 type definitions (store-utils-D98Czbil.d.ts, index.d.ts) -- HIGH confidence, directly read from node_modules
- `@json-render/react` 0.17.0 type definitions (index.d.ts, schema.d.ts) -- HIGH confidence, directly read from node_modules
- `react-highlight-words` npm page -- verified version 0.21.0, weekly downloads, peer deps
- `/Users/wu/Documents/renderKit/ai-renderkit-pkg/src/catalog.ts` -- current catalog with 37 components, empty actions
- `/Users/wu/Documents/renderKit/ai-renderkit-pkg/src/registry.tsx` -- current registry pattern
- `/Users/wu/Documents/renderKit/ai-renderkit-pkg/src/components/form-view/component.tsx` -- current read-only FormView to be upgraded

---
*Stack research for: Vizual v1.1 Interactive Components + DocView*
*Researched: 2026-04-16*
