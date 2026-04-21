import { useState, useCallback } from 'react'
import type { TreeViewProps, TreeNode } from './schema'
import { tcss, tc } from '../../core/theme-colors'

/** 递归树节点渲染 */
function TreeNodeItem({
  node,
  depth,
  showIcons,
  selectable,
  activeId,
  onSelect,
}: {
  node: TreeNode
  depth: number
  showIcons: boolean
  selectable: boolean
  activeId?: string
  onSelect?: (id: string) => void
}) {
  const hasChildren = node.children && node.children.length > 0
  const [expanded, setExpanded] = useState(node.expanded || false)
  const isActive = activeId === node.id

  const handleToggle = useCallback(() => {
    if (hasChildren) setExpanded(prev => !prev)
  }, [hasChildren])

  const handleSelect = useCallback(() => {
    if (selectable && !node.disabled) {
      onSelect?.(node.id)
    }
  }, [selectable, node.disabled, node.id, onSelect])

  const indent = depth * 20
  const nodeColor = node.disabled
    ? tcss('--rk-text-tertiary')
    : isActive
      ? tcss('--rk-accent')
      : tcss('--rk-text-primary')

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          paddingLeft: 8 + indent,
          cursor: selectable && !node.disabled ? 'pointer' : hasChildren ? 'pointer' : 'default',
          borderRadius: tcss('--rk-radius-sm'),
          color: nodeColor,
          fontSize: 13,
          gap: 6,
          transition: 'background 0.15s',
          userSelect: 'none',
          ...(isActive ? { background: tcss('--rk-accent-muted') } : {}),
        }}
        onClick={handleSelect || handleToggle}
        onMouseEnter={(e) => {
          if (!node.disabled) (e.currentTarget as HTMLElement).style.background = tcss('--rk-bg-tertiary')
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = isActive ? tcss('--rk-accent-muted') : 'transparent'
        }}
      >
        {/* 展开/折叠箭头 */}
        <span style={{
          width: 16,
          height: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: tcss('--rk-text-tertiary'),
          flexShrink: 0,
          transition: 'transform 0.2s',
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          visibility: hasChildren ? 'visible' : 'hidden',
        }} onClick={(e) => { e.stopPropagation(); handleToggle() }}>
          ▶
        </span>

        {/* 图标 */}
        {showIcons && node.icon && (
          <span style={{ fontSize: 14, flexShrink: 0 }}>{node.icon}</span>
        )}

        {/* 文件夹图标（无自定义 icon 时给有子节点的项加默认图标） */}
        {showIcons && !node.icon && hasChildren && (
          <span style={{ fontSize: 14, flexShrink: 0 }}>{expanded ? '📂' : '📁'}</span>
        )}

        {/* 标签 */}
        <span style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textDecoration: node.disabled ? 'line-through' : 'none',
        }}>
          {node.label}
        </span>

        {/* 角标 */}
        {node.badge !== undefined && (
          <span style={{
            fontSize: 11,
            padding: '1px 6px',
            borderRadius: 10,
            background: node.color || tcss('--rk-accent-muted'),
            color: node.color ? '#fff' : tcss('--rk-accent'),
            flexShrink: 0,
          }}>
            {node.badge}
          </span>
        )}
      </div>

      {/* 子节点 */}
      {hasChildren && expanded && node.children!.map(child => (
        <TreeNodeItem
          key={child.id}
          node={child}
          depth={depth + 1}
          showIcons={showIcons}
          selectable={selectable}
          activeId={activeId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

export function TreeView({ props }: { props: TreeViewProps }) {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const activeId = props.activeId || selectedId

  return (
    <div style={{
      padding: '8px 0',
      fontFamily: tcss('--rk-font-sans'),
    }}>
      {props.title && (
        <div style={{
          fontSize: 13,
          color: tcss('--rk-text-secondary'),
          marginBottom: 8,
          fontWeight: 500,
        }}>
          {props.title}
        </div>
      )}
      <div style={{
        background: tcss('--rk-bg-secondary'),
        border: `1px solid ${tcss('--rk-border-subtle')}`,
        borderRadius: tcss('--rk-radius-md'),
        padding: 8,
        maxHeight: 480,
        overflow: 'auto',
      }}>
        {props.data.map(node => (
          <TreeNodeItem
            key={node.id}
            node={node}
            depth={0}
            showIcons={props.showIcons !== false}
            selectable={props.selectable || false}
            activeId={activeId}
            onSelect={props.selectable ? setSelectedId : undefined}
          />
        ))}
      </div>
    </div>
  )
}
