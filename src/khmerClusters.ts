/* Khmer clusters must stay in one text node so the browser can shape them.
   Pattern ported from Manethpak/type-kor (src/engine/khmer.ts). */
const BASE = '[\\u1780-\\u17A2\\u17A5-\\u17B3]'
const REGISTER_SHIFT = '[\\u17C9\\u17CA]'
const SIGN = '[\\u17C6-\\u17C8\\u17CB\\u17CD-\\u17D1\\u17D3\\u17DD]'

const KCC_PATTERN = new RegExp(
  `${BASE}[\\u17CC\\u17C9\\u17CA]?` +
    `(?:\\u17D2${BASE}${REGISTER_SHIFT}?){0,2}` +
    '(?:[\\u200C\\u200D]?[\\u17B6-\\u17C5])?' +
    `${SIGN}{0,2}` +
    `(?:\\u200D\\u17D2${BASE})?` +
    '|[\\s\\S]',
  'gu',
)

export function clusterKhmerText(input: string): string[] {
  return Array.from(input.matchAll(KCC_PATTERN), (match) => match[0])
}
