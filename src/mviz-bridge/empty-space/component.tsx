import type { EmptySpaceProps } from './schema'

/**
 * Spacer component
 */
export function EmptySpace({ props }: { props: EmptySpaceProps }) {
  return <div style={{height: props.height ?? 24}} />
}
