import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { cx } from './cx'
import { useSyncState } from './useSyncState'
import Keyboard from './components/keyboard'
import { toKeyCodes } from './components/keyboard/layout'
import Results from './components/Results'
import TimerPanel, { type TimerToggle } from './components/TimerPanel'
import SettingsSidebar from './components/SettingsSidebar'
import { loadSettings, saveSettings, type Settings } from './settings'
import { getRandomText } from './data/khmerTexts'
import { getRequiredKeysForChar, splitKhmerText } from './keyboardLayout'
import { clusterKhmerText } from './khmerClusters'

const MAX_WORDS = 30

interface WpmPoint {
  time: number
  wpm: number
}

const TIMER_TOGGLES: TimerToggle[] = [
  { time: 15, label: '15', cls: 'red' },
  { time: 30, label: '30', cls: 'red' },
  { time: 60, label: '60', cls: 'orange' },
  { time: 120, label: '120', cls: 'orange' },
  { time: 0, label: '∞', cls: 'green inf-toggle' },
]

const NON_STARTING_KEYS = [
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Home', 'End', 'PageUp', 'PageDown',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
  'ScrollLock', 'Pause', 'Insert', 'NumLock', 'CapsLock', 'Escape',
  'AudioVolumeUp', 'AudioVolumeDown', 'AudioVolumeMute',
  'Control', 'Alt', 'Meta', 'Shift',
]

const SNACKBAR_DURATION = 5000

function generateWordSet(): string[] {
  const words: string[] = []
  while (words.length < MAX_WORDS) {
    const newWords = splitKhmerText(getRandomText())
    words.push(...newWords)
  }
  return words.slice(0, MAX_WORDS)
}

function computeChars(typed: string, clusters: string[]) {
  const typedChars = Array.from(typed)
  const classes: string[] = []
  const progress: number[] = []
  let errors = 0
  let nextChar: string | null = null
  let pos = 0
  for (const cluster of clusters) {
    const expectedChars = Array.from(cluster)
    let mismatch = false
    for (const expected of expectedChars) {
      const typedCh = typedChars[pos]
      const matched = typedCh === expected
      if (pos < typedChars.length && !matched) {
        errors++
        mismatch = true
      }
      pos++
    }
    const clusterStart = pos - expectedChars.length
    const typedInCluster = Math.max(0, Math.min(typedChars.length - clusterStart, expectedChars.length))
    progress.push(typedInCluster)
    if (typedInCluster === expectedChars.length && typedInCluster > 0) {
      classes.push(mismatch ? 'incorrect' : 'correct')
    } else if (typedInCluster > 0) {
      classes.push(mismatch ? 'incorrect partial' : 'partial')
      if (nextChar === null) nextChar = expectedChars[typedInCluster]
    } else if (typedChars.length === clusterStart) {
      classes.push('current')
      if (nextChar === null) nextChar = expectedChars[0]
    }
  }
  if (typedChars.length > pos) errors += typedChars.length - pos
  return { classes, progress, errors, nextChar }
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
  const [timerVisible, setTimerVisible] = useState(true)
  const [timerValue, setTimerValue] = useState<number | string>(30)
  const [, setTimeRemaining, timeRemainingRef] = useSyncState(30)
  const [infiniteMode, setInfiniteMode, infiniteModeRef] = useSyncState(false)
  const [selectedTestDuration, setSelectedTestDuration, selectedTestDurationRef] = useSyncState(30)
  const [resultsVisible, setResultsVisible, resultsVisibleRef] = useSyncState(false)
  const [keyboardVisible, setKeyboardVisible] = useSyncState(false)
  const [peakWpm, setPeakWpm] = useState(0)
  const [avgWpm, setAvgWpm] = useState(0)
  const [finalAccuracy, setFinalAccuracy] = useState(0)
  const [accuracy, setAccuracy, accuracyRef] = useSyncState(0)
  const [snackbar, setSnackbar] = useState({ message: '', visible: false })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [appSettings, setAppSettings] = useState<Settings>(loadSettings)

  const inputAreaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const textToTypeRef = useRef<HTMLDivElement>(null)
  const caretRef = useRef<HTMLSpanElement>(null)
  const startTimeRef = useRef(0)
  const pauseStartTimeRef = useRef(0)
  const tabPressedRef = useRef(false)
  const snackbarTimeoutRef = useRef<number | undefined>(undefined)
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null)
  const clusterTextRefs = useRef(new Map<number, HTMLSpanElement>())
  const clusterOverlayRefs = useRef(new Map<number, HTMLSpanElement>())

  const clusters = useMemo(() => clusterKhmerText(currentText), [currentText])
  const chars = useMemo(
    () => computeChars(typedText, clusters),
    [typedText, clusters],
  )
  const nextChar = chars.nextChar
  const requiredKeys = nextChar ? getRequiredKeysForChar(nextChar) : []

  const spanClass = useCallback((i: number) => chars.classes[i] ?? '', [chars])

  const requiredCodes = useMemo(() => toKeyCodes(requiredKeys), [requiredKeys])

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
    inputAreaRef.current?.focus()
  }, [])

  const initializeText = useCallback(() => {
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

  const playWrongSound = useCallback(() => {
    const audio = wrongAudioRef.current
    if (!audio) return
    audio.currentTime = 0
    void audio.play().catch(() => {})
  }, [])

  const handleInput = useCallback(
    (value: string) => {
      if (!testActiveRef.current && resultsVisibleRef.current) {
        if (inputAreaRef.current) inputAreaRef.current.value = ''
        return
      }
      const previousTyped = typedTextRef.current
      /* Khmer IMEs emit invisible boundaries for a space; compare as one boundary. */
      const typed = value.replace(/[\u00A0\u200B\u202F]/g, ' ')
      if (typed !== value && inputAreaRef.current) inputAreaRef.current.value = typed
      setTypedText(typed)
      updateTextWords()
      const current = currentTextRef.current
      const last = typed.length - 1
      if (appSettings.wrongSound && typed.length > previousTyped.length && typed[last] !== current[last]) {
        playWrongSound()
      }
      if (typed.length === current.length && current.length > 0) {
        const allCorrect = current.split('').every((ch, i) => typed[i] === ch)
        if (allCorrect && testActiveRef.current) {
          endTest()
        }
      }
    },
    [updateTextWords, endTest, appSettings.wrongSound, playWrongSound],
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
    const { errors: errCount } = computeChars(typedText, clusters)
    const acc =
      typedText.length === 0
        ? 0
        : Math.max(0, Math.round(((typedText.length - errCount) / typedText.length) * 100))
    setAccuracy(acc)
  }, [typedText, clusters])

  useLayoutEffect(() => {
    clusters.forEach((_, i) => {
      const overlay = clusterOverlayRefs.current.get(i)
      if (!overlay) return
      overlay.parentElement?.style.setProperty('--split', `${overlay.getBoundingClientRect().width}px`)
    })
  }, [clusters, chars.progress])

  useEffect(() => {
    const container = containerRef.current
    const current = textToTypeRef.current?.querySelector('.current')
    if (!container || !(current instanceof HTMLElement)) return
    const containerTop = container.getBoundingClientRect().top
    const currentTop = current.getBoundingClientRect().top
    container.scrollTo({ top: currentTop - containerTop + container.scrollTop - 16, behavior: 'smooth' })

    const caret = caretRef.current
    if (caret) {
      const split = parseFloat(current.style.getPropertyValue('--split')) || 0
      caret.style.height = `${current.offsetHeight}px`
      caret.style.transform = `translate(${current.offsetLeft + split}px, ${current.offsetTop}px)`
    }
  }, [typedText, currentText, chars.progress])

  useEffect(() => {
    saveSettings(appSettings)
  }, [appSettings])

  useEffect(() => {
    wrongAudioRef.current = new Audio(`${import.meta.env.BASE_URL}sounds/fahhhhh.mp3`)
    return () => wrongAudioRef.current?.pause()
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const apply = () => {
      const resolved = appSettings.theme === 'system' ? (media.matches ? 'light' : 'dark') : appSettings.theme
      document.documentElement.dataset.theme = resolved
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [appSettings.theme])

  useEffect(() => {
    resetTest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && !e.altKey && !e.ctrlKey) {
        const keyLower = e.key.toLowerCase()
        if (['k', ',', '.'].includes(keyLower)) {
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
          }
          return
        }
      }

      if (e.key === 'Tab') {
        tabPressedRef.current = true
        return
      }
      if (e.key === 'Enter' && tabPressedRef.current) {
        tabPressedRef.current = false
        resetTest()
        return
      }
      if (e.key !== 'Enter') {
        tabPressedRef.current = false
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

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [toggleKeyboard, togglePause, resetTest, startTest])

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


  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="https://github.com/CasienDetra" target="_blank" rel="noopener noreferrer">
          Khmerythm<span className="brand-by">by Casien</span>
        </a>
        <div className="topbar-right">
          {testActive && (
            <>
              <span className="top-stat">
                {timerValue}<span className="top-stat-label">s</span>
              </span>
              <span className="top-stat">
                {wpm}<span className="top-stat-label">wpm</span>
              </span>
              <span className="top-stat">
                {accuracy}<span className="top-stat-label">acc</span>
              </span>
            </>
          )}
          <button
            className="ghost-button"
            onClick={() => setSettingsOpen((open) => !open)}
            aria-label="Settings"
            aria-expanded={settingsOpen}
          >
            <SettingsIcon size={18} aria-hidden="true" />
            settings
          </button>
          <a
            className="github-button"
            href="https://github.com/CasienDetra/Yet-Another-Typing-Practice"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.4 1.24-3.24-.12-.31-.54-1.53.12-3.19 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.19.77.84 1.24 1.92 1.24 3.24 0 4.63-2.8 5.66-5.48 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
            </svg>
            GitHub
          </a>
        </div>
      </header>

      <main className="typing-area">
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
            visible={timerVisible && !testActive}
            toggles={TIMER_TOGGLES}
            selected={infiniteMode ? 0 : selectedTestDuration}
            onToggle={onTimerToggle}
          />
        </div>

        <div id="text-to-type-container" tabIndex={0} ref={containerRef} onClick={focusInput} onFocus={focusInput}>
          <div id="text-to-type" ref={textToTypeRef} className={cx(appSettings.ghostMode && 'ghost-mode')}>
            <span className="type-caret" ref={caretRef} aria-hidden="true" />
            {clusters.map((cluster, i) => {
              const typed = chars.progress[i]
              const partial = typed > 0 && typed < Array.from(cluster).length
              return (
                <span key={i} className={cx('cluster', spanClass(i))}>
                  <span
                    className="cluster-text"
                    ref={(el) => {
                      if (el) clusterTextRefs.current.set(i, el)
                      else clusterTextRefs.current.delete(i)
                    }}
                  >
                    {cluster}
                  </span>
                  {partial && (
                    <span
                      className="cluster-typed"
                      aria-hidden="true"
                      ref={(el) => {
                        if (el) clusterOverlayRefs.current.set(i, el)
                        else clusterOverlayRefs.current.delete(i)
                      }}
                    >
                      {Array.from(cluster).slice(0, typed).join('')}
                    </span>
                  )}
                </span>
              )
            })}
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

        <div className="controls">
          <button id="reset-button" title="ចាប់ផ្តើមឡើងវិញ" onClick={resetTest} aria-label="Restart test">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M18.5374 19.5674C16.7844 21.0831 14.4993 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 14.1355 21.3302 16.1158 20.1892 17.7408L17.7583 15.31C18.0499 14.3687 18.2222 13.3639 18.2222 12.2727C18.2222 8.82037 15.4019 6 12 6C8.59812 6 5.77778 8.82037 5.77778 12.2727C5.77778 15.7251 8.59812 18.5455 12 18.5455C13.8351 18.5455 15.4915 17.8064 16.7096 16.5883L18.5374 19.5674ZM20 5H22V2H19V4L16.8919 2.89191C17.5998 2.32666 18.3971 1.88251 19.2598 1.57409L19.8329 0.167075C18.7773 0.533381 17.7908 1.05803 16.8919 1.71603L14.9985 0.768066L14.2319 2.43203L16.1254 3.37999C15.3887 4.04033 14.7606 4.80186 14.2681 5.63806L12.5 5V7H14.5L17.5 7H20V5Z" />
            </svg>
          </button>
          <span className="restart-hint">
            <kbd>tab</kbd> + <kbd>enter</kbd> <span>restart</span>
          </span>
        </div>
      </main>

      <div className={cx('keyboard-slot', !keyboardVisible && 'is-hidden')}>
        <Keyboard
          requiredCodes={requiredCodes}
          theme={appSettings.keyboardTheme}
          enableSound={appSettings.sound}
          volume={appSettings.volume}
        />
      </div>

      <Results
        visible={resultsVisible}
        avgWpm={avgWpm}
        peakWpm={peakWpm}
        rawWpm={wpm}
        finalAccuracy={finalAccuracy}
        correctChars={Math.max(0, typedText.length - chars.errors)}
        incorrectChars={chars.errors}
        wpmHistory={wpmHistory}
        selectedTestDuration={selectedTestDuration}
        onRestart={resetTest}
      />


      <SettingsSidebar
        open={settingsOpen}
        settings={appSettings}
        onChange={setAppSettings}
        keyboardVisible={keyboardVisible}
        onToggleKeyboard={toggleKeyboard}
        onClose={() => setSettingsOpen(false)}
      />

      <div id="snackbar" className={cx('snackbar', snackbar.visible && 'show')}>
        {snackbar.message}
      </div>
    </div>
  )
}
