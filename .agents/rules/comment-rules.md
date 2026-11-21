# Comment rules

Code explains itself. Comments say what the code cannot: why.

## Write comments only when they matter

- Keep a comment only if it explains a why the code cannot show: a tradeoff, a
  platform quirk, a rule another file depends on, a hazard a reader would
  otherwise break. Examples that earn their place:
  - `defer os.Remove(tmp.Name()) /* gone after Rename; fails harmlessly then */`
  - `/* Checked was already toggled before Click ran. */`
- Delete a comment that restates the code: `// whole formats a slider's value as
  an integer.` next to `func whole` says nothing the name does not.
- Do not add comments to make code self-explanatory. Rename the code instead.
- Keep `shortcut: <the limit>, <when to upgrade>` comments until the upgrade lands.

## Style: block comments

- Every comment is a C-style block: `/* ... */`. No `//` line comments, no
  trailing `//` after code.
- Trailing comments sit on the same line: `path string /* window-state.json */`.
- Standing comments go above the code, with the body indented to the same level
  as the code it describes:
  /*
  Set replaces the settings, sanitized, and saves them. A save error keeps the
  new settings live and returns the error, so the settings window can say so.
  */
- Doc comments on exported and package-level declarations follow this shape:
  package docs start with `Package <name> ...`, function docs with the name.
- Compiler directives stay as they are: `//go:embed`, `//go:generate`. They are
  not comments.
