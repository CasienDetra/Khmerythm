import { khmerKeyboardLayout } from '../../keyboardLayout'

const CODE_BY_CHAR: Record<string, string> = {
  '`': 'Backquote',
  '-': 'Minus', '=': 'Equal',
  '[': 'BracketLeft', ']': 'BracketRight', '\\': 'Backslash',
  ';': 'Semicolon', "'": 'Quote',
  ',': 'Comma', '.': 'Period', '/': 'Slash',
}

for (const digit of '1234567890') CODE_BY_CHAR[digit] = `Digit${digit}`
for (const row of 'qwertyuiopasdfghjklzxcvbnm') CODE_BY_CHAR[row] = `Key${row.toUpperCase()}`

/* Each physical key carries its Khmer normal and shifted characters from our layout. */
export const KHMER_LAYOUT: Record<string, [string, string?]> = {}
for (const row of khmerKeyboardLayout) {
  for (const key of row) {
    const code = CODE_BY_CHAR[key[2]]
    if (code && key[0]) {
      KHMER_LAYOUT[code] = [key[0], key[1] ?? undefined]
    }
  }
}

/* Translate the app's "shift + q" hints into physical key codes. */
export function toKeyCodes(keys: string[]): Set<string> {
  const codes = new Set<string>()
  for (const key of keys) {
    if (key === 'shift') {
      codes.add('ShiftLeft')
      codes.add('ShiftRight')
    } else if (key === 'space') {
      codes.add('Space')
    } else {
      const code = CODE_BY_CHAR[key] ?? CODE_BY_CHAR[key.toLowerCase()]
      if (code) codes.add(code)
    }
  }
  return codes
}
