import React, { useEffect, useMemo, useState } from 'react'
import { Search, ShoppingBag, ReceiptText, TrendingUp, Boxes } from 'lucide-react'
import { api } from '../api'

const money = n => `Rs ${Number(n || 0).toLocaleString()}`

export default function Sales() {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')

  async function load() {
    try { setRows(await api('/api/sales')) }
    catch (e) { setErr(e.message) }
  }

  useEffect(() => { load() }, [])

  const shown = useMemo(() => rows.filter(x => x.item_name.toLowerCase().includes(q.toLowerCase())), [rows, q])
  const today = new Date().toDateString()
  const todayRows = rows.filter(x => new Date(x.sold_at).toDateString() === today)
  const todayTotal = todayRows.reduce((s, x) => s + Number(x.total_price || 0), 0)
  const allTotal = rows.reduce((s, x) => s + Number(x.total_price || 0), 0)
  const units = rows.reduce((s, x) => s + Number(x.quantity || 0), 0)

  return <>
    <div className="page-head">
      <div><h2>Sales</h2><p>Every accessory sale recorded from the Sell button appears here.</p></div>
      <button className="ghost" onClick={load}>Refresh</button>
    </div>
    {err && <div className="alert error">{err}</div>}

    <div className="ap-page-stats">
      <div><span className="ap-page-stat-icon green"><ReceiptText size={19}/></span><span><small>Today sales</small><strong>{money(todayTotal)}</strong></span></div>
      <div><span className="ap-page-stat-icon purple"><TrendingUp size={19}/></span><span><small>Recorded revenue</small><strong>{money(allTotal)}</strong></span></div>
      <div><span className="ap-page-stat-icon blue"><Boxes size={19}/></span><span><small>Units sold</small><strong>{units}</strong></span></div>
      <div><span className="ap-page-stat-icon teal"><ShoppingBag size={19}/></span><span><small>Transactions</small><strong>{rows.length}</strong></span></div>
    </div>

    <div className="toolbar">
      <div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search sold item..."/></div>
      <span className="muted">{shown.length} sale(s)</span>
    </div>

    <div className="table-wrap">
      <table>
        <thead><tr><th>Date & time</th><th>Item</th><th>Quantity</th><th>Unit price</th><th>Total</th></tr></thead>
        <tbody>
          {shown.map(x => <tr key={x.id}>
            <td>{new Date(x.sold_at).toLocaleString()}</td>
            <td><strong>{x.item_name}</strong></td>
            <td>{x.quantity}</td>
            <td>{money(x.unit_price)}</td>
            <td><strong>{money(x.total_price)}</strong></td>
          </tr>)}
          {shown.length === 0 && <tr><td colSpan="5" className="ap-table-empty">No sales recorded yet.</td></tr>}
        </tbody>
      </table>
    </div>
  </>
}
