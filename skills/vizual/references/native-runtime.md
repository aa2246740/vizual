# Native Runtime Reference

Vizual native runtime gives an Agent a host-rendered visual surface model. It is not a page builder and it does not own the Agent's reasoning.

## Mental Model

The Agent may combine ordinary text with one or more Vizual surfaces. Each surface is a native component tree backed by an optional data model and host-visible actions.

Interaction has two layers:

1. Local playground controls update the current surface without asking the Agent again.
2. Agent round-trip actions use real host-visible actions and are sent back by the host.

Copy, export, download, share, and persistence controls belong to the host
product shell. Vizual native core does not provide or promise those operations.

Preferred integration order:

1. Discover the live catalog through MCP or SDK manifest.
2. Create a surface.
3. Update the data model.
4. Update components that bind to the data model.
5. Let the host render and record artifact/action events.

## External Agent APIs

Common tool-call contract:

```json
{
  "surfaceId": "stable-id",
  "fallbackText": "Short text if rendering is unavailable.",
  "display": { "mode": "inline", "title": "Title", "persist": true },
  "input": [
    { "version": "v0.10", "createSurface": { "surfaceId": "stable-id", "catalogId": "vizual" } },
    { "version": "v0.10", "updateDataModel": { "surfaceId": "stable-id", "path": "/", "value": {} } },
    { "version": "v0.10", "updateComponents": { "surfaceId": "stable-id", "components": [] } }
  ]
}
```

Flat specs remain supported for hosts that do not expose native operations:

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "Column",
      "props": { "gap": 16 },
      "children": []
    }
  }
}
```

## Layout Boundary

Core owns semantic visual primitives, not page-level taste. Agents should compose with `Column`, `Row`, `Container`, `Card`, and `Tabs` when needed. `HeroLayout` is runtime compatibility only and should not be generated for new chat UI.

Removed page/product-level components are not native core. If an old artifact contains one, the runtime should report unsupported input rather than fake a successful render.

## Native Actions

Actions are host-visible events:

- `submitForm`: structured form submission back to the host Agent.
- `applyFilter`: selected filter should change visible state or host context.
- `drillDown`: selected chart point, table row, or entity requests deeper analysis.
- `selectLocation`: selected branch, region, store, or location-like entity.
- `updatePlan`: visible plan/status update.

Only use actions that the answer can actually consume. Do not invent external workflow effects. Do not imply save, approval, dispatch, ticket creation, database writes, or other external business effects unless the host explicitly exposes that workflow.

## Form And Interaction Quality

`FormBuilder` is for structured input collection. Good uses:

- ask user to choose analysis focus,
- collect scenario assumptions,
- submit approval preference back to the Agent,
- collect missing fields for a follow-up calculation.

Bad uses:

- fake dispatch to an operations team,
- fake save/approval/ticket creation without host capability,
- decorative buttons that only prove the UI is clickable.

## liveControl

liveControl is a host bridge: FormBuilder edits state and a preview is regenerated from `makeSpec(state)`. It should be used for real exploration, such as changing sample size, threshold, chart type, or simulation assumptions. Set `FormBuilder.props.showSubmit` to `false` for live preview controls; a submit button is only useful when the input must round-trip to the Agent.

## Catalog Gap Metadata

If a useful expression cannot be represented in the catalog, the Agent or SDK may attach gap metadata outside the UI spec. This must not block rendering, alter the visible output, or silently suppress the answer.

## Cold-Start Acceptance Boundary

Passing acceptance requires visible browser evidence:

- natural-language tasks, not scripted component calls,
- actual rendered charts/tables/forms inspected in browser,
- host-visible action logs for interactions,
- negative cases for pure text and explicit webpage/code requests,
- stable unsupported errors for removed components.
