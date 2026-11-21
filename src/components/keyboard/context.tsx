import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { SOUND_DEFINES_DOWN, SOUND_DEFINES_UP, getSoundBuffer } from './sound'
import type { KeyboardEventPhase, KeyboardEventSource, KeyboardInteractionEvent, KeyboardThemeName } from './types'

interface KeyboardContextValue {
  themeName: KeyboardThemeName
  pressedKeys: Set<string>
  requiredCodes: Set<string>
  isShiftDown: boolean
  pressKey: (code: string, source: KeyboardEventSource) => boolean
  releaseKey: (code: string, source: KeyboardEventSource) => void
}

const KeyboardContext = createContext<KeyboardContextValue | null>(null)

export function useKeyboardContext(): KeyboardContextValue {
  const context = useContext(KeyboardContext)
  if (!context) throw new Error('Keyboard components must be used inside KeyboardProvider')
  return context
}

interface KeyboardProviderProps {
  children: ReactNode
  theme: KeyboardThemeName
  enableSound: boolean
  requiredCodes: Set<string>
  volume: number
  onKeyEvent?: (event: KeyboardInteractionEvent) => void
}

export function KeyboardProvider({ children, theme, enableSound, requiredCodes, volume, onKeyEvent }: KeyboardProviderProps) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const pressedRef = useRef(new Set<string>())
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!enableSound) return
    let cancelled = false
    const audioContext = new AudioContext()
    audioContextRef.current = audioContext

    getSoundBuffer()
      .then((buffer) => (buffer ? audioContext.decodeAudioData(buffer.slice(0)) : null))
      .then((decoded) => {
        if (!cancelled && decoded) audioBufferRef.current = decoded
      })
      .catch(() => {})

    const resume = () => {
      if (audioContext.state === 'suspended') void audioContext.resume()
    }
    document.addEventListener('keydown', resume, { once: true })
    document.addEventListener('pointerdown', resume, { once: true })

    return () => {
      cancelled = true
      audioBufferRef.current = null
      audioContextRef.current = null
      document.removeEventListener('keydown', resume)
      document.removeEventListener('pointerdown', resume)
      void audioContext.close()
    }
  }, [enableSound])

  const playSound = useCallback(
    (phase: KeyboardEventPhase, code: string) => {
      const audioContext = audioContextRef.current
      const buffer = audioBufferRef.current
      if (!enableSound || !audioContext || !buffer) return
      const [startMs, durationMs] = (phase === 'down' ? SOUND_DEFINES_DOWN : SOUND_DEFINES_UP)[code] ?? []
      if (startMs === undefined || durationMs === undefined) return
      if (audioContext.state === 'suspended') void audioContext.resume()
      const source = audioContext.createBufferSource()
      source.buffer = buffer
      const gain = audioContext.createGain()
      gain.gain.value = volume
      source.connect(gain).connect(audioContext.destination)
      source.start(0, startMs / 1000, durationMs / 1000)
    },
    [enableSound, volume],
  )

  const pressKey = useCallback(
    (code: string, source: KeyboardEventSource) => {
      if (pressedRef.current.has(code)) return false
      const next = new Set(pressedRef.current)
      next.add(code)
      pressedRef.current = next
      setPressedKeys(next)
      playSound('down', code)
      onKeyEvent?.({ code, phase: 'down', source })
      return true
    },
    [playSound, onKeyEvent],
  )

  const releaseKey = useCallback(
    (code: string, source: KeyboardEventSource) => {
      if (!pressedRef.current.has(code)) return
      const next = new Set(pressedRef.current)
      next.delete(code)
      pressedRef.current = next
      setPressedKeys(next)
      playSound('up', code)
      onKeyEvent?.({ code, phase: 'up', source })
    },
    [playSound, onKeyEvent],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.repeat) pressKey(event.code, 'physical')
    }
    const onKeyUp = (event: KeyboardEvent) => releaseKey(event.code, 'physical')
    const releaseAll = () => {
      for (const code of [...pressedRef.current]) releaseKey(code, 'physical')
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', releaseAll)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', releaseAll)
    }
  }, [pressKey, releaseKey])

  return (
    <KeyboardContext.Provider
      value={{
        themeName: theme,
        pressedKeys,
        requiredCodes,
        isShiftDown: pressedKeys.has('ShiftLeft') || pressedKeys.has('ShiftRight'),
        pressKey,
        releaseKey,
      }}
    >
      {children}
    </KeyboardContext.Provider>
  )
}
