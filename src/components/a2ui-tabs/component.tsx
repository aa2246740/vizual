import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { TabsProps } from './schema'

export function Tabs({ props, children }: { props: TabsProps; children?: React.ReactNode }) {
  const { tabs = [], activeTab } = props
  const active = activeTab || tabs[0]?.key

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', borderBottom: `1px solid ${tcss('--rk-border')}`,
        gap: 0,
      }}>
        {tabs.map(tab => (
          <div key={tab.key} style={{
            padding: '8px 16px',
            fontSize: 14,
            fontFamily: tcss('--rk-font-sans'),
            color: tab.key === active ? tcss('--rk-accent') : tcss('--rk-text-secondary'),
            borderBottom: tab.key === active ? `2px solid ${tcss('--rk-accent')}` : '2px solid transparent',
            fontWeight: tab.key === active ? 600 : 400,
            cursor: 'default',
          }}>
            {tab.label}
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 0' }}>
        {children}
      </div>
    </div>
  )
}
