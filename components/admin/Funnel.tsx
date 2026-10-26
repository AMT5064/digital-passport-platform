import React from 'react'

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0)

// Horizontal bars, each step shown against the first
export default function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(1, steps[0]?.value || 0)
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={s.label}>
          <div className="flex justify-between text-sm mb-1">
            <span>{s.label}</span>
            <span className="text-gray-400">
              {s.value}
              {i > 0 && <span className="text-gray-500"> · {pct(s.value, steps[0].value)}%</span>}
            </span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#00CBB3] to-[#7600FF]" style={{ width: `${(s.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
