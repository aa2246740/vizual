import React, { useEffect, useState } from 'react'
import { tcss } from '../../core/theme-colors'
import type { TabsProps } from './schema'

export function Tabs({ props, children }: { props: TabsProps; children?: React.ReactNode }) {
  const { tabs = [], activeTab, activeKey } = props
  const normalizedTabs = tabs.map((tab, index) => {
    const key = tab.key ?? tab.id ?? tab.value ?? tab.label ?? `tab-${index + 1}`
    return { ...tab, key }
  })
  const fallbackActive = activeTab || activeKey || normalizedTabs[0]?.key
  const [active, setActive] = useState(fallbackActive)

  useEffect(() => {
    setActive(fallbackActive)
  }, [fallbackActive])

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', borderBottom: `1px solid ${tcss('--rk-border')}`,
        gap: 0,
      }}>
        {normalizedTabs.map(tab => (
          <button key={tab.key} type="button" onClick={() => setActive(tab.key)} style={{
            padding: '8px 16px',
            fontSize: 14,
            fontFamily: tcss('--rk-font-sans'),
            color: tab.key === active ? tcss('--rk-accent') : tcss('--rk-text-secondary'),
            borderBottom: tab.key === active ? `2px solid ${tcss('--rk-accent')}` : '2px solid transparent',
            borderTop: 0,
            borderLeft: 0,
            borderRight: 0,
            background: 'transparent',
            fontWeight: tab.key === active ? 600 : 400,
            cursor: 'pointer',
          }}>
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ padding: '12px 0' }}>
        {children}
      </div>
    </div>
  )
}
