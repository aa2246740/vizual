import React from 'react'
import type { ImageProps } from './schema'

export function Image({ props }: { props: ImageProps }) {
  const { src, alt = '', width = '100%', height, fit = 'cover', radius = 8 } = props
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : 'auto',
        objectFit: fit,
        borderRadius: radius,
        display: 'block',
        maxWidth: '100%',
      }}
    />
  )
}
