declare module 'mermaid' {
  const mermaid: {
    initialize(options: { startOnLoad?: boolean; theme?: string }): void
    render(id: string, code: string): Promise<{ svg: string }>
  }
  export default mermaid
}
