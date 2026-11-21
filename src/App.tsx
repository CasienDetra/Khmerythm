import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cx } from './cx'
import { useSyncState } from './useSyncState'
import VirtualKeyboard from './components/VirtualKeyboard'
import Results from './components/Results'
import TimerPanel, { type TimerToggle } from './components/TimerPanel'
import Tip from './components/Tip'
import { getRandomText } from './data/khmerTexts'
import { getRequiredKeysForChar, khmerKeyboardLayout, splitKhmerText, type KeyDef, type RowDef } from './keyboardLayout'

const MAX_WORDS = 30

interface WpmPoint {
  time: number
  wpm: number
}

const TIMER_TOGGLES: TimerToggle[] = [
  { time: 30, label: '30', cls: 'red' },
  { time: 60, label: '60', cls: 'orange' },
  { time: 0, label: '∞', cls: 'green inf-toggle' },
]

const NON_STARTING_KEYS = [
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Home', 'End', 'PageUp', 'PageDown',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
  'ScrollLock', 'Pause', 'Insert', 'NumLock', 'CapsLock', 'Escape',
  'AudioVolumeUp', 'AudioVolumeDown', 'AudioVolumeMute',
  'Control', 'Alt', 'Meta',
]

const SNACKBAR_DURATION = 5000
const TIP_HIDE_DELAY = 5000

function generateWordSet(): string[] {
  const words: string[] = []
  while (words.length < MAX_WORDS) {
    const newWords = splitKhmerText(getRandomText())
    words.push(...newWords)
  }
  return words.slice(0, MAX_WORDS)
}

function computeChars(typed: string, text: string, shiftDown: boolean) {
  const classes: string[] = []
  let errors = 0
  let nextChar: string | null = null
  for (let i = 0; i < text.length; i++) {
    const expected = text[i]
    const typedCh = typed[i]
    const expectedNeedsShift = getRequiredKeysForChar(expected).includes('shift')
    const matched = typedCh === expected && (expectedNeedsShift ? shiftDown : !shiftDown)
    if (i < typed.length) {
      classes.push(matched ? 'correct' : 'incorrect')
      if (!matched) errors++
    } else if (i === typed.length) {
      classes.push('current')
      if (typed.length < text.length) nextChar = text[i]
    }
  }
  if (typed.length > text.length) errors += typed.length - text.length
  return { classes, errors, nextChar }
}

export default function App() {
  const [currentText, setCurrentText, currentTextRef] = useSyncState('')
  const [typedText, setTypedText, typedTextRef] = useSyncState('')
  const [, setTextWords, textWordsRef] = useSyncState<string[]>([])
  const [testActive, setTestActive, testActiveRef] = useSyncState(false)
  const [, setIsPaused, isPausedRef] = useSyncState(false)
  const [, setTotalPausedTime, totalPausedTimeRef] = useSyncState(0)
  const [wpm, setWpm] = useState(0)
  const [wpmHistory, setWpmHistory, wpmHistoryRef] = useSyncState<WpmPoint[]>([])
  const [physicalShiftKeyDown, setPhysicalShiftKeyDown] = useState(false)
  const [timerVisible, setTimerVisible] = useState(true)
  const [timerValue, setTimerValue] = useState<number | string>(30)
  const [, setTimeRemaining, timeRemainingRef] = useSyncState(30)
  const [infiniteMode, setInfiniteMode, infiniteModeRef] = useSyncState(false)
  const [selectedTestDuration, setSelectedTestDuration, selectedTestDurationRef] = useSyncState(30)
  const [resultsVisible, setResultsVisible, resultsVisibleRef] = useSyncState(false)
  const [keyboardVisible, setKeyboardVisible] = useSyncState(false)
  const [wpmDisplayVisible, setWpmDisplayVisible] = useState(true)
  const [accuracyDisplayVisible, setAccuracyDisplayVisible] = useState(true)
  const [peakWpm, setPeakWpm] = useState(0)
  const [avgWpm, setAvgWpm] = useState(0)
  const [finalAccuracy, setFinalAccuracy] = useState(0)
  const [accuracy, setAccuracy, accuracyRef] = useSyncState(0)
  const [snackbar, setSnackbar] = useState({ message: '', visible: false })
  const [tipsVisible, setTipsVisible] = useState(false)

  const inputAreaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const textToTypeRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef(0)
  const pauseStartTimeRef = useRef(0)
  const snackbarTimeoutRef = useRef<number | undefined>(undefined)
  const tipsTimeoutRef = useRef<number | undefined>(undefined)

  const chars = useMemo(
    () => computeChars(typedText, currentText, physicalShiftKeyDown),
    [typedText, currentText, physicalShiftKeyDown],
  )
  const nextChar = chars.nextChar
  const requiredKeys = nextChar ? getRequiredKeysForChar(nextChar) : []

  const spanClass = useCallback((i: number) => chars.classes[i] ?? '', [chars])

  const isShiftActive = useMemo(() => {
    if (nextChar) {
      if (getRequiredKeysForChar(nextChar).includes('shift')) return true
      const baseUnshifted = khmerKeyboardLayout.some((row: RowDef) =>
        row.some((key: KeyDef) => key && key[0] === nextChar),
      )
      if (baseUnshifted) return false
      return physicalShiftKeyDown
    }
    return physicalShiftKeyDown
  }, [nextChar, physicalShiftKeyDown])

  const showSnackbar = useCallback(
    (message: string) => {
      setSnackbar({ message, visible: true })
      window.clearTimeout(snackbarTimeoutRef.current)
      snackbarTimeoutRef.current = window.setTimeout(() => setSnackbar({ message, visible: false }), SNACKBAR_DURATION)
    },
    [],
  )

  const updateStats = useCallback(() => {
    const history = wpmHistoryRef.current
    const avg = history.length ? Math.round(history.reduce((s, p) => s + p.wpm, 0) / history.length) : 0
    const peak = Math.max(...history.map((p) => p.wpm), 0)
    setAvgWpm(avg)
    setPeakWpm(peak)
    setFinalAccuracy(accuracyRef.current)
  }, [])

  const endTest = useCallback(() => {
    if (!testActiveRef.current) return
    setTestActive(false)
    setTimerVisible(false)
    updateStats()
    setKeyboardVisible(false)
    setResultsVisible(true)
    if (infiniteModeRef.current) {
      setWpmDisplayVisible(false)
      setAccuracyDisplayVisible(false)
    }
  }, [updateStats])

  const calculateWPM = useCallback((secs: number) => {
    if (secs === 0 || typedTextRef.current.length === 0) {
      setWpm(0)
      return 0
    }
    let correctChars = 0
    for (let i = 0; i < typedTextRef.current.length; i++) {
      if (i < currentTextRef.current.length && typedTextRef.current[i] === currentTextRef.current[i]) {
        correctChars++
      } else {
        break
      }
    }
    const grossWPM = (correctChars / 5) / (secs / 60)
    const roundedWPM = Math.round(grossWPM > 0 ? grossWPM : 0)
    setWpm(roundedWPM)
    return roundedWPM
  }, [])

  const pushWpm = useCallback(
    (time: number, wpmVal: number) => {
      setWpmHistory((prev) => [...prev, { time, wpm: wpmVal }])
    },
    [setWpmHistory],
  )

  const startTest = useCallback(() => {
    if (testActiveRef.current) return
    setTestActive(true)
    setIsPaused(false)
    setTotalPausedTime(0)
    startTimeRef.current = Date.now()
    setTimeRemaining(selectedTestDurationRef.current)
    setTimerValue(selectedTestDurationRef.current)
    setTimerVisible(true)
    setResultsVisible(false)
    if (inputAreaRef.current) inputAreaRef.current.value = ''
    setWpmHistory([])
    setWpmDisplayVisible(true)
    setAccuracyDisplayVisible(true)
    inputAreaRef.current?.focus()
  }, [])

  const initializeText = useCallback(() => {
    textToTypeRef.current?.replaceChildren()
    const words = generateWordSet()
    setTextWords(words)
    setCurrentText(words.join(' '))
  }, [])

  const updateTextWords = useCallback(() => {
    const charsRemaining = currentTextRef.current.length - typedTextRef.current.length
    /* Append fresh words once fewer than 30 chars remain, so the player is always ahead. */
    if (charsRemaining < 30) {
      const newWords = generateWordSet()
      const newText = [...textWordsRef.current, ...newWords].join(' ')
      setTextWords([...textWordsRef.current, ...newWords])
      setCurrentText(newText)
    }
  }, [])

  const handleInput = useCallback(
    (value: string) => {
      if (!testActiveRef.current && resultsVisibleRef.current) {
        if (inputAreaRef.current) inputAreaRef.current.value = ''
        return
      }
      hideTips()
      setTypedText(value)
      updateTextWords()
      const current = currentTextRef.current
      if (value.length === current.length && current.length > 0) {
        const allCorrect = current.split('').every((ch, i) => value[i] === ch)
        if (allCorrect && testActiveRef.current) {
          endTest()
        }
      }
    },
    [updateTextWords, endTest],
  )

  const resetTest = useCallback(() => {
    setTestActive(false)
    const dur = selectedTestDurationRef.current
    setTimeRemaining(dur)
    setTimerValue(infiniteModeRef.current ? '∞' : dur)
    setTimerVisible(true)
    setResultsVisible(false)
    setTypedText('')
    if (inputAreaRef.current) inputAreaRef.current.value = ''
    setWpmHistory([])
    setWpm(0)
    setAccuracy(0)
    setPeakWpm(0)
    setAvgWpm(0)
    setFinalAccuracy(0)
    initializeText()
    if (!infiniteModeRef.current) {
      setWpmDisplayVisible(true)
      setAccuracyDisplayVisible(true)
    }
    inputAreaRef.current?.focus()
  }, [initializeText])

  const togglePause = useCallback(() => {
    if (!testActiveRef.current) return
    const nextPaused = !isPausedRef.current
    setIsPaused(nextPaused)
    if (nextPaused) {
      pauseStartTimeRef.current = Date.now()
      if (infiniteModeRef.current && wpmHistoryRef.current.length > 0) {
        updateStats()
        setResultsVisible(true)
      }
    } else {
      totalPausedTimeRef.current += Date.now() - pauseStartTimeRef.current
      if (infiniteModeRef.current) {
        setResultsVisible(false)
      }
      inputAreaRef.current?.focus()
    }
  }, [updateStats])

  const showTips = useCallback(() => {
    setTipsVisible(true)
    window.clearTimeout(tipsTimeoutRef.current)
    tipsTimeoutRef.current = window.setTimeout(() => setTipsVisible(false), TIP_HIDE_DELAY)
  }, [])

  const hideTips = useCallback(() => {
    window.clearTimeout(tipsTimeoutRef.current)
    setTipsVisible(false)
  }, [])

  const hideKeyboard = useCallback(() => setKeyboardVisible(false), [])

  const showKeyboard = useCallback(() => {
    setKeyboardVisible(true)
    window.setTimeout(() => inputAreaRef.current?.focus(), 50)
  }, [])

  const toggleKeyboard = useCallback(() => {
    if (keyboardVisible) {
      hideKeyboard()
    } else {
      showKeyboard()
    }
  }, [keyboardVisible, hideKeyboard, showKeyboard])

  const focusInput = useCallback(() => inputAreaRef.current?.focus(), [])

  useEffect(() => {
    if (!testActive || infiniteMode) return
    const id = setInterval(() => {
      if (isPausedRef.current) return
      const remaining = timeRemainingRef.current
      if (remaining <= 0) {
        endTest()
        showSnackbar('អស់ពេលហើយ!')
        return
      }
      const next = remaining - 1
      setTimeRemaining(next)
      setTimerValue(next)
      if (next > 0) {
        const elapsed = selectedTestDurationRef.current - next
        const currentWPM = calculateWPM(elapsed)
        if (currentWPM > 0) pushWpm(elapsed, currentWPM)
      } else {
        setTimeRemaining(0)
        setTimerValue(0)
        endTest()
        showSnackbar('អស់ពេលហើយ!')
      }
    }, 1000)
    return () => clearInterval(id)
  }, [testActive, infiniteMode, endTest, showSnackbar, calculateWPM, pushWpm])

  useEffect(() => {
    if (!testActive || !infiniteMode) return
    const id = setInterval(() => {
      if (isPausedRef.current) return
      const elapsed = Math.floor((Date.now() - startTimeRef.current - totalPausedTimeRef.current) / 1000)
      const currentWPM = calculateWPM(elapsed)
      if (currentWPM > 0) {
        pushWpm(elapsed, currentWPM)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [testActive, infiniteMode, calculateWPM, pushWpm])

  useEffect(() => {
    const { errors: errCount } = computeChars(typedText, currentText, physicalShiftKeyDown)
    const acc =
      typedText.length === 0
        ? 0
        : Math.max(0, Math.round(((typedText.length - errCount) / typedText.length) * 100))
    setAccuracy(acc)
  }, [typedText, currentText, physicalShiftKeyDown])

  useEffect(() => {
    const container = containerRef.current
    const current = textToTypeRef.current?.querySelector('.current')
    if (container && current) {
      const containerTop = container.getBoundingClientRect().top
      const currentTop = current.getBoundingClientRect().top
      container.scrollTo({ top: currentTop - containerTop + container.scrollTop - 16, behavior: 'smooth' })
    }
  }, [typedText, currentText])

  useEffect(() => {
    resetTest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onMouseMove = () => {
      if (!keyboardVisible && !testActive && !resultsVisible) {
        showTips()
      }
    }
    document.addEventListener('mousemove', onMouseMove)
    return () => document.removeEventListener('mousemove', onMouseMove)
  }, [keyboardVisible, testActive, resultsVisible, showTips])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && !e.altKey && !e.ctrlKey) {
        const keyLower = e.key.toLowerCase()
        if (['k', ',', '.', 'i'].includes(keyLower)) {
          e.preventDefault()
          switch (keyLower) {
            case 'k':
              toggleKeyboard()
              break
            case ',':
              togglePause()
              break
            case '.':
              resetTest()
              break
            case 'i':
              showTips()
              break
          }
          return
        }
      }

      if (e.key === 'Shift' && !e.repeat) {
        setPhysicalShiftKeyDown(true)
        return
      }

      if (!testActiveRef.current && resultsVisibleRef.current) {
        return
      }

      if (!testActiveRef.current && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!NON_STARTING_KEYS.includes(e.key)) {
          startTest()
        }
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setPhysicalShiftKeyDown(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [toggleKeyboard, togglePause, resetTest, showTips, startTest])

  const onTimerToggle = useCallback(
    (time: number) => {
      setSelectedTestDuration(time)
      setInfiniteMode(time === 0)
      setTimeRemaining(time)
      setTimerValue(time === 0 ? '∞' : time)
      if (testActiveRef.current) {
        if (isPausedRef.current) {
          setIsPaused(false)
        }
        resetTest()
      }
      inputAreaRef.current?.focus()
    },
    [resetTest],
  )

  const textNodes = currentText.split('')

  return (
    <div className="container">
      <header className="app-header">
        <div className="logo" />
      </header>

      <div className="display-row">
        <div className="keystroke-info">
          <div id="next-keystroke" className={cx('next-keystroke', nextChar && 'visible')}>
            {nextChar || ''}
          </div>
          <div id="english-equivalent" className={cx('english-equivalent-display', nextChar && 'visible')}>
            {nextChar ? requiredKeys.join(' + ') : ''}
          </div>
        </div>
        <TimerPanel
          visible={timerVisible}
          toggles={TIMER_TOGGLES}
          selected={infiniteMode ? 0 : selectedTestDuration}
          timerValue={timerValue}
          onToggle={onTimerToggle}
        />
      </div>

      <div className={cx('wpm-display', !wpmDisplayVisible && 'hidden')}>
        <span id="wpm" className="wpm-value">
          {wpm}
        </span>
        <span className="wpm-label-khmer">ពាក្យ/នាទី</span>
      </div>
      <div className={cx('accuracy-display', !accuracyDisplayVisible && 'hidden')}>
        <span id="accuracy" className="accuracy-value">
          {accuracy}
        </span>
        <span className="accuracy-label-khmer">ព្យញ្ជនៈ &amp; ស្រះ</span>
      </div>

      <div id="text-to-type-container" tabIndex={0} ref={containerRef} onClick={focusInput} onFocus={focusInput}>
        <div id="text-to-type" ref={textToTypeRef}>
          {textNodes.map((ch, i) => (
            <span key={i} className={spanClass(i)}>
              {ch}
            </span>
          ))}
        </div>
      </div>

      <textarea
        id="input-area"
        lang="km"
        rows={1}
        autoFocus
        spellCheck={false}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        ref={inputAreaRef}
        onChange={(e) => handleInput(e.target.value)}
      />

      <div className={cx('virtual-keyboard-container', !keyboardVisible && 'hidden')}>
        <VirtualKeyboard isShiftActive={isShiftActive} requiredKeys={new Set(requiredKeys)} />
      </div>

      <div className="controls">
        <button
          id="toggle-keyboard-button"
          title="បង្ហាញ/លាក់ក្តារចុចនិម្មិត"
          onClick={toggleKeyboard}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M20 5H4C2.89543 5 2 5.89543 2 7V17C2 18.1046 2.89543 19 4 19H20C21.1046 19 22 18.1046 22 17V7C22 5.89543 21.1046 5 20 5ZM4 7H20V10H4V7ZM4 12H7V14H4V12ZM9 12H12V14H9V12ZM14 12H17V14H14V12ZM4 15H7V17H4V15ZM9 15H12V17H9V15ZM14 15H17V17H14V15ZM18 12H20V17H18V12Z" />
          </svg>
        </button>
        <button id="reset-button" title="ចាប់ផ្តើមឡើងវិញ" onClick={resetTest}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M18.5374 19.5674C16.7844 21.0831 14.4993 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 14.1355 21.3302 16.1158 20.1892 17.7408L17.7583 15.31C18.0499 14.3687 18.2222 13.3639 18.2222 12.2727C18.2222 8.82037 15.4019 6 12 6C8.59812 6 5.77778 8.82037 5.77778 12.2727C5.77778 15.7251 8.59812 18.5455 12 18.5455C13.8351 18.5455 15.4915 17.8064 16.7096 16.5883L18.5374 19.5674ZM20 5H22V2H19V4L16.8919 2.89191C17.5998 2.32666 18.3971 1.88251 19.2598 1.57409L19.8329 0.167075C18.7773 0.533381 17.7908 1.05803 16.8919 1.71603L14.9985 0.768066L14.2319 2.43203L16.1254 3.37999C15.3887 4.04033 14.7606 4.80186 14.2681 5.63806L12.5 5V7H14.5L17.5 7H20V5Z" />
          </svg>
        </button>
      </div>

      <Results
        visible={resultsVisible}
        avgWpm={avgWpm}
        peakWpm={peakWpm}
        finalAccuracy={finalAccuracy}
        wpmHistory={wpmHistory}
        selectedTestDuration={selectedTestDuration}
      />

      <Tip visible={tipsVisible} />

      <div id="snackbar" className={cx('snackbar', snackbar.visible && 'show')}>
        {snackbar.message}
      </div>
    </div>
  )
}
