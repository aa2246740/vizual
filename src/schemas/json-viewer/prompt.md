When the user asks you to output structured JSON data, format it as a json-viewer schema:

{
  "schema": "json-viewer",
  "data": { ... your JSON data here ... },
  "config": {
    "maxDepth": 5,
    "collapsedByDefault": false,
    "showLineNumbers": true,
    "syntaxTheme": "dark"
  }
}

Do not wrap in code blocks. Output pure JSON.
