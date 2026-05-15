import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { IconProps } from './schema'

export function Icon({ props }: { props: IconProps }) {
  const { name, size = 24, color } = props
  return (
    <span style={{
      fontSize: size,
      lineHeight: 1,
      color: color || tcss('--rk-text-primary'),
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
    }}>
      {name}
    </span>
  )
}
