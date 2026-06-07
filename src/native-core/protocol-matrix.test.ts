import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { withDefaultElementProps } from '../core/spec-validation'
import { VizualNativeCore } from './core'
import { VIZUAL_AG_UI_EVENT_TYPES, VIZUAL_AGENUI_CATALOG_COMPONENTS } from './protocol-fixtures'

const AG_UI_EVENT_TYPES = VIZUAL_AG_UI_EVENT_TYPES
const AGENUI_CATALOG_COMPONENTS = VIZUAL_AGENUI_CATALOG_COMPONENTS

function extractHtmlConstantArray(source: string, constName: string): string[] {
  const match = source.match(new RegExp(`const\\s+${constName}\\s*=\\s*\\[([\\s\\S]*?)\\];`))
  if (!match) throw new Error(`${constName} not found in native-protocol-matrix.html`)
  return [...match[1].matchAll(/'([^']+)'/g)].map(item => item[1])
}

function extractNativeOperationTypes(source: string): string[] {
  const match = source.match(/export type VizualNativeOperation =([\s\S]*?)\n\nexport type VizualNativeAgUiEvent/)
  if (!match) throw new Error('VizualNativeOperation union not found')
  return [...match[1].matchAll(/\|\s*\{\s*type:\s*'([^']+)'/g)].map(item => item[1])
}

function extractReduceOperationCases(source: string): string[] {
  const match = source.match(/private reduceOperation\(operation: VizualNativeOperation\):[\s\S]*?switch \(operation\.type\) \{([\s\S]*?)\n      \}\n    \} catch/)
  if (!match) throw new Error('reduceOperation switch not found')
  return [...match[1].matchAll(/case '([^']+)'/g)].map(item => item[1])
}

describe('Vizual native protocol coverage matrix', () => {
  it('keeps protocol matrix browser fixtures aligned with unit protocol fixtures', () => {
    const html = fs.readFileSync(path.join(process.cwd(), 'validation/native-protocol-matrix.html'), 'utf8')

    expect(extractHtmlConstantArray(html, 'AG_UI_EVENT_TYPES')).toEqual([...VIZUAL_AG_UI_EVENT_TYPES])
    expect(extractHtmlConstantArray(html, 'AGENUI_CATALOG_COMPONENTS')).toEqual([...VIZUAL_AGENUI_CATALOG_COMPONENTS])
  })

  it('keeps native operation union aligned with the reducer switch', () => {
    const typesSource = fs.readFileSync(path.join(process.cwd(), 'src/native-core/types.ts'), 'utf8')
    const coreSource = fs.readFileSync(path.join(process.cwd(), 'src/native-core/core.ts'), 'utf8')

    expect(extractReduceOperationCases(coreSource)).toEqual(extractNativeOperationTypes(typesSource))
  })

  it('covers A2UI v0.9 primitive components, literal values, data paths, explicit children, and client actions', () => {
    const onAction = vi.fn()
    const core = new VizualNativeCore({ onAction })

    const snapshot = core.dispatch([
      { version: 'v0.9', createSurface: { surfaceId: 'a2ui-v09', catalogId: 'basic' } },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'a2ui-v09',
          path: '/',
          value: {
            title: 'Book Your Table',
            hero: 'https://example.com/hero.png',
            video: 'https://example.com/demo.mp4',
            audio: 'https://example.com/demo.mp3',
            guests: 3,
            agree: true,
            country: 'ca',
            when: '2026-06-01',
          },
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'a2ui-v09',
          components: [
            {
              id: 'root',
              component: 'Column',
              children: {
                explicitList: [
                  'row',
                  'card',
                  'list',
                  'divider',
                  'textField',
                  'checkbox',
                  'choice',
                  'slider',
                  'datetime',
                  'tabs',
                  'video',
                  'audio',
                ],
              },
            },
            { id: 'row', component: 'Row', children: ['title', 'icon', 'image', 'button'] },
            { id: 'title', component: 'Text', text: { path: '/title' }, variant: 'h1' },
            { id: 'icon', component: 'Icon', name: { literalString: 'check' } },
            { id: 'image', component: 'Image', url: { path: '/hero' }, description: { literalString: 'Hero' } },
            { id: 'button', component: 'Button', text: { literalString: 'Confirm' }, action: { event: { name: 'confirm_booking' } } },
            { id: 'card', component: 'Card', child: 'cardText', title: { literalString: 'Reservation' } },
            { id: 'cardText', component: 'Text', text: { literalString: 'Ready to confirm' } },
            { id: 'list', component: 'List', items: ['date', 'time', 'guests'] },
            { id: 'divider', component: 'Divider' },
            { id: 'textField', component: 'TextField', label: { literalString: 'Email' }, value: { literalString: 'alice@example.com' } },
            { id: 'checkbox', component: 'CheckBox', label: { literalString: 'I agree' }, checked: { path: '/agree' } },
            {
              id: 'choice',
              component: 'ChoicePicker',
              label: { literalString: 'Country' },
              value: { path: '/country' },
              options: [
                { label: { literalString: 'USA' }, value: 'us' },
                { label: { literalString: 'Canada' }, value: 'ca' },
              ],
            },
            { id: 'slider', component: 'Slider', label: { literalString: 'Guests' }, value: { path: '/guests' }, min: 1, max: 8, steps: 7 },
            { id: 'datetime', component: 'DateTimeInput', label: { literalString: 'Date' }, value: { path: '/when' } },
            { id: 'tabs', component: 'Tabs', activeKey: 'general', items: [{ title: 'General', child: 'cardText' }] },
            { id: 'video', component: 'Video', url: { path: '/video' }, posterUrl: { literalString: 'https://example.com/poster.jpg' } },
            { id: 'audio', component: 'AudioPlayer', src: { path: '/audio' }, title: { literalString: 'Demo audio' } },
          ],
        },
      },
      {
        version: 'v0.9',
        action: {
          name: 'confirm_booking',
          surfaceId: 'a2ui-v09',
          sourceComponentId: 'button',
          context: { guests: 3 },
        },
      },
    ] as any)

    const renderedSpec = withDefaultElementProps(snapshot!.spec)
    expect(renderedSpec.elements!.root.children).toContain('row')
    expect(renderedSpec.elements!.title.props).toMatchObject({ content: 'Book Your Table' })
    expect(renderedSpec.elements!.image.props).toMatchObject({ src: 'https://example.com/hero.png', alt: 'Hero' })
    expect(renderedSpec.elements!.button.props).toMatchObject({ label: 'Confirm', action: 'confirm_booking' })
    expect(renderedSpec.elements!.checkbox.props).toMatchObject({ checked: true })
    expect(renderedSpec.elements!.choice.props).toMatchObject({ value: 'ca' })
    expect(renderedSpec.elements!.slider.props).toMatchObject({ value: 3, steps: 7 })
    expect(renderedSpec.elements!.datetime.props).toMatchObject({ value: '2026-06-01' })
    expect(renderedSpec.elements!.video.props).toMatchObject({ src: 'https://example.com/demo.mp4', poster: 'https://example.com/poster.jpg' })
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({
      name: 'confirm_booking',
      surfaceId: 'a2ui-v09',
      sourceComponentId: 'button',
      context: { guests: 3 },
    }))
  })

  it('covers A2UI v0.8 legacy nested component shape, typed data model, and userAction', () => {
    const onAction = vi.fn()
    const core = new VizualNativeCore({ onAction })

    const snapshot = core.dispatch([
      {
        surfaceUpdate: {
          surfaceId: 'legacy',
          components: [
            { id: 'root', component: { Column: { children: { explicitList: ['header', 'field', 'submit'] } } } },
            { id: 'header', component: { Text: { text: { literalString: 'Legacy booking' } } } },
            { id: 'field', component: { TextField: { label: { literalString: 'Guests' }, value: { path: '/reservation/guests' } } } },
            { id: 'submit', component: { Button: { text: { literalString: 'Confirm' }, action: { name: 'confirm' } } } },
          ],
        },
      },
      {
        dataModelUpdate: {
          surfaceId: 'legacy',
          contents: [
            {
              key: 'reservation',
              valueMap: [
                { key: 'guests', valueInt: 4 },
                { key: 'time', valueString: '19:00' },
              ],
            },
          ],
        },
      },
      { userAction: { name: 'confirm', surfaceId: 'legacy', context: { details: { guests: '4' } } } },
    ] as any)

    const renderedSpec = withDefaultElementProps(snapshot!.spec)
    expect(renderedSpec.elements!.header.props).toMatchObject({ content: 'Legacy booking' })
    expect(renderedSpec.elements!.field.props).toMatchObject({ label: 'Guests', value: 4 })
    expect(snapshot!.dataModel).toEqual({ reservation: { guests: 4, time: '19:00' } })
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ name: 'confirm', surfaceId: 'legacy' }))
  })

  it('covers A2UI legacy beginRendering and action alias messages', () => {
    const onAction = vi.fn()
    const core = new VizualNativeCore({ onAction })

    const snapshot = core.dispatch([
      { beginRendering: { surfaceId: 'begin', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'begin',
          components: [{ id: 'root', component: 'Text', content: 'begin rendering created surface' }],
        },
      },
      {
        action: {
          type: 'selectRange',
          surfaceId: 'begin',
          componentId: 'root',
          context: { range: 'Q1' },
        },
      },
    ] as any)

    expect(snapshot!.surfaceId).toBe('begin')
    expect(snapshot!.spec.elements!.root.props).toMatchObject({ content: 'begin rendering created surface' })
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({
      name: 'selectRange',
      surfaceId: 'begin',
      sourceComponentId: 'root',
      context: { range: 'Q1' },
    }))
  })

  it('covers A2UI template children with item-scoped data binding', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { version: 'v0.9', createSurface: { surfaceId: 'template', catalogId: 'basic' } },
      { version: 'v0.9', updateDataModel: { surfaceId: 'template', path: '/messages', value: [{ name: 'Alice' }, { name: 'Bob' }] } },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'template',
          components: [
            { id: 'root', component: 'List', children: { template: { dataBinding: '/messages', componentId: 'message-item' } } },
            { id: 'message-item', component: 'Text', text: { path: 'name' } },
          ],
        },
      },
    ] as any)

    const renderedSpec = withDefaultElementProps(snapshot!.spec)
    const rootChildren = renderedSpec.elements!.root.children as string[]
    expect(rootChildren).toHaveLength(2)
    expect(renderedSpec.elements![rootChildren[0]].props).toMatchObject({ content: 'Alice' })
    expect(renderedSpec.elements![rootChildren[1]].props).toMatchObject({ content: 'Bob' })
  })

  it('keeps template-generated button actions wired for scoped list items', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { version: 'v0.10', createSurface: { surfaceId: 'template-actions', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateDataModel: {
          surfaceId: 'template-actions',
          path: '/issues',
          value: [
            { id: 'slow', label: '出水慢' },
            { id: 'leak', label: '漏水' },
          ],
        },
      },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'template-actions',
          components: [
            { id: 'root', component: 'List', children: { componentId: 'issue-action', path: '/issues' } },
            {
              id: 'issue-action',
              component: 'Button',
              label: { path: 'label' },
              action: 'selectIssue',
              actionParams: { issueId: { path: 'id' } },
            },
          ],
        },
      },
    ] as any)

    const renderedSpec = withDefaultElementProps(snapshot!.spec)
    const [firstChildId] = renderedSpec.elements!.root.children as string[]
    expect(renderedSpec.elements![firstChildId]).toMatchObject({
      type: 'Button',
      props: {
        label: '出水慢',
        action: 'selectIssue',
        actionParams: { issueId: 'slow' },
      },
      on: {
        selectIssue: { action: 'selectIssue' },
      },
    })
  })

  it('covers AG-UI text, reasoning, messages snapshot, and tool-call argument streams as native inputs', () => {
    const core = new VizualNativeCore()

    core.dispatch([
      { type: 'TEXT_MESSAGE_START', messageId: 'm1', role: 'assistant' },
      { type: 'TEXT_MESSAGE_CONTENT', messageId: 'm1', delta: '正在生成' },
      { type: 'TEXT_MESSAGE_CHUNK', messageId: 'm1', delta: '看板' },
      { type: 'TEXT_MESSAGE_END', messageId: 'm1' },
      { type: 'REASONING_MESSAGE_START', messageId: 'r1', role: 'reasoning' },
      { type: 'REASONING_MESSAGE_CONTENT', messageId: 'r1', delta: '选择表格和柱状图' },
      { type: 'REASONING_MESSAGE_END', messageId: 'r1' },
    ] as any)

    expect(core.getMessages()).toEqual([
      expect.objectContaining({ id: 'm1', role: 'assistant', content: '正在生成看板', status: 'complete' }),
      expect.objectContaining({ id: 'r1', role: 'reasoning', content: '选择表格和柱状图', status: 'complete' }),
    ])

    const activitySnapshot = core.dispatch({
      type: 'MESSAGES_SNAPSHOT',
      messages: [
        {
          id: 'a1',
          role: 'activity',
          activityType: 'a2ui-surface',
          content: {
            a2ui_operations: [
              { version: 'v0.9', createSurface: { surfaceId: 'agui-snapshot', catalogId: 'basic' } },
              { version: 'v0.9', updateDataModel: { surfaceId: 'agui-snapshot', path: '/', value: { title: 'Snapshot surface' } } },
              {
                version: 'v0.9',
                updateComponents: {
                  surfaceId: 'agui-snapshot',
                  components: [
                    { id: 'root', component: 'Text', text: { path: '/title' } },
                  ],
                },
              },
            ],
          },
        },
      ],
    } as any)

    expect(withDefaultElementProps(activitySnapshot!.spec).elements!.root.props).toMatchObject({ content: 'Snapshot surface' })

    expect(core.dispatch({
      type: 'ACTIVITY_SNAPSHOT',
      messageId: 'plain-activity',
      activityType: 'status',
      content: { text: '只是普通进度，不应该生成 surface' },
    } as any)).toBeNull()

    const args = JSON.stringify({
      a2uiMessages: [
        { version: 'v0.9', createSurface: { surfaceId: 'agui-tool', catalogId: 'basic' } },
        { version: 'v0.9', updateComponents: { surfaceId: 'agui-tool', components: [{ id: 'root', component: 'Text', text: 'Tool surface' }] } },
      ],
    })
    core.dispatch({ type: 'TOOL_CALL_START', toolCallId: 'tc1', toolCallName: 'render_a2ui' } as any)
    core.dispatch({ type: 'TOOL_CALL_ARGS', toolCallId: 'tc1', delta: args.slice(0, 40) } as any)
    core.dispatch({ type: 'TOOL_CALL_CHUNK', toolCallId: 'tc1', delta: args.slice(40) } as any)
    const toolSnapshot = core.dispatch({ type: 'TOOL_CALL_END', toolCallId: 'tc1' } as any)

    expect(toolSnapshot!.surfaceId).toBe('agui-tool')
    expect(withDefaultElementProps(toolSnapshot!.spec).elements!.root.props).toMatchObject({ content: 'Tool surface' })
    expect(core.getFunctionCalls()).toContainEqual(expect.objectContaining({ id: 'tc1', functionName: 'render_a2ui' }))
  })

  it('extracts A2UI messages from MCP EmbeddedResource and A2A-style MIME parts', () => {
    const core = new VizualNativeCore()
    const messages = [
      { version: 'v0.10', createSurface: { surfaceId: 'mcp-a2ui', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'mcp-a2ui',
          components: [{ id: 'root', component: 'Text', text: 'MCP resource rendered' }],
        },
      },
    ]

    const mcpSnapshot = core.dispatch({
      type: 'TOOL_CALL_RESULT',
      toolCallId: 'resource-tool',
      content: [
        { type: 'text', text: 'fallback' },
        {
          type: 'resource',
          resource: {
            uri: 'a2ui://mcp-a2ui',
            mimeType: 'application/a2ui+json',
            text: JSON.stringify(messages),
          },
        },
      ],
    } as any)

    expect(withDefaultElementProps(mcpSnapshot!.spec).elements!.root.props).toMatchObject({ content: 'MCP resource rendered' })

    const a2aSnapshot = core.dispatch({
      type: 'RAW',
      event: {
        kind: 'data',
        metadata: { mimeType: 'application/json+a2ui' },
        data: [
          { version: 'v0.10', createSurface: { surfaceId: 'a2a-legacy-mime', catalogId: 'vizual' } },
          {
            version: 'v0.10',
            updateComponents: {
              surfaceId: 'a2a-legacy-mime',
              components: [{ id: 'root', component: 'Text', text: 'A2A part rendered' }],
            },
          },
        ],
      },
    } as any)

    expect(withDefaultElementProps(a2aSnapshot!.spec).elements!.root.props).toMatchObject({ content: 'A2A part rendered' })
  })

  it('accepts current AG-UI render_a2ui structured args without model-owned catalogId', () => {
    const core = new VizualNativeCore({ defaultCatalogId: 'host-catalog' })
    const args = JSON.stringify({
      surfaceId: 'agui-structured',
      components: [
        { id: 'root', component: 'Column', children: { componentId: 'item', path: '/items' } },
        { id: 'item', component: 'Text', text: { path: 'name' } },
      ],
      data: { items: [{ name: 'One' }, { name: 'Two' }] },
    })

    core.dispatch({ type: 'TOOL_CALL_START', toolCallId: 'tc-current', toolCallName: 'render_a2ui' } as any)
    core.dispatch({ type: 'TOOL_CALL_ARGS', toolCallId: 'tc-current', delta: args } as any)
    const snapshot = core.dispatch({ type: 'TOOL_CALL_END', toolCallId: 'tc-current' } as any)

    const renderedSpec = withDefaultElementProps(snapshot!.spec)
    expect(snapshot!.catalogId).toBe('host-catalog')
    expect(renderedSpec.elements!.root.children).toHaveLength(2)
    expect(Object.values(renderedSpec.elements!).map((element: any) => element.props?.content)).toEqual(
      expect.arrayContaining(['One', 'Two'])
    )
  })

  it('accepts every AG-UI event category without requiring a bridge adapter', () => {
    const core = new VizualNativeCore()
    const eventFor = (type: typeof AG_UI_EVENT_TYPES[number]) => {
      switch (type) {
        case 'TEXT_MESSAGE_START': return { type, messageId: 'text-full', role: 'assistant' }
        case 'TEXT_MESSAGE_CONTENT': return { type, messageId: 'text-full', delta: 'AG-UI ' }
        case 'TEXT_MESSAGE_END': return { type, messageId: 'text-full' }
        case 'TEXT_MESSAGE_CHUNK': return { type, messageId: 'text-chunk', role: 'assistant', delta: 'chunk' }
        case 'TOOL_CALL_START': return { type, toolCallId: 'tool-full', toolCallName: 'noop' }
        case 'TOOL_CALL_ARGS': return { type, toolCallId: 'tool-full', delta: '{}' }
        case 'TOOL_CALL_END': return { type, toolCallId: 'tool-full' }
        case 'TOOL_CALL_CHUNK': return { type, toolCallId: 'tool-chunk', toolCallName: 'noop', delta: '{}' }
        case 'TOOL_CALL_RESULT': return { type, messageId: 'tool-message', toolCallId: 'tool-full', content: '{}' }
        case 'THINKING_START': return { type, title: 'legacy thinking' }
        case 'THINKING_END': return { type }
        case 'THINKING_TEXT_MESSAGE_START': return { type }
        case 'THINKING_TEXT_MESSAGE_CONTENT': return { type, delta: '旧 reasoning 流' }
        case 'THINKING_TEXT_MESSAGE_END': return { type }
        case 'STATE_SNAPSHOT': return { type, snapshot: { count: 1 } }
        case 'STATE_DELTA': return { type, delta: [{ op: 'replace', path: '/count', value: 2 }] }
        case 'MESSAGES_SNAPSHOT': return { type, messages: [{ id: 'snap-text', role: 'assistant', content: 'snapshot text' }] }
        case 'ACTIVITY_SNAPSHOT': return { type, messageId: 'activity-full', activityType: 'a2ui-surface', content: { a2ui_operations: [] } }
        case 'ACTIVITY_DELTA': return { type, messageId: 'activity-full', activityType: 'a2ui-surface', patch: [] }
        case 'RAW': return { type, event: {} }
        case 'CUSTOM': return { type, name: 'noop', value: {} }
        case 'RUN_STARTED': return { type, threadId: 't1', runId: 'run1' }
        case 'RUN_FINISHED': return { type, threadId: 't1', runId: 'run1' }
        case 'RUN_ERROR': return { type, message: 'boom' }
        case 'STEP_STARTED': return { type, stepName: 'plan' }
        case 'STEP_FINISHED': return { type, stepName: 'plan' }
        case 'REASONING_START': return { type, messageId: 'reason-2' }
        case 'REASONING_MESSAGE_START': return { type, messageId: 'reason-3', role: 'reasoning' }
        case 'REASONING_MESSAGE_CONTENT': return { type, messageId: 'reason-3', delta: '新 reasoning 流' }
        case 'REASONING_MESSAGE_END': return { type, messageId: 'reason-3' }
        case 'REASONING_MESSAGE_CHUNK': return { type, messageId: 'reason-2', delta: 'chunk reasoning' }
        case 'REASONING_END': return { type, messageId: 'reason-2' }
        case 'REASONING_ENCRYPTED_VALUE': return { type, subtype: 'message', entityId: 'reason-2', encryptedValue: 'opaque' }
      }
    }

    for (const type of AG_UI_EVENT_TYPES) core.dispatch(eventFor(type) as any)

    expect(core.getEventLog().map(event => event.type)).toEqual([...AG_UI_EVENT_TYPES])
    expect(core.getRunState()).toEqual({ count: 2 })
    expect(core.getRuns()).toEqual(expect.arrayContaining([
      expect.objectContaining({ runId: 'run1', status: 'completed' }),
      expect.objectContaining({ runId: 'default', status: 'failed', error: 'boom' }),
    ]))
    expect(core.getMessages()).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'snap-text', role: 'assistant', content: 'snapshot text', status: 'complete' }),
      expect.objectContaining({ id: 'reason-3', role: 'reasoning', content: '新 reasoning 流', status: 'complete' }),
    ]))
  })

  it('normalizes AGenUI catalog extensions into renderable Vizual-native component specs with non-empty chart data', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { version: 'v0.9', createSurface: { surfaceId: 'agenui', catalogId: 'agenui' } },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'agenui',
          components: [
            {
              id: 'root',
              component: 'Column',
              children: ['bar', 'line', 'donut', 'table', 'markdown', 'rich', 'web', 'lottie', 'carousel'],
            },
            {
              id: 'bar',
              component: 'Chart',
              chartType: 'bar',
              data: {
                xAxis: ['11:50', '12:50'],
                series: [{ name: 'Driving', data: [{ value: 1 }, { value: 2 }] }],
              },
            },
            {
              id: 'line',
              component: 'Chart',
              chartType: 'line',
              data: {
                xAxis: ['Morning', 'Evening'],
                series: [{ name: 'Public Transport', data: [{ value: 1.5 }, { value: 3 }] }],
              },
            },
            {
              id: 'donut',
              component: 'Chart',
              chartType: 'donut',
              data: {
                series: [{ name: '', data: [{ label: 'Public Transport', value: 50 }, { label: 'Driving', value: 30 }] }],
              },
            },
            {
              id: 'table',
              component: 'Table',
              columns: ['Name', 'Age'],
              rows: [['Alice', '25'], ['Bob', '30']],
            },
            { id: 'markdown', component: 'Markdown', content: '# Markdown Title\n\n- item' },
            { id: 'rich', component: 'RichText', text: '<p><strong>Rich</strong> text</p>' },
            { id: 'web', component: 'Web', source: 'https://a2ui.org/' },
            { id: 'lottie', component: 'Lottie', url: 'https://example.com/anim.json' },
            { id: 'carousel', component: 'Carousel', content: ['https://example.com/a.png', 'https://example.com/b.png'] },
          ],
        },
      },
    ] as any)

    const normalized = withDefaultElementProps(snapshot!.spec)
    expect(normalized.elements!.bar).toMatchObject({ type: 'BarChart' })
    expect(normalized.elements!.bar.props).toMatchObject({
      type: 'bar',
      x: 'label',
      y: ['Driving'],
      data: [{ label: '11:50', Driving: 1 }, { label: '12:50', Driving: 2 }],
    })
    expect(normalized.elements!.line).toMatchObject({ type: 'LineChart' })
    expect(normalized.elements!.line.props).toMatchObject({
      type: 'line',
      x: 'label',
      y: ['Public Transport'],
    })
    expect(normalized.elements!.donut).toMatchObject({ type: 'PieChart' })
    expect(normalized.elements!.donut.props).toMatchObject({
      type: 'pie',
      donut: true,
      label: 'label',
      value: 'value',
      data: [{ label: 'Public Transport', value: 50 }, { label: 'Driving', value: 30 }],
    })
    expect(normalized.elements!.table).toMatchObject({
      type: 'DataTable',
      props: {
        columns: [{ key: 'Name', label: 'Name' }, { key: 'Age', label: 'Age' }],
        data: [{ Name: 'Alice', Age: '25' }, { Name: 'Bob', Age: '30' }],
      },
    })
    expect(normalized.elements!.markdown).toMatchObject({
      type: 'Markdown',
      props: { content: '# Markdown Title\n\n- item' },
    })
    expect(normalized.elements!.rich.type).toBe('Markdown')
    expect(String(normalized.elements!.rich.props!.content)).not.toHaveLength(0)
    expect(normalized.elements!.web.type).toBe('Markdown')
    expect(String(normalized.elements!.web.props!.content)).not.toHaveLength(0)
    expect(normalized.elements!.lottie.type).toBe('Text')
    expect(String(normalized.elements!.lottie.props!.content)).not.toHaveLength(0)
    expect(normalized.elements!.carousel.type).toBe('Markdown')
    expect(String(normalized.elements!.carousel.props!.content)).not.toHaveLength(0)
  })

  it('maps the complete AGenUI catalog component list to registered Vizual-native render targets', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { version: 'v0.9', createSurface: { surfaceId: 'agenui-catalog', catalogId: 'agenui' } },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'agenui-catalog',
          components: [
            { id: 'root', component: 'Column', children: [...AGENUI_CATALOG_COMPONENTS] },
            { id: 'Text', component: 'Text', text: 'Text component', variant: 'h2' },
            { id: 'Image', component: 'Image', url: 'https://example.com/image.png', description: 'Image component' },
            { id: 'Icon', component: 'Icon', name: 'check' },
            { id: 'Video', component: 'Video', src: 'https://example.com/video.mp4' },
            { id: 'AudioPlayer', component: 'AudioPlayer', src: 'https://example.com/audio.mp3', title: 'Audio component' },
            { id: 'Row', component: 'Row', children: ['row-text'] },
            { id: 'row-text', component: 'Text', text: 'Row child' },
            { id: 'Column', component: 'Column', children: ['column-text'] },
            { id: 'column-text', component: 'Text', text: 'Column child' },
            { id: 'List', component: 'List', items: ['one', 'two'] },
            { id: 'Card', component: 'Card', title: 'Card title', child: 'card-text' },
            { id: 'card-text', component: 'Text', text: 'Card child' },
            { id: 'Tabs', component: 'Tabs', items: [{ title: 'General', child: 'card-text' }], activeKey: 'General' },
            { id: 'Divider', component: 'Divider' },
            { id: 'Button', component: 'Button', text: 'Open URL', action: { functionCall: { call: 'openUrl', args: { url: 'https://example.com' } } } },
            { id: 'TextField', component: 'TextField', label: 'Email', value: 'alice@example.com' },
            { id: 'CheckBox', component: 'CheckBox', label: 'Agree', checked: true },
            { id: 'ChoicePicker', component: 'ChoicePicker', label: 'Country', value: 'ca', options: [{ label: 'USA', value: 'us' }, { label: 'Canada', value: 'ca' }] },
            { id: 'Slider', component: 'Slider', label: 'Score', min: 0, max: 10, value: 7 },
            { id: 'DateTimeInput', component: 'DateTimeInput', label: 'Date', value: '2026-06-01' },
            { id: 'RichText', component: 'RichText', text: '<p><strong>Rich</strong> text</p>' },
            { id: 'Lottie', component: 'Lottie', url: 'https://example.com/animation.json' },
            { id: 'Table', component: 'Table', columns: ['Name', 'Age'], rows: [['Alice', '25']] },
            { id: 'Web', component: 'Web', source: 'https://a2ui.org/' },
            { id: 'Markdown', component: 'Markdown', content: '# Markdown' },
            {
              id: 'Chart',
              component: 'Chart',
              chartType: 'bar_grouped',
              data: {
                xAxis: ['A', 'B'],
                series: [
                  { name: 'S1', data: [{ value: 1 }, { value: 2 }] },
                  { name: 'S2', data: [{ value: 3 }, { value: 4 }] },
                ],
              },
            },
            { id: 'Carousel', component: 'Carousel', content: ['https://example.com/a.png', 'https://example.com/b.png'] },
          ],
        },
      },
    ] as any)

    const normalized = withDefaultElementProps(snapshot!.spec)
    expect(normalized.elements!.root.children).toEqual([...AGENUI_CATALOG_COMPONENTS])
    const expectedTypes: Record<string, string> = {
      Text: 'Text',
      Image: 'Image',
      Icon: 'Icon',
      Video: 'Video',
      AudioPlayer: 'AudioPlayer',
      Row: 'Row',
      Column: 'Column',
      List: 'List',
      Card: 'Card',
      Tabs: 'Tabs',
      Divider: 'Divider',
      Button: 'Button',
      TextField: 'TextField',
      CheckBox: 'CheckBox',
      ChoicePicker: 'ChoicePicker',
      Slider: 'Slider',
      DateTimeInput: 'DateTimeInput',
      RichText: 'Markdown',
      Lottie: 'Text',
      Table: 'DataTable',
      Web: 'Markdown',
      Markdown: 'Markdown',
      Chart: 'BarChart',
      Carousel: 'Markdown',
    }

    for (const componentName of AGENUI_CATALOG_COMPONENTS) {
      expect(normalized.elements![componentName]?.type, componentName).toBe(expectedTypes[componentName])
    }
    expect(normalized.elements!.Text.props).toMatchObject({ content: 'Text component', variant: 'heading' })
    expect(normalized.elements!.Button.props).toMatchObject({ label: 'Open URL', action: 'openUrl' })
    expect(normalized.elements!.Table.props).toMatchObject({ data: [{ Name: 'Alice', Age: '25' }] })
    expect(normalized.elements!.Chart.props).toMatchObject({
      type: 'bar',
      x: 'label',
      y: ['S1', 'S2'],
      data: [{ label: 'A', S1: 1, S2: 3 }, { label: 'B', S1: 2, S2: 4 }],
    })
  })
})
