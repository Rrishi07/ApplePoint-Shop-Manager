import React from 'react'

function sparkPath(values = []) {
  if (!values.length) return ''
  const w = 170
  const h = 48
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)
  return values
    .map((v, i) => {
      const x = values.length === 1 ? 0 : (i / (values.length - 1)) * w
      const y = h - ((v - min) / range) * (h - 8) - 4
      return `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

export default function StatCard({ icon: Icon, label, value, hint, tone = 'purple', spark = [], footer }) {
  return (
    <div className={`ap-stat ap-stat-${tone}`}>
      <div className="ap-stat-head">
        <div className="ap-stat-icon"><Icon size={20} /></div>
        <div className="ap-stat-title">
          <span>{label}</span>
          <strong>{value}</strong>
          {hint && <small>{hint}</small>}
        </div>
      </div>

      <div className="ap-mini-chart" aria-hidden="true">
        <svg viewBox="0 0 170 50" preserveAspectRatio="none">
          <path className="ap-mini-fill" d={`${sparkPath(spark)} L 170 50 L 0 50 Z`} />
          <path className="ap-mini-line" d={sparkPath(spark)} />
        </svg>
      </div>

      {footer && <div className="ap-stat-footer">{footer}</div>}
    </div>
  )
}
