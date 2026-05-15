import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { ModalProps } from './schema'

export function Modal({ props, children }: { props: ModalProps; children?: React.ReactNode }) {
  const { title, open = false, width = 480 } = props
  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: tcss('--rk-bg-secondary'),
        borderRadius: 12,
        width,
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      }}>
        {title && (
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${tcss('--rk-border')}`,
            fontSize: 16, fontWeight: 600,
            color: tcss('--rk-text-primary'),
            fontFamily: tcss('--rk-font-sans'),
          }}>
            {title}
          </div>
        )}
        <div style={{ padding: 20 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
