import React, { useEffect, useRef, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { api } from '../api'

const money = (n) => `Rs ${Number(n || 0).toLocaleString()}`
const today = () => new Date().toISOString().slice(0, 10)

export default function Reports() {
  const [date, setDate] = useState(today())
  const [r, setR] = useState(null)
  const [err, setErr] = useState('')
  const ref = useRef()

  async function load() {
    try {
      setErr('')
      setR(await api(`/api/reports/daily?report_date=${date}`))
    } catch (e) {
      setErr(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [date])

  async function captureReport() {
    const node = ref.current
    if (!node) return null

    node.classList.add('exporting')
    try {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      return await html2canvas(node, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })
    } finally {
      node.classList.remove('exporting')
    }
  }

  async function pdf() {
    const canvas = await captureReport()
    if (!canvas) return

    const img = canvas.toDataURL('image/png')
    const doc = new jsPDF('p', 'mm', 'a4')
    const w = 190
    const h = (canvas.height * w) / canvas.width
    doc.addImage(img, 'PNG', 10, 10, w, h)
    doc.save(`ApplePoint-report-${date}.pdf`)
  }

  async function png() {
    const canvas = await captureReport()
    if (!canvas) return

    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `ApplePoint-report-${date}.png`
    a.click()
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Daily report</h2>
          <p>Printable sales and repair activity for any day.</p>
        </div>
        <div className="head-actions">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="ghost" onClick={() => window.print()}>
            <Printer size={16} /> Print
          </button>
          <button className="ghost" onClick={png}>
            <Download size={16} /> PNG
          </button>
          <button className="primary" onClick={pdf}>
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      {err && <div className="alert error">{err}</div>}

      {r && (
        <section className="report-sheet" ref={ref}>
          <div className="report-title">
            <img src="/applepoint-logo.png" alt="ApplePoint" />
            <div>
              <h2>ApplePoint Daily Report</h2>
              <p>{date}</p>
            </div>
          </div>

          <div className="report-summary">
            <div><span>Sales total</span><strong>{money(r.summary.sales_total)}</strong></div>
            <div><span>Units sold</span><strong>{r.summary.units_sold}</strong></div>
            <div><span>Repairs received</span><strong>{r.summary.repairs_received}</strong></div>
            <div><span>Repair advances</span><strong>{money(r.summary.repair_advance_total)}</strong></div>
          </div>

          <h3>Sales</h3>
          <table>
            <thead>
              <tr><th>Time</th><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
            </thead>
            <tbody>
              {r.sales.map((x) => (
                <tr key={x.id}>
                  <td>{new Date(x.sold_at).toLocaleTimeString()}</td>
                  <td>{x.item_name}</td>
                  <td>{x.quantity}</td>
                  <td>{money(x.unit_price)}</td>
                  <td>{money(x.total_price)}</td>
                </tr>
              ))}
              {r.sales.length === 0 && <tr><td colSpan="5">No sales recorded.</td></tr>}
            </tbody>
          </table>

          <h3>Repairs received</h3>
          <table>
            <thead>
              <tr><th>Owner</th><th>Device</th><th>Estimate</th><th>Advance</th><th>Status</th></tr>
            </thead>
            <tbody>
              {r.repairs.map((x) => (
                <tr key={x.id}>
                  <td>{x.owner_name}</td>
                  <td>{x.phone_model}</td>
                  <td>{money(x.estimated_charge)}</td>
                  <td>{money(x.advance_received)}</td>
                  <td>{x.status}</td>
                </tr>
              ))}
              {r.repairs.length === 0 && <tr><td colSpan="5">No repairs received.</td></tr>}
            </tbody>
          </table>
        </section>
      )}
    </>
  )
}
