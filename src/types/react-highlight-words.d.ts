declare module 'react-highlight-words' {
  import { ComponentType, ReactNode } from 'react'

  export interface HighlighterProps {
    searchWords: string[]
    textToHighlight: string
    autoEscape?: boolean
    highlightTag?: ComponentType<{
      children: ReactNode
      highlightIndex: number
    }>
    highlightClassName?: string
    highlightStyle?: Record<string, string | number>
    unhighlightClassName?: string
    unhighlightStyle?: Record<string, string | number>
    className?: string
    style?: Record<string, string | number>
    activeIndex?: number
    caseSensitive?: boolean
    findChunks?: (options: {
      searchWords: string[]
      textToHighlight: string
    }) => { start: number; end: number }[]
  }

  const Highlighter: ComponentType<HighlighterProps>
  export default Highlighter
}
