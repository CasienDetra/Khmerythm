export function cx(...parts: Array<string | boolean | null | undefined>): string {
  return parts.filter((p): p is string => !!p).join(' ')
}
