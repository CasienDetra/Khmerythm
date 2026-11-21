import { cx } from '../cx'

export default function Tip({ visible }: { visible: boolean }) {
  return (
    <div className={cx('tip', !visible && 'hidden')}>
      <p>
        ចុច <kbd>⌘</kbd> + <kbd>K</kbd> ដើម្បីបង្ហាញ/លាក់ក្តារចុច។<br />
        ចុច <kbd>⌘</kbd> + <kbd>,</kbd> ដើម្បីផ្អាក។<br />
        ចុច <kbd>⌘</kbd> + <kbd>.</kbd> ដើម្បីចាប់ផ្តើមឡើងវិញ។<br />
        ចុច <kbd>⌘</kbd> + <kbd>I</kbd> ដើម្បីបង្ហាញព័ត៌មានជំនួយ។
      </p>
    </div>
  )
}
