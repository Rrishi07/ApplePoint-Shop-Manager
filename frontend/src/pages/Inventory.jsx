import React, { useEffect, useMemo, useState } from 'react'
import {
  Edit3,
  ImagePlus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Package,
  Tag,
  Layers3,
  BadgeDollarSign,
  X,
} from 'lucide-react'
import { API_URL, api } from '../api'
import Modal from '../components/Modal'

const categories = [
  'Cover',
  'Tempered Glass',
  'Camera Lens',
  'Mic',
  'Camera',
  'Speaker',
  'Charger Head',
  'Charger Wire',
  'Watch',
  'Other',
]

const empty = {
  category: 'Cover',
  brand: '',
  quality: 'ORIGINAL',
  name: '',
  quantity: 1,
  cost_price: 0,
  selling_price: 0,
  final_selling_price: 0,
  low_stock_threshold: 3,
  note: '',
}

const money = (n) => `Rs ${Number(n || 0).toLocaleString()}`

function stockInfo(item) {
  const status = String(item.stock_status || '').toUpperCase()
  if (item.quantity <= 0 || status === 'OUT') {
    return { cls: 'out', text: 'Out of stock' }
  }
  if (status === 'LOW' || item.quantity <= Number(item.low_stock_threshold || 0)) {
    return { cls: 'low', text: `Low stock • ${item.quantity} left` }
  }
  return { cls: 'ok', text: `${item.quantity} in stock` }
}

export default function Inventory() {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [photo, setPhoto] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const [sellItem, setSellItem] = useState(null)
  const [sellQuantity, setSellQuantity] = useState(1)
  const [sellPrice, setSellPrice] = useState(0)
  const [sellBusy, setSellBusy] = useState(false)

  async function load() {
    try {
      setErr('')
      setItems(await api('/api/inventory'))
    } catch (e) {
      setErr(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return items
    return items.filter((x) =>
      `${x.name} ${x.brand} ${x.category} ${x.quality}`
        .toLowerCase()
        .includes(query)
    )
  }, [items, q])

  function startAdd() {
    setEditing(null)
    setForm(empty)
    setPhoto(null)
    setOpen(true)
  }

  function startEdit(item) {
    setEditing(item)
    setForm({ ...item, note: item.note || '' })
    setPhoto(null)
    setOpen(true)
  }

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')

    try {
      const fd = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (!['id', 'photo_url', 'stock_status', 'created_at', 'updated_at'].includes(key)) {
          fd.append(key, value ?? '')
        }
      })

      if (photo) fd.append('photo', photo)

      await api(
        editing ? `/api/inventory/${editing.id}` : '/api/inventory',
        {
          method: editing ? 'PUT' : 'POST',
          body: fd,
        }
      )

      setOpen(false)
      await load()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  function openSell(item) {
    setSellItem(item)
    setSellQuantity(1)
    setSellPrice(Number(item.final_selling_price || item.selling_price || 0))
  }

  async function confirmSell(e) {
    e.preventDefault()
    if (!sellItem) return

    const quantity = Number(sellQuantity)
    const unitPrice = Number(sellPrice)

    if (!Number.isInteger(quantity) || quantity < 1) {
      return alert('Enter a valid quantity.')
    }
    if (quantity > sellItem.quantity) {
      return alert(`Only ${sellItem.quantity} unit(s) are available.`)
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return alert('Enter a valid selling price.')
    }

    setSellBusy(true)
    try {
      await api(`/api/inventory/${sellItem.id}/sell`, {
        method: 'POST',
        body: JSON.stringify({ quantity, unit_price: unitPrice }),
      })
      setSellItem(null)
      await load()
    } catch (e) {
      alert(e.message)
    } finally {
      setSellBusy(false)
    }
  }

  async function del(item) {
    if (!confirm(`Delete ${item.name}?`)) return
    try {
      await api(`/api/inventory/${item.id}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Accessories</h2>
          <p>Add products, view full details and sell directly from each card.</p>
        </div>
        <button className="primary" onClick={startAdd}>
          <Plus size={17} /> Add accessory
        </button>
      </div>

      {err && <div className="alert error">{err}</div>}

      <div className="ap-accessory-toolbar">
        <div className="search ap-accessory-search">
          <Search size={19} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search item, category or brand..."
          />
        </div>
        <div className="ap-accessory-count">
          <Package size={16} /> {shown.length} item{shown.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="ap-accessory-grid">
        {shown.map((item) => {
          const stock = stockInfo(item)
          return (
            <article className="ap-accessory-card" key={item.id}>
              <div className="ap-accessory-image">
                {item.photo_url ? (
                  <img src={`${API_URL}${item.photo_url}`} alt={item.name} />
                ) : (
                  <div className="ap-accessory-placeholder">
                    <ImagePlus size={36} />
                    <span>No photo</span>
                  </div>
                )}

                <span className={`ap-accessory-stock ${stock.cls}`}>{stock.text}</span>

                <span className="ap-accessory-quality">
                  {String(item.quality || 'ORIGINAL').replace('_', ' ')}
                </span>
              </div>

              <div className="ap-accessory-body">
                <div className="ap-accessory-category">
                  <Tag size={13} /> {item.category}
                </div>

                <h3>{item.name}</h3>
                <p className="ap-accessory-brand">{item.brand || 'Unbranded'}</p>

                <div className="ap-accessory-details">
                  <div>
                    <span>Quantity</span>
                    <strong>{item.quantity}</strong>
                  </div>
                  <div>
                    <span>Cost price</span>
                    <strong>{money(item.cost_price)}</strong>
                  </div>
                  <div>
                    <span>Selling price</span>
                    <strong>{money(item.selling_price)}</strong>
                  </div>
                  <div className="featured">
                    <span>Final price</span>
                    <strong>{money(item.final_selling_price)}</strong>
                  </div>
                </div>

                {item.note && (
                  <div className="ap-accessory-note">
                    <Layers3 size={14} />
                    <span>{item.note}</span>
                  </div>
                )}

                <div className="ap-accessory-actions">
                  <button
                    className="ap-sell-button"
                    disabled={item.quantity <= 0}
                    onClick={() => openSell(item)}
                  >
                    <ShoppingCart size={17} />
                    {item.quantity <= 0 ? 'Out of stock' : 'Sell item'}
                  </button>

                  <button
                    className="ap-card-icon-button"
                    title="Edit accessory"
                    onClick={() => startEdit(item)}
                  >
                    <Edit3 size={17} />
                  </button>

                  <button
                    className="ap-card-icon-button danger"
                    title="Delete accessory"
                    onClick={() => del(item)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {shown.length === 0 && <div className="empty big">No accessories found.</div>}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit accessory' : 'Add accessory'}
        wide
      >
        <form className="form-grid" onSubmit={save}>
          <label>
            Category
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>

          <label>
            Company / Brand
            <input
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="Apple, Samsung, UGREEN..."
            />
          </label>

          <label>
            Quality
            <select
              value={form.quality}
              onChange={(e) => setForm({ ...form, quality: e.target.value })}
            >
              <option value="ORIGINAL">Original</option>
              <option value="HIGH_COPY">High Copy</option>
            </select>
          </label>

          <label>
            Item name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="20W USB-C Power Adapter"
            />
          </label>

          <label>
            Quantity
            <input
              type="number"
              min="0"
              required
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </label>

          <label>
            Low-stock warning at
            <input
              type="number"
              min="0"
              value={form.low_stock_threshold}
              onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
            />
          </label>

          <label>
            Cost price (Rs)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
            />
          </label>

          <label>
            Selling price (Rs)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.selling_price}
              onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
            />
          </label>

          <label>
            Final selling price (Rs)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.final_selling_price}
              onChange={(e) => setForm({ ...form, final_selling_price: e.target.value })}
            />
          </label>

          <label>
            Photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />
          </label>

          <label className="span-2">
            Note (optional)
            <textarea
              rows="3"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </label>

          <div className="modal-actions span-2">
            <button type="button" className="ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="primary" disabled={busy}>
              {busy ? 'Saving...' : 'Save accessory'}
            </button>
          </div>
        </form>
      </Modal>

      {sellItem && (
        <div className="ap-sell-backdrop" onMouseDown={() => !sellBusy && setSellItem(null)}>
          <form className="ap-sell-modal" onSubmit={confirmSell} onMouseDown={(e) => e.stopPropagation()}>
            <div className="ap-sell-modal-head">
              <div>
                <span>Record sale</span>
                <h3>{sellItem.name}</h3>
              </div>
              <button type="button" onClick={() => setSellItem(null)} aria-label="Close">
                <X size={19} />
              </button>
            </div>

            <div className="ap-sell-stock-line">
              <Package size={16} />
              <span>Available stock</span>
              <strong>{sellItem.quantity} unit(s)</strong>
            </div>

            <label className="ap-sell-field">
              Quantity sold
              <input
                autoFocus
                type="number"
                min="1"
                max={sellItem.quantity}
                value={sellQuantity}
                onChange={(e) => setSellQuantity(e.target.value)}
              />
            </label>

            <label className="ap-sell-field">
              Final unit selling price (Rs)
              <div className="ap-price-input">
                <BadgeDollarSign size={17} />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                />
              </div>
            </label>

            <div className="ap-sell-total">
              <span>Total sale</span>
              <strong>{money(Number(sellQuantity || 0) * Number(sellPrice || 0))}</strong>
            </div>

            <div className="ap-sell-modal-actions">
              <button type="button" className="ghost" onClick={() => setSellItem(null)}>
                Cancel
              </button>
              <button className="ap-confirm-sale" disabled={sellBusy}>
                <ShoppingCart size={17} />
                {sellBusy ? 'Selling...' : 'Confirm sale'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
