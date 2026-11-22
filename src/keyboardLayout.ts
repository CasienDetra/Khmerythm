/* Each key: [khmer normal, khmer shifted, english normal, english shifted, css classes].
   Special keys carry the action in slot 2 and the label in slot 3. */
export type KeyDef = [string | null, string | null, string, string, string]
export type RowDef = KeyDef[]

export const khmerKeyboardLayout: RowDef[] = [
  [
    ['«', '»', '`', '~', 'key-char'],
    ['១', '!', '1', '!', 'key-char'],
    ['២', 'ៗ', '2', '@', 'key-char'],
    ['៣', '"', '3', '#', 'key-char'],
    ['៤', '៛', '4', '$', 'key-char'],
    ['៥', '%', '5', '%', 'key-char'],
    ['៦', '៍', '6', '^', 'key-char'],
    ['៧', '័', '7', '&', 'key-char'],
    ['៨', '៏', '8', '*', 'key-char'],
    ['៩', 'ឰ', '9', '(', 'key-char'],
    ['០', 'ឳ', '0', ')', 'key-char'],
    ['ឥ', '៌', '-', '_', 'key-char'],
    ['ឲ', '៎', '=', '+', 'key-char'],
    [null, null, 'backspace', 'លុប', 'special-key key-backspace']
  ],
  [
    [null, null, 'tab', 'Tab', 'special-key key-tab'],
    ['ឆ', 'ឈ', 'q', 'Q', 'key-char'],
    ['ឹ', 'ឺ', 'w', 'W', 'key-char'],
    ['េ', 'ែ', 'e', 'E', 'key-char'],
    ['រ', 'ឬ', 'r', 'R', 'key-char'],
    ['ត', 'ទ', 't', 'T', 'key-char'],
    ['យ', 'ួ', 'y', 'Y', 'key-char'],
    ['ុ', 'ូ', 'u', 'U', 'key-char'],
    ['ិ', 'ី', 'i', 'I', 'key-char'],
    ['ោ', 'ៅ', 'o', 'O', 'key-char'],
    ['ផ', 'ភ', 'p', 'P', 'key-char'],
    ['ៀ', 'ឿ', '[', '{', 'key-char'],
    ['ឪ', 'ឧ', ']', '}', 'key-char'],
    ['ឭ', 'ឮ', '\\', '|', 'key-char key-backslash']
  ],
  [
    [null, null, 'capslock', 'Caps Lock', 'special-key key-capslock'],
    ['ា', 'ឫ', 'a', 'A', 'key-char'],
    ['ស', 'ៃ', 's', 'S', 'key-char'],
    ['ដ', 'ឌ', 'd', 'D', 'key-char'],
    ['ថ', 'ធ', 'f', 'F', 'key-char'],
    ['ង', 'អ', 'g', 'G', 'key-char'],
    ['ហ', 'ះ', 'h', 'H', 'key-char'],
    ['្', 'ញ', 'j', 'J', 'key-char coeng-trigger-key'],
    ['ក', 'គ', 'k', 'K', 'key-char'],
    ['ល', 'ឡ', 'l', 'L', 'key-char'],
    ['ើ', '៖', ';', ':', 'key-char'],
    ['់', '៉', "'", '"', 'key-char'],
    [null, null, 'enter', 'Enter', 'special-key key-enter']
  ],
  [
    [null, null, 'shift', 'Shift', 'special-key key-shift key-shift-left'],
    ['ឋ', 'ឍ', 'z', 'Z', 'key-char'],
    ['ខ', 'ឃ', 'x', 'X', 'key-char'],
    ['ច', 'ជ', 'c', 'C', 'key-char'],
    ['វ', 'ៈ', 'v', 'V', 'key-char'],
    ['ប', 'ព', 'b', 'B', 'key-char'],
    ['ន', 'ណ', 'n', 'N', 'key-char'],
    ['ម', 'ំ', 'm', 'M', 'key-char'],
    ['ឦ', 'ឱ', ',', '<', 'key-char'],
    ['។', '៕', '.', '>', 'key-char'],
    ['៊', 'ឯ', '/', '?', 'key-char'],
    [null, null, 'shift', 'Shift', 'special-key key-shift key-shift-right']
  ],
  [
    [null, null, 'ctrl', ' ', 'special-key key-ctrl key-ctrl-left'],
    [null, null, 'alt', ' ', 'special-key key-alt key-alt-left'],
    [null, null, 'space', 'ដកឃ្លាក់', 'special-key key-space'],
    [null, null, 'altgr', ' ', 'special-key key-altgr key-alt-right'],
    [null, null, 'ctrl', ' ', 'special-key key-ctrl key-ctrl-right']
  ]
];

/* Maps a Khmer character to its QWERTY keystrokes, like "Shift + q" or "q". */
export const khmerToQwertyMap: Record<string, string> = {
  '«': '`', '»': 'Shift + `',
  '១': '1', '!': 'Shift + 1',
  '២': '2', 'ៗ': 'Shift + 2',
  '៣': '3', '"': 'Shift + 3',
  '៤': '4', '៛': 'Shift + 4',
  '៥': '5', '%': 'Shift + 5',
  '៦': '6', '៍': 'Shift + 6',
  '៧': '7', '័': 'Shift + 7',
  '៨': '8', '៏': 'Shift + 8',
  '៩': '9', 'ឰ': 'Shift + 9',
  '០': '0', 'ឳ': 'Shift + 0',
  'ឥ': '-', '៌': 'Shift + -',
  'ឲ': '=', '៎': 'Shift + =',
  'ឆ': 'q', 'ឈ': 'Shift + q',
  'ឹ': 'w', 'ឺ': 'Shift + w',
  'េ': 'e', 'ែ': 'Shift + e',
  'រ': 'r', 'ឬ': 'Shift + r',
  'ត': 't', 'ទ': 'Shift + t',
  'យ': 'y', 'ួ': 'Shift + y',
  'ុ': 'u', 'ូ': 'Shift + u',
  'ិ': 'i', 'ី': 'Shift + i',
  'ោ': 'o', 'ៅ': 'Shift + o',
  'ផ': 'p', 'ភ': 'Shift + p',
  'ៀ': '[', 'ឿ': 'Shift + [',
  'ឪ': ']', 'ឧ': 'Shift + ]',
  'ឭ': '\\', 'ឮ': 'Shift + \\',
  'ា': 'a', 'ឫ': 'Shift + a',
  'ស': 's', 'ៃ': 'Shift + s',
  'ដ': 'd', 'ឌ': 'Shift + d',
  'ថ': 'f', 'ធ': 'Shift + f',
  'ង': 'g', 'អ': 'Shift + g',
  'ហ': 'h', 'ះ': 'Shift + h',
  '្': 'j', 'ញ': 'Shift + j',
  'ក': 'k', 'គ': 'Shift + k',
  'ល': 'l', 'ឡ': 'Shift + l',
  'ើ': ';', '៖': 'Shift + ;',
  '់': "'", '៉': "Shift + '",
  'ឋ': 'z', 'ឍ': 'Shift + z',
  'ខ': 'x', 'ឃ': 'Shift + x',
  'ច': 'c', 'ជ': 'Shift + c',
  'វ': 'v', 'ៈ': 'Shift + v',
  'ប': 'b', 'ព': 'Shift + b',
  'ន': 'n', 'ណ': 'Shift + n',
  'ម': 'm', 'ំ': 'Shift + m',
  'ឦ': ',', 'ឱ': 'Shift + ,',
  '។': '.', '៕': 'Shift + .',
  '៊': '/', 'ឯ': 'Shift + /',
  ' ': 'Shift + Space'
};

export function getEnglishEquivalent(khmerChar: string): string {
  return khmerToQwertyMap[khmerChar] || '';
}

/* Split on whitespace runs, keeping the separators as separate parts. */
export function splitKhmerText(text: string): string[] {
  const parts = text.split(/(\s+)/)
  const words: string[] = []

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].trim()) {
      words.push(parts[i])
    }
  }

  return words
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).length
}

/* Split the mapping into individual keys, e.g. "Shift + q" -> ["shift", "q"]. */
export function getRequiredKeysForChar(khmerChar: string): string[] {
  const mapping = khmerToQwertyMap[khmerChar]
  if (!mapping) return []
  return mapping.split(' + ').map(key => key.toLowerCase())
}
