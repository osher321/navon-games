import type { ReactNode } from 'react'

// Numeric fragments like "3 / 8" get visually reordered to "8 / 3" when
// rendered inside an RTL paragraph (Hebrew/Arabic UI) - this isolates
// them so digits and separators always render in their intended order.
export default function Ltr({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <bdi dir="ltr" className={`inline-block ${className}`}>
      {children}
    </bdi>
  )
}
