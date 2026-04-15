import type { EmptySpaceProps } from './schema'

/**
 * Spacer component
 */
export function EmptySpace(props: EmptySpaceProps) {
  return (props) => <div style={{height: props.height ?? 24}} />
}
