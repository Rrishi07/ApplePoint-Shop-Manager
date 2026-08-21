import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Boxes,
  PackageX,
  TriangleAlert,
  Wrench,
  ShoppingBag,
  Bell,
  CalendarDays,
  Plus,
  FileText,
  DatabaseBackup,
  ArrowUpRight,
  ChevronRight,
  Trophy,
  BarChart3,
} from 'lucide-react'
import { api } from '../api'
import StatCard from '../components/StatCard'
import '../dashboard-dark.css'

const RsIcon = () => <span className="ap-rs-mark">Rs</span>

const money = (n) => `Rs ${Number(n || 0).toLocaleString()}`

function localISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() - (6 - i))
    return date
  })
}

function shortDay(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function chartPoints(values, width = 700, height = 210) {
  const max = Math.max(...values, 1)
  const padX = 28
  const padTop = 14
  const padBottom = 28
  const usableW = width - padX * 2
  const usableH = height - padTop - padBottom
  return values.map((value, i) => ({
    x: padX + (i / Math.max(values.length - 1, 1)) * usableW,
    y: padTop + usableH - (value / max) * usableH,
    value,
  }))
}

function SalesChart({ days, reports }) {
  const values = reports.map((r) => Number(r?.summary?.sales_total || 0))
  const points = chartPoints(values)
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')
  const area = `M ${points[0]?.x || 28} 182 L ${polyline.replace(/ /g, ' L ')} L ${points.at(-1)?.x || 672} 182 Z`
  const max = Math.max(...values, 1)

  return (
    <div className="ap-sales-chart-wrap">
      <svg className="ap-sales-chart" viewBox="0 0 700 210" preserveAspectRatio="none">
        <defs>
          <linearGradient id="apArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7447ff" stopOpacity="0.46" />
            <stop offset="100%" stopColor="#7447ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="apLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7d52ff" />
            <stop offset="100%" stopColor="#aa75ff" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <line key={r} x1="28" x2="672" y1={182 - 154 * r} y2={182 - 154 * r} className="ap-grid-line" />
        ))}
        <path d={area} fill="url(#apArea)" />
        <polyline points={polyline} fill="none" stroke="url(#apLine)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" className="ap-chart-dot" />
            <circle cx={p.x} cy={p.y} r="10" className="ap-chart-dot-glow" />
          </g>
        ))}
      </svg>
      <div className="ap-chart-labels">
        {days.map((d) => <span key={localISO(d)}>{shortDay(d)}</span>)}
      </div>
      <div className="ap-chart-scale">
        <span>{money(max)}</span>
        <span>{money(max / 2)}</span>
        <span>Rs 0</span>
      </div>
    </div>
  )
}

function repairStatusClass(status = '') {
  const s = status.toUpperCase()
  if (s === 'DELIVERED' || s === 'READY') return 'green'
  if (s === 'CANCELLED') return 'red'
  if (s === 'REPAIRING' || s === 'CHECKING') return 'blue'
  return 'amber'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [d, setD] = useState(null)
  const [repairs, setRepairs] = useState([])
  const [weekReports, setWeekReports] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const days = useMemo(lastSevenDays, [])

  async function load() {
    setLoading(true)
    setErr('')
    try {
      const [dashboard, repairRows, reports] = await Promise.all([
        api('/api/dashboard'),
        api('/api/repairs'),
        Promise.all(days.map((date) => api(`/api/reports/daily?report_date=${localISO(date)}`))),
      ])
      setD(dashboard)
      setRepairs(repairRows)
      setWeekReports(reports)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const weekSales = weekReports.reduce((sum, r) => sum + Number(r?.summary?.sales_total || 0), 0)
  const weekUnits = weekReports.reduce((sum, r) => sum + Number(r?.summary?.units_sold || 0), 0)
  const orderCount = weekReports.reduce((sum, r) => sum + Number(r?.summary?.sales_count || 0), 0)
  const avgOrder = orderCount ? weekSales / orderCount : 0
  const salesSpark = weekReports.map((r) => Number(r?.summary?.sales_total || 0))
  const unitsSpark = weekReports.map((r) => Number(r?.summary?.units_sold || 0))
  const yesterdaySales = Number(weekReports.at(-2)?.summary?.sales_total || 0)
  const todaySales = Number(weekReports.at(-1)?.summary?.sales_total || 0)
  const growth = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : (todaySales > 0 ? 100 : 0)

  const topSelling = useMemo(() => {
    const map = new Map()
    weekReports.forEach((r) => {
      ;(r?.sales || []).forEach((sale) => {
        const key = sale.item_name
        const prev = map.get(key) || { name: key, qty: 0, total: 0 }
        prev.qty += Number(sale.quantity || 0)
        prev.total += Number(sale.total_price || 0)
        map.set(key, prev)
      })
    })
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 4)
  }, [weekReports])

  const now = new Date()
  const todayLabel = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' })
  const warningCount = Number(d?.low_stock || 0) + Number(d?.out_of_stock || 0)
  const statSpark = unitsSpark.length ? unitsSpark : [0, 0, 0, 0, 0, 0, 0]

  if (loading && !d) return <div className="ap-loading">Loading ApplePoint dashboard...</div>

  return (
    <>
      <section className="ap-dashboard-head">
        <div>
          <h1>Welcome back, Admin! <span>👋</span></h1>
          <p>Here’s what’s happening in your shop today.</p>
        </div>
        <div className="ap-head-tools">
          <div className="ap-date-box"><CalendarDays size={19} /><div><strong>{todayLabel}</strong><span>{weekday}</span></div></div>
          <div className="ap-online-box"><i /> <div><strong>Online</strong><span>All systems normal</span></div></div>
          <button className="ap-bell" onClick={() => navigate('/inventory')}><Bell size={19} />{warningCount > 0 && <b>{warningCount}</b>}</button>
        </div>
      </section>

      {err && <div className="alert error">{err}</div>}

      {d && (
        <>
          <section className="ap-stats-grid">
            <StatCard icon={Boxes} label="Products" value={d.total_products} hint="Total products" tone="purple" spark={statSpark} footer={<><ArrowUpRight size={13}/> {d.total_units} units in stock</>} />
            <StatCard icon={RsIcon} label="Today Sales" value={money(d.today_sales)} hint={`${d.today_units} items sold`} tone="green" spark={salesSpark} footer={<><ArrowUpRight size={13}/> {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% vs yesterday</>} />
            <StatCard icon={TriangleAlert} label="Low Stock" value={d.low_stock} hint="Needs attention" tone="amber" spark={[1,2,2,1,3,2,3]} footer={<button onClick={() => navigate('/inventory')}>View all <ChevronRight size={13}/></button>} />
            <StatCard icon={PackageX} label="Out of Stock" value={d.out_of_stock} hint="Restock required" tone="red" spark={[0,1,0,2,1,2,3]} footer={<button onClick={() => navigate('/inventory')}>View all <ChevronRight size={13}/></button>} />
            <StatCard icon={Wrench} label="Open Repairs" value={d.open_repairs} hint="Pending repairs" tone="blue" spark={[1,2,2,1,2,3,2]} footer={<button onClick={() => navigate('/repairs')}>View all <ChevronRight size={13}/></button>} />
            <StatCard icon={ShoppingBag} label="Available Units" value={d.total_units} hint="Total in stock" tone="teal" spark={statSpark} footer={<button onClick={() => navigate('/inventory')}>View inventory <ChevronRight size={13}/></button>} />
          </section>

          <section className="ap-mid-grid">
            <div className="ap-dark-panel ap-sales-panel">
              <div className="ap-panel-title"><div><span className="ap-title-icon purple"><BarChart3 size={17}/></span><h3>Sales Overview</h3></div><span className="ap-period">This Week</span></div>
              <SalesChart days={days} reports={weekReports} />
              <div className="ap-sales-summary">
                <div><span>Total Sales</span><strong>{money(weekSales)}</strong></div>
                <div><span>Total Items</span><strong>{weekUnits}</strong></div>
                <div><span>Average Order</span><strong>{money(avgOrder)}</strong></div>
                <div className="growth"><span>Growth</span><strong>{growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%</strong></div>
              </div>
            </div>

            <div className="ap-dark-panel ap-warning-panel">
              <div className="ap-panel-title"><div><span className="ap-title-icon red"><TriangleAlert size={17}/></span><h3>Stock Warnings</h3></div><button onClick={() => navigate('/inventory')}>View all</button></div>
              <div className="ap-warning-items">
                {d.warnings.length === 0 ? <div className="ap-panel-empty">Everything is stocked well.</div> : d.warnings.slice(0, 5).map((x) => (
                  <div className="ap-warning-item" key={x.id}>
                    <div className="ap-product-thumb"><ShoppingBag size={18}/></div>
                    <div className="ap-warning-copy"><strong>{x.name}</strong><span>{x.brand || 'Accessory'} • Stock item</span></div>
                    <span className={`ap-qty ${x.quantity <= 0 ? 'red' : 'amber'}`}>{x.quantity} left</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ap-dark-panel ap-quick-panel">
              <div className="ap-panel-title"><div><span className="ap-title-icon purple">⚡</span><h3>Quick Actions</h3></div></div>
              <div className="ap-quick-grid">
                <button className="purple" onClick={() => navigate('/accessories')}><Plus size={26}/><strong>Add Accessory</strong><span>New product</span></button>
                <button className="amber" onClick={() => navigate('/repairs')}><Wrench size={25}/><strong>Add Repair</strong><span>New repair</span></button>
                <button className="green" onClick={() => navigate('/accessories')}><ShoppingBag size={25}/><strong>New Sale</strong><span>Sell an item</span></button>
                <button className="blue" onClick={() => navigate('/reports')}><FileText size={25}/><strong>Daily Report</strong><span>Generate report</span></button>
                <button className="backup" onClick={() => navigate('/backup')}><DatabaseBackup size={22}/><div><strong>Backup Data</strong><span>Secure your data</span></div><ChevronRight size={18}/></button>
              </div>
            </div>
          </section>

          <section className="ap-bottom-grid">
            <div className="ap-dark-panel">
              <div className="ap-panel-title"><div><span className="ap-title-icon blue"><Wrench size={17}/></span><h3>Recent Repairs</h3></div><button onClick={() => navigate('/repairs')}>View all</button></div>
              <div className="ap-repairs-table">
                <div className="ap-table-row header"><span>Customer</span><span>Device</span><span>Problem</span><span>Status</span><span>Date</span></div>
                {repairs.length === 0 ? <div className="ap-panel-empty">No repair jobs yet.</div> : repairs.slice(0, 3).map((r) => (
                  <div className="ap-table-row" key={r.id}>
                    <span className="ap-customer"><b>{String(r.owner_name || '?').charAt(0).toUpperCase()}</b><span><strong>{r.owner_name}</strong><small>{r.phone_number}</small></span></span>
                    <span><strong>{r.phone_model}</strong><small>{r.location || '—'}</small></span>
                    <span className="ap-problem">{r.description || '—'}</span>
                    <span><i className={`ap-status ${repairStatusClass(r.status)}`}>{r.status}</i></span>
                    <span>{r.created_at ? new Date(r.created_at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ap-dark-panel">
              <div className="ap-panel-title"><div><span className="ap-title-icon amber"><Trophy size={17}/></span><h3>Top Selling Products</h3></div><span className="ap-period">This Week</span></div>
              <div className="ap-top-products">
                {topSelling.length === 0 ? <div className="ap-panel-empty">Sell some accessories to see top products.</div> : topSelling.map((p, i) => (
                  <div className="ap-top-product" key={p.name}>
                    <span className="ap-rank">{i + 1}</span>
                    <div className="ap-product-thumb"><ShoppingBag size={17}/></div>
                    <div><strong>{p.name}</strong><span>Accessory</span></div>
                    <b>{p.qty}</b>
                    <strong>{money(p.total)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer className="ap-footer">© {now.getFullYear()} ApplePoint. All rights reserved.</footer>
        </>
      )}
    </>
  )
}
