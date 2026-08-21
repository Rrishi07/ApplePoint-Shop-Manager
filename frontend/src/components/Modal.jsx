import React from 'react'
import { X } from 'lucide-react'
export default function Modal({ open, title, children, onClose, wide=false }) {
  if (!open) return null
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className={`modal ${wide ? 'wide' : ''}`} onMouseDown={e => e.stopPropagation()}>
      <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={20}/></button></div>
      {children}
    </div>
  </div>
}
