/** Mock for 'marked' module — used when marked is not installed */
export const marked = {
  parse: (input: string) => `<p>${input}</p>`,
  setOptions: () => {},
}
