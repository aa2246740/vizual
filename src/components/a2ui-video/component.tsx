import React from 'react'
import type { VideoProps } from './schema'

export function Video({ props }: { props: VideoProps }) {
  const { src, width = '100%', height, autoplay = false, muted = false } = props
  return (
    <video
      src={src}
      autoPlay={autoplay}
      muted={muted}
      controls
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : 'auto',
        borderRadius: 8,
        display: 'block',
        maxWidth: '100%',
      }}
    />
  )
}
