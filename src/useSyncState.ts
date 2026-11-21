import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react'

/* State + ref pair: handlers and timers read/write the ref synchronously. */
export function useSyncState<T>(initial: T) {
  const [value, setValue] = useState(initial)
  const ref = useRef(value)
  const set: Dispatch<SetStateAction<T>> = useCallback((nv) => {
    setValue((prev) => {
      const next = typeof nv === 'function' ? (nv as (p: T) => T)(prev) : nv
      ref.current = next
      return next
    })
  }, [])
  return [value, set, ref] as const
}
