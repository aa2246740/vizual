import React, { useState, useMemo } from 'react'
import { Renderer } from '@json-render/react'
import type { InteractivePlaygroundProps, Control } from './schema'
import { ControlRenderer } from './controls'
import { tcss, tc } from '../../core/theme-colors'
import { AnnotatableWrapper } from '../../docview/annotatable-wrapper'
import { registry } from '../../registry'

/**
 * InteractivePlayground — 通用交互式组件包裹器
 *
 * AI 定义交互控件（slider/select/toggle/color/text/number/buttonGroup），
 * 用户操作控件 → 实时重渲染被包裹的组件。
 *
 * 用途：教学演示、参数探索、配色调优、组件能力展示。
 * 控制面板默认收起（节省空间），点击齿轮图标展开。
 */
export function InteractivePlayground({ props }: { props: InteractivePlaygroundProps }) {
  const { title, description, component, controls, layout = 'side-by-side' } = props

  // 控制面板折叠状态 — 默认收起
  const [panelOpen, setPanelOpen] = useState(false)

  // 初始化控件默认值
  const initialValues = useMemo(() => {
    const vals: Record<string, unknown> = {}
    for (const c of controls) {
      if ('defaultValue' in c && c.defaultValue !== undefined) {
        vals[c.name] = c.defaultValue
      } else if (c.type === 'select' || c.type === 'buttonGroup') {
        vals[c.name] = c.values?.[0] ?? c.options[0]
      } else if (c.type === 'toggle') {
        vals[c.name] = false
      } else if (c.type === 'color') {
        vals[c.name] = '#667eea'
      } else if (c.type === 'text') {
        vals[c.name] = ''
      } else if (c.type === 'number' || c.type === 'slider') {
        vals[c.name] = 0
      }
    }
    return vals
  }, [controls])

  const [controlValues, setControlValues] = useState<Record<string, unknown>>(initialValues)

  // 合并控件值到组件 props
  const mergedProps = useMemo(() => {
    const merged = { ...component.props }
    for (const c of controls) {
      const val = controlValues[c.name]
      if (val !== undefined) {
        merged[c.targetProp] = val
      }
    }
    return merged
  }, [component.props, controls, controlValues])

  // 构建 mini-spec 用于 Renderer 渲染内部组件
  const miniSpec = useMemo(() => ({
    root: 'inner',
    elements: {
      inner: {
        type: component.type,
        props: mergedProps,
        children: [],
      },
    },
  }), [component.type, mergedProps])

  const handleControlChange = (name: string) => (value: unknown) => {
    setControlValues(prev => ({ ...prev, [name]: value }))
  }

  const isSideBySide = layout === 'side-by-side'

  // 切换按钮样式
  const toggleBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    color: tcss('--rk-text-tertiary'),
    fontSize: tcss('--rk-text-sm'),
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    transition: 'color 0.2s',
  }

  return (
    <AnnotatableWrapper targetType="component" componentType="InteractivePlayground" label={title || 'Playground'}>
    <div style={{
      border: `1px solid ${tcss('--rk-border-subtle')}`,
      borderRadius: tcss('--rk-radius-lg'),
      overflow: 'hidden',
      background: tcss('--rk-bg-primary'),
    }}>
      {/* 标题栏：标题 + 折叠按钮 */}
      <div style={{
        padding: '8px 12px',
        borderBottom: `1px solid ${tcss('--rk-border-subtle')}`,
        background: tcss('--rk-bg-secondary'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {title && (
            <div style={{
              fontSize: tcss('--rk-text-sm'),
              fontWeight: tcss('--rk-weight-semibold'),
              color: tcss('--rk-text-primary'),
            }}>
              {title}
            </div>
          )}
          {description && (
            <div style={{
              fontSize: tcss('--rk-text-xs'),
              color: tcss('--rk-text-tertiary'),
            }}>
              {description}
            </div>
          )}
        </div>
        <button
          style={toggleBtnStyle}
          onClick={() => setPanelOpen(prev => !prev)}
          title={panelOpen ? '收起控件' : '展开控件'}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>{panelOpen ? '▾' : '⋮⋮'}</span>
          <span>{panelOpen ? '收起' : '控件'}</span>
        </button>
      </div>

      {/* 内容区域 */}
      <div style={{
        display: 'flex',
        flexDirection: isSideBySide ? 'row' : 'column',
      }}>
        {/* 组件预览 */}
        <div style={{
          flex: 1,
          padding: 12,
          minWidth: 0,
          minHeight: 200,
        }}>
          <Renderer spec={miniSpec} registry={registry} />
        </div>

        {/* 控制面板 — 折叠/展开 */}
        {panelOpen && (
          <div style={{
            width: isSideBySide ? 200 : 'auto',
            minWidth: isSideBySide ? 200 : 'auto',
            borderLeft: isSideBySide ? `1px solid ${tcss('--rk-border-subtle')}` : 'none',
            borderTop: isSideBySide ? 'none' : `1px solid ${tcss('--rk-border-subtle')}`,
            padding: '10px 12px',
            background: tcss('--rk-bg-secondary'),
            overflowY: 'auto',
            maxHeight: isSideBySide ? 400 : 'none',
          }}>
            {controls.map((control) => (
              <ControlRenderer
                key={control.name}
                control={control}
                value={controlValues[control.name]}
                onChange={handleControlChange(control.name)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
    </AnnotatableWrapper>
  )
}
