import { cx } from '../cx'
import { khmerKeyboardLayout, type KeyDef, type RowDef } from '../keyboardLayout'

interface VirtualKeyboardProps {
  isShiftActive: boolean
  requiredKeys: Set<string>
}

export default function VirtualKeyboard({ isShiftActive, requiredKeys }: VirtualKeyboardProps) {
  return (
    <>
      {khmerKeyboardLayout.map((row: RowDef, ri) => (
        <div key={ri} className="keyboard-row">
          {row.map((keyData: KeyDef, ki) => (
            <KeyButton key={ki} keyData={keyData} isShiftActive={isShiftActive} requiredKeys={requiredKeys} />
          ))}
        </div>
      ))}
    </>
  )
}

function KeyButton({
  keyData,
  isShiftActive,
  requiredKeys,
}: {
  keyData: KeyDef
  isShiftActive: boolean
  requiredKeys: Set<string>
}) {
  const isSpecial = keyData[4].includes('special-key')

  const required = [isSpecial ? keyData[2] : null, isSpecial ? null : keyData[2], isSpecial ? null : keyData[3]]
    .some((v) => !!v && requiredKeys.has(v.toLowerCase()))
  const classes = cx(keyData[4], required && 'required-key', isSpecial && keyData[2] === 'shift' && isShiftActive && 'active')

  if (isSpecial) {
    return <button className={classes}>{keyData[3] || keyData[2]}</button>
  }

  const khmerChar = isShiftActive ? keyData[1] : keyData[0]
  const englishChar = isShiftActive ? keyData[3] : keyData[2]

  return (
    <button className={classes}>
      <span className="khmer-char">{khmerChar}</span>
      <span className="english-char">{englishChar}</span>
    </button>
  )
}
