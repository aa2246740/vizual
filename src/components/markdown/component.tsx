import { renderMarkdownContent } from './renderer'
import type { MarkdownProps } from './schema'

export function Markdown({ props }: { props: MarkdownProps }) {
  const content = props.content ?? props.markdown ?? props.text ?? ''
  return <>{renderMarkdownContent(content)}</>
}
