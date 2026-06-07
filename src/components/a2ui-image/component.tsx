import React from 'react'
import type { ImageProps } from './schema'

export function Image({ props }: { props: ImageProps }) {
  const {
    width,
    height,
    fit = 'cover',
    radius = 8,
  } = props
  const src = props.src ?? props.url ?? ''
  const alt = props.alt ?? props.description ?? ''
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : 'fit-content',
        height: height ? (typeof height === 'number' ? `${height}px` : height) : 'auto',
        objectFit: fit,
        borderRadius: radius,
        display: 'block',
        maxWidth: '100%',
      }}
    />
  )
}
