import React, { useEffect, useMemo, useState } from 'react'
import { Boxes, Search, TriangleAlert, PackageX, PackageCheck } from 'lucide-react'
import { api } from '../api'

const money = n => `Rs ${Number(n || 0).toLocaleString()}`

export default function Stock() {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [err, setErr] = useState('')

  async function load() { try { setItems(await api('/api/inventory')) } catch(e) { setErr(e.message) } }
  useEffect(() => { load() }, [])

  const shown = useMemo(() => items.filter(x => {
    const matches = `${x.name} ${x.brand} ${x.category}`.toLowerCase().includes(q.toLowerCase())
    const status = filter === 'ALL' || x.stock_status === filter
    return matches && status
  }), [items, q, filter])

  const totalUnits = items.reduce((s,x)=>s+Number(x.quantity||0),0)
  const low = items.filter(x=>x.stock_status==='LOW').length
  const out = items.filter(x=>x.stock_status==='OUT').length
  const value = items.reduce((s,x)=>s+Number(x.cost_price||0)*Number(x.quantity||0),0)

  return <>
    <div className="page-head"><div><h2>Inventory</h2><p>Stock quantities, warning levels and inventory value.</p></div><button className="ghost" onClick={load}>Refresh</button></div>
    {err && <div className="alert error">{err}</div>}
    <div className="ap-page-stats">
      <div><span className="ap-page-stat-icon purple"><Boxes size={19}/></span><span><small>Total units</small><strong>{totalUnits}</strong></span></div>
      <div><span className="ap-page-stat-icon green"><PackageCheck size={19}/></span><span><small>Stock value</small><strong>{money(value)}</strong></span></div>
      <div><span className="ap-page-stat-icon amber"><TriangleAlert size={19}/></span><span><small>Low stock</small><strong>{low}</strong></span></div>
      <div><span className="ap-page-stat-icon red"><PackageX size={19}/></span><span><small>Out of stock</small><strong>{out}</strong></span></div>
    </div>
    <div className="toolbar ap-stock-toolbar">
      <div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search inventory..."/></div>
      <select value={filter} onChange={e=>setFilter(e.target.value)} className="ap-filter-select"><option value="ALL">All stock</option><option value="OK">In stock</option><option value="LOW">Low stock</option><option value="OUT">Out of stock</option></select>
    </div>
    <div className="table-wrap"><table><thead><tr><th>Item</th><th>Category</th><th>Brand</th><th>Quality</th><th>Quantity</th><th>Warning at</th><th>Cost</th><th>Final price</th><th>Status</th></tr></thead><tbody>
      {shown.map(x=><tr key={x.id}><td><strong>{x.name}</strong></td><td>{x.category}</td><td>{x.brand||'—'}</td><td>{x.quality.replace('_',' ')}</td><td><strong>{x.quantity}</strong></td><td>{x.low_stock_threshold}</td><td>{money(x.cost_price)}</td><td>{money(x.final_selling_price)}</td><td><span className={`stock-chip ap-inline-chip ${x.stock_status.toLowerCase()}`}>{x.stock_status==='OK'?'IN STOCK':x.stock_status==='LOW'?'LOW STOCK':'OUT OF STOCK'}</span></td></tr>)}
      {shown.length===0&&<tr><td colSpan="9" className="ap-table-empty">No inventory items found.</td></tr>}
    </tbody></table></div>
  </>
}
