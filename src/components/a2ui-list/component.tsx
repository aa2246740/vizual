import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { ListProps } from './schema'

export function List({ props }: { props: ListProps }) {
  const { items = [], ordered = false, gap = 4 } = props
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag style={{
      margin: 0,
      paddingLeft: 20,
      display: 'flex',
      flexDirection: 'column',
      gap,
      color: tcss('--rk-text-primary'),
      fontFamily: tcss('--rk-font-sans'),
      fontSize: 14,
      lineHeight: 1.5,
    }}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </Tag>
  )
}
