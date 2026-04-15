import type { ParsedSchema } from '../../core/types'

export type CodeLanguage =
  | 'javascript' | 'typescript' | 'python' | 'go' | 'rust'
  | 'java' | 'bash' | 'json' | 'html' | 'css' | 'sql' | 'other'

export interface CodeBlockParsed extends ParsedSchema {
  code: string
  language: CodeLanguage
  filename?: string
  highlightLines: number[]
}

const JS_KEYWORDS = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'new', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'typeof', 'instanceof', 'switch', 'case', 'break', 'continue', 'default', 'this', 'true', 'false', 'null', 'undefined', 'of', 'in', 'yield', 'delete', 'void']
const PYTHON_KEYWORDS = ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'raise', 'pass', 'break', 'continue', 'lambda', 'yield', 'and', 'or', 'not', 'in', 'is', 'True', 'False', 'None', 'self', 'print', 'async', 'await']

function getKeywords(language: CodeLanguage): string[] {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return JS_KEYWORDS
    case 'python':
      return PYTHON_KEYWORDS
    default:
      return []
  }
}

export function parseCodeBlockSchema(input: unknown): CodeBlockParsed {
  if (!input || typeof input !== 'object') {
    return { valid: false, code: '', language: 'javascript', highlightLines: [], fallback: true, originalInput: input }
  }

  const obj = input as Record<string, unknown>

  if (typeof obj.code !== 'string') {
    return { valid: false, code: '', language: 'javascript', highlightLines: [], fallback: true, originalInput: input }
  }

  if (obj.code === '') {
    return { valid: false, code: '', language: 'javascript', highlightLines: [], fallback: true, originalInput: input }
  }

  const validLanguages: CodeLanguage[] = ['javascript', 'typescript', 'python', 'go', 'rust', 'java', 'bash', 'json', 'html', 'css', 'sql', 'other']
  const language = validLanguages.includes(obj.language as CodeLanguage) ? (obj.language as CodeLanguage) : 'javascript'

  return {
    valid: true,
    code: obj.code,
    language,
    filename: typeof obj.filename === 'string' ? obj.filename : undefined,
    highlightLines: Array.isArray(obj.highlightLines) ? obj.highlightLines.filter((n: unknown) => typeof n === 'number') : [],
  }
}

export function tokenizeLine(line: string, language: CodeLanguage): Array<{ text: string; type: string }> {
  const keywords = getKeywords(language)
  const tokens: Array<{ text: string; type: string }> = []

  // Simple regex-based tokenizer
  const regex = /("[^"]*"|'[^']*'|`[^`]*`|\b\d+(?:\.\d+)?\b|\/\/.*$|\/\*[\s\S]*?\*\/|\b\w+\b|[^\s\w]+)/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(line)) !== null) {
    const text = match[0]

    if (text.startsWith('//') || text.startsWith('/*')) {
      tokens.push({ text, type: 'comment' })
    } else if (text.startsWith('"') || text.startsWith("'") || text.startsWith('`')) {
      tokens.push({ text, type: 'string' })
    } else if (/^\d+(\.\d+)?$/.test(text)) {
      tokens.push({ text, type: 'number' })
    } else if (keywords.includes(text)) {
      tokens.push({ text, type: 'keyword' })
    } else if (/^[a-zA-Z_]\w*$/.test(text)) {
      tokens.push({ text, type: 'identifier' })
    } else {
      tokens.push({ text, type: 'punctuation' })
    }
  }

  return tokens
}
