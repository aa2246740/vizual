import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { AudioPlayerProps } from './schema'

export function AudioPlayer({ props }: { props: AudioPlayerProps }) {
  const { src, title } = props
  return (
    <div style={{
      background: tcss('--rk-bg-secondary'),
      borderRadius: 8,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {title && (
        <span style={{ fontSize: 14, fontWeight: 500, color: tcss('--rk-text-primary'), fontFamily: tcss('--rk-font-sans') }}>
          {title}
        </span>
      )}
      <audio src={src} controls style={{ width: '100%' }} />
    </div>
  )
}
