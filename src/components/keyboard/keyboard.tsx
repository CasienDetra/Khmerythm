import { useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import { cx } from '../../cx'
import { KeyboardProvider, useKeyboardContext } from './context'
import { KHMER_LAYOUT } from './layout'
import { KEYBOARD_THEMES, resolveKeyVariant, toRgba } from './themes'
import { KEYCODE, type KeyboardProps } from './types'

export default function Keyboard({
  theme = 'classic',
  enableSound = true,
  requiredCodes = new Set<string>(),
  volume = 0.5,
  onKeyEvent,
}: KeyboardProps) {
  return (
    <KeyboardProvider theme={theme} enableSound={enableSound} requiredCodes={requiredCodes} volume={volume} onKeyEvent={onKeyEvent}>
      <div className="keythm-keyboard">
        <div className="keythm-keyboard-shell">
          <div className="keythm-keyboard-body">
            <div className="keythm-keyboard-rows">
              <Row>
                <Key code={KEYCODE.Escape}>esc</Key>
                <Key code={KEYCODE.F1}>F1</Key>
                <Key code={KEYCODE.F2}>F2</Key>
                <Key code={KEYCODE.F3}>F3</Key>
                <Key code={KEYCODE.F4}>F4</Key>
                <Key code={KEYCODE.F5}>F5</Key>
                <Key code={KEYCODE.F6}>F6</Key>
                <Key code={KEYCODE.F7}>F7</Key>
                <Key code={KEYCODE.F8}>F8</Key>
                <Key code={KEYCODE.F9}>F9</Key>
                <Key code={KEYCODE.F10}>F10</Key>
                <Key code={KEYCODE.F11}>F11</Key>
                <Key code={KEYCODE.F12}>F12</Key>
                <Key code={KEYCODE.F13}>F13</Key>
                <Key code={KEYCODE.Delete}>del</Key>
                <Key code={KEYCODE.F14}>F14</Key>
              </Row>
              <Row>
                <DualKey code={KEYCODE.Backquote} />
                <DualKey code={KEYCODE.Digit1} />
                <DualKey code={KEYCODE.Digit2} />
                <DualKey code={KEYCODE.Digit3} />
                <DualKey code={KEYCODE.Digit4} />
                <DualKey code={KEYCODE.Digit5} />
                <DualKey code={KEYCODE.Digit6} />
                <DualKey code={KEYCODE.Digit7} />
                <DualKey code={KEYCODE.Digit8} />
                <DualKey code={KEYCODE.Digit9} />
                <DualKey code={KEYCODE.Digit0} />
                <DualKey code={KEYCODE.Minus} />
                <DualKey code={KEYCODE.Equal} />
                <Key code={KEYCODE.Backspace} width={100}>⌫</Key>
                <Key code={KEYCODE.PageUp}>pgup</Key>
              </Row>
              <Row>
                <Key code={KEYCODE.Tab} width={75}>tab</Key>
                <DualKey code={KEYCODE.KeyQ} />
                <DualKey code={KEYCODE.KeyW} />
                <DualKey code={KEYCODE.KeyE} />
                <DualKey code={KEYCODE.KeyR} />
                <DualKey code={KEYCODE.KeyT} />
                <DualKey code={KEYCODE.KeyY} />
                <DualKey code={KEYCODE.KeyU} />
                <DualKey code={KEYCODE.KeyI} />
                <DualKey code={KEYCODE.KeyO} />
                <DualKey code={KEYCODE.KeyP} />
                <DualKey code={KEYCODE.BracketLeft} />
                <DualKey code={KEYCODE.BracketRight} />
                <DualKey code={KEYCODE.Backslash} width={75} />
                <Key code={KEYCODE.PageDown}>pgdn</Key>
              </Row>
              <Row>
                <Key code={KEYCODE.CapsLock} width={100}>caps lock</Key>
                <DualKey code={KEYCODE.KeyA} />
                <DualKey code={KEYCODE.KeyS} />
                <DualKey code={KEYCODE.KeyD} />
                <DualKey code={KEYCODE.KeyF} />
                <DualKey code={KEYCODE.KeyG} />
                <DualKey code={KEYCODE.KeyH} />
                <DualKey code={KEYCODE.KeyJ} />
                <DualKey code={KEYCODE.KeyK} />
                <DualKey code={KEYCODE.KeyL} />
                <DualKey code={KEYCODE.Semicolon} />
                <DualKey code={KEYCODE.Quote} />
                <Key code={KEYCODE.Enter} width={100}>return</Key>
                <Key code={KEYCODE.Home}>home</Key>
              </Row>
              <Row>
                <Key code={KEYCODE.ShiftLeft} width={123}>shift</Key>
                <DualKey code={KEYCODE.KeyZ} />
                <DualKey code={KEYCODE.KeyX} />
                <DualKey code={KEYCODE.KeyC} />
                <DualKey code={KEYCODE.KeyV} />
                <DualKey code={KEYCODE.KeyB} />
                <DualKey code={KEYCODE.KeyN} />
                <DualKey code={KEYCODE.KeyM} />
                <DualKey code={KEYCODE.Comma} />
                <DualKey code={KEYCODE.Period} />
                <DualKey code={KEYCODE.Slash} />
                <Key code={KEYCODE.ShiftRight} width={77}>shift</Key>
                <Key code={KEYCODE.ArrowUp}>↑</Key>
                <Key code={KEYCODE.End}>end</Key>
              </Row>
              <Row>
                <Key code={KEYCODE.ControlLeft} width={62}>ctrl</Key>
                <Key code={KEYCODE.AltLeft} width={62}>option</Key>
                <Key code={KEYCODE.MetaLeft} width={62}>⌘</Key>
                <Key code={KEYCODE.Space} width={314} />
                <Key code={KEYCODE.MetaRight}>⌘</Key>
                <Key code={KEYCODE.Fn}>fn</Key>
                <Key code={KEYCODE.ControlRight}>ctrl</Key>
                <Key code={KEYCODE.ArrowLeft}>←</Key>
                <Key code={KEYCODE.ArrowDown}>↓</Key>
                <Key code={KEYCODE.ArrowRight}>→</Key>
              </Row>
            </div>
          </div>
        </div>
      </div>
    </KeyboardProvider>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <div className="keythm-keyboard-row">{children}</div>
}

/* Shift character on top, normal character below; top label lights up with Shift held. */
function DualKey({ code, width }: { code: KEYCODE; width?: number }) {
  const { isShiftDown } = useKeyboardContext()
  const labels = KHMER_LAYOUT[code]
  if (!labels) return <Key code={code} width={width} />
  const [normal, shift] = labels
  return (
    <Key code={code} width={width}>
      {shift && <span className={cx('keythm-key-shift', isShiftDown && 'is-active')}>{shift}</span>}
      <span className="keythm-key-normal">{normal}</span>
    </Key>
  )
}

function Key({ code, width = 50, children }: { code?: KEYCODE; width?: number; children?: ReactNode }) {
  const { themeName, pressedKeys, requiredCodes, pressKey, releaseKey } = useKeyboardContext()
  const pointerSessionRef = useRef(false)
  const [pointerDown, setPointerDown] = useState(false)
  const variant = KEYBOARD_THEMES[themeName].variants[resolveKeyVariant(themeName, code)]
  const visuallyPressed = (code && pressedKeys.has(code)) || pointerDown

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!code || event.button !== 0) return
    event.preventDefault()
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* Older browsers do not support pointer capture; releasing still works. */
    }
    if (pressKey(code, 'pointer')) {
      pointerSessionRef.current = true
      setPointerDown(true)
    }
  }

  const onPointerRelease = () => {
    setPointerDown(false)
    if (!code || !pointerSessionRef.current) return
    pointerSessionRef.current = false
    releaseKey(code, 'pointer')
  }

  return (
    <button
      type="button"
      aria-label={code}
      className="keythm-key"
      style={{ width, height: 50 }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerRelease}
      onPointerCancel={onPointerRelease}
    >
      <div
        className={cx('keythm-key-base', visuallyPressed && 'is-pressed')}
        style={{ width, backgroundColor: toRgba(variant.bg, 0.8) }}
      >
        <div
          className={cx('keythm-key-cap', code && requiredCodes.has(code) && 'is-required')}
          style={{ width: width - 13, backgroundColor: variant.bg, color: variant.text }}
        >
          {children}
        </div>
        <div className="keythm-key-wing keythm-key-wing-right" />
        <div className="keythm-key-wing keythm-key-wing-left" />
      </div>
    </button>
  )
}
