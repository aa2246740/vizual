# FormBuilder

Element type: `"FormBuilder"` | Props type: `"form_builder"`

Dynamic form with 18 field types, validation, and conditional visibility.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"form_builder"` | yes | fixed literal |
| title | string | no | form title |
| columns | number | no | layout columns (default 1) |
| submitLabel | string | no | submit button text (default "Submit") |
| value | object \| `{ "$bindState": string }` | no | full form data object; use `$bindState` for live controls |
| fields | FormField[] | yes | array of field definitions |

## Supported field types (18)

| Field type | Description |
|------------|-------------|
| text | Single-line text input |
| email | Email input with validation |
| password | Password input (masked) |
| number | Numeric input |
| url | URL input with validation |
| tel | Telephone input |
| select | Dropdown select |
| file | File upload |
| textarea | Multi-line text input |
| radio | Radio button group |
| checkbox | Checkbox (single or group) |
| switch | Toggle switch |
| slider | Range slider |
| color | Color picker |
| date | Date picker |
| datetime | Date and time picker |
| time | Time picker |
| rating | Star rating |

## Common field props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| name | string | yes | field identifier (used as form data key) |
| type | string | yes | one of the 18 field types above |
| label | string | no | field label |
| required | boolean | no | mark as required |
| disabled | boolean | no | disable field |
| description | string | no | help text |
| defaultValue | any | no | initial value |
| dependsOn | string | no | name of another field this field depends on |
| showWhen | string \| number | no | show this field only when dependsOn field matches this value |

## Field-specific props

| Field type | Additional props |
|------------|-----------------|
| select | `options: { label: string, value: string }[]` |
| radio | `options: { label: string, value: string }[]` |
| checkbox | `options?: { label: string, value: string }[]` (omit for single boolean checkbox) |
| slider | `min?: number`, `max?: number`, `step?: number` |
| rating | `max?: number` (default 5) |
| file | `accept?: string`, `multiple?: boolean`, `maxFiles?: number`, `asBase64?: boolean` |
| textarea | `rows?: number`, `maxLength?: number` |

## Example

```json
{
  "type": "FormBuilder",
  "props": {
    "type": "form_builder",
    "title": "用户反馈",
    "submitLabel": "提交反馈",
    "columns": 1,
    "fields": [
      { "name": "name", "label": "姓名", "type": "text", "required": true },
      { "name": "email", "label": "邮箱", "type": "email", "required": true },
      { "name": "rating", "label": "评分", "type": "rating" },
      { "name": "category", "label": "类型", "type": "select", "options": [{"label": "Bug", "value": "bug"}, {"label": "建议", "value": "suggestion"}] },
      { "name": "feedback", "label": "详细描述", "type": "textarea" }
    ]
  },
  "children": []
}
```

## Realtime control binding

For live adjust-preview workflows, FormBuilder is the control surface. Bind the whole form to a state path and let the host listen for state changes:

```json
{
  "root": "controls",
  "elements": {
    "controls": {
      "type": "FormBuilder",
      "props": {
        "type": "form_builder",
        "title": "Chart controls",
        "value": { "$bindState": "/controls" },
        "fields": [
          {
            "name": "chartType",
            "label": "Chart type",
            "type": "select",
            "options": [
              { "label": "Bar", "value": "bar" },
              { "label": "Line", "value": "line" },
              { "label": "Combo", "value": "combo" }
            ]
          },
          { "name": "points", "label": "Data points", "type": "slider", "min": 3, "max": 15 },
          {
            "name": "orientation",
            "label": "Bar orientation",
            "type": "select",
            "options": [
              { "label": "Vertical", "value": "vertical" },
              { "label": "Horizontal", "value": "horizontal" }
            ],
            "dependsOn": "chartType",
            "showWhen": "bar"
          },
          { "name": "stacked", "label": "Stack bars", "type": "switch", "dependsOn": "chartType", "showWhen": "bar" },
          { "name": "smooth", "label": "Smooth line", "type": "switch", "dependsOn": "chartType", "showWhen": "line" },
          {
            "name": "secondaryMetric",
            "label": "Combo line metric",
            "type": "select",
            "options": [
              { "label": "Growth", "value": "growth" },
              { "label": "ARPPU", "value": "arppu" }
            ],
            "dependsOn": "chartType",
            "showWhen": "combo"
          },
          { "name": "brandColor", "label": "Brand color", "type": "color" }
        ]
      },
      "children": []
    }
  }
}
```

In `validation/vizual-test.html`, use this controls spec inside `renderInteractiveVizInMsg(id, { initialState, controlsSpec, makeSpec, designMd, applyTheme, bubbleWidth })`. The page bridge receives `onStateChange`, calls `makeSpec(state)`, and re-renders the preview. A pure JSON spec cannot wire a form to a separate chart by itself.

For a custom React host, use `VizualRenderer` and extract the bound object by path:

```tsx
import { VizualRenderer, getVizualStateValue } from 'vizual'

const [controls, setControls] = useState({
  chartType: 'bar',
  points: 8,
  brandColor: '#ff6b35',
})

<VizualRenderer
  spec={controlsSpec}
  initialState={{ controls }}
  onStateChange={(changes) => {
    setControls(prev => getVizualStateValue(changes, '/controls', prev))
  }}
/>
<VizualRenderer spec={makeSpec(controls)} />
```

Do not shallow-merge `/controls` changes into the controls object itself. That creates `{ controls: {...} }` inside the controls state and the preview will keep reading stale top-level values.

Use conditional controls when a field only applies to one target component. For example, `orientation` and `stacked` are BarChart controls; hide them when `chartType` is `line` or `combo`, and also filter them out in host `makeSpec(state)`.

`dependsOn` / `showWhen` only implements equality-based visibility. It does not dynamically rewrite option lists. For complex linked controls, use separate conditional fields or enforce the allowed values in the host bridge.

## Conditional visibility example

```json
{
  "type": "FormBuilder",
  "props": {
    "type": "form_builder",
    "title": "Registration",
    "fields": [
      {
        "name": "attendeeType",
        "type": "radio",
        "label": "Attendee Type",
        "options": [{"label": "Individual", "value": "individual"}, {"label": "Corporate", "value": "corporate"}]
      },
      {
        "name": "companyName",
        "type": "text",
        "label": "Company Name",
        "dependsOn": "attendeeType",
        "showWhen": "corporate"
      }
    ]
  },
  "children": []
}
```
