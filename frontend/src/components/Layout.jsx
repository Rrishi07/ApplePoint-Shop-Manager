import React, { useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Boxes, LayoutDashboard, Menu, Store, Wrench, FileText, DatabaseBackup,
  LogOut, X, MoreVertical, ShieldCheck, Tags, ShoppingBag, Settings as SettingsIcon
} from 'lucide-react'
import { getToken, setToken } from '../api'
import '../dashboard-dark.css'

const nav = [
  ['/', LayoutDashboard, 'Overview'],
  ['/accessories', Tags, 'Accessories'],
  ['/repairs', Wrench, 'Repairs'],
  ['/sales', ShoppingBag, 'Sales'],
  ['/reports', FileText, 'Daily Report'],
  ['/inventory', Boxes, 'Inventory'],
  ['/backup', DatabaseBackup, 'Backup / Restore'],
  ['/settings', SettingsIcon, 'Settings'],
]

function getEmailFromToken() {
  try {
    const token = getToken()
    if (!token) return 'Verified account'
    const raw = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = raw + '='.repeat((4 - (raw.length % 4)) % 4)
    const payload = JSON.parse(atob(padded))
    return payload.email || 'Verified account'
  } catch { return 'Verified account' }
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const email = useMemo(getEmailFromToken, [])
  const logout = () => { setToken(null); navigate('/login') }

  return <div className="ap-shell">
    <aside className={`ap-sidebar ${open ? 'open' : ''}`}>
      <button className="ap-sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20}/></button>
      <div className="ap-brand"><div className="ap-brand-logo"><img src="/applepoint-logo.png" alt="ApplePoint"/></div><div><strong>Apple<span>Point</span></strong><small>Shop Manager</small></div></div>
      <nav className="ap-nav">{nav.map(([to,Icon,label])=><NavLink key={to} to={to} end={to==='/' } onClick={()=>setOpen(false)} className={({isActive})=>isActive?'active':''}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
      <div className="ap-sidebar-bottom">
        <div className="ap-shop-card"><div className="ap-shop-icon"><Store size={18}/></div><div><strong>ApplePoint Shop</strong><span>Kathmandu, Nepal</span></div><span className="ap-chevron">›</span></div>
        <div className="ap-admin-card"><div className="ap-avatar">A</div><div className="ap-admin-copy"><strong>Admin</strong><span>{email}</span></div><MoreVertical size={18}/></div>
        <div className="ap-secure-line"><ShieldCheck size={14}/> Firebase verified access</div>
        <button className="ap-signout" onClick={logout}><LogOut size={18}/>Sign out</button>
      </div>
    </aside>
    <main className="ap-main"><button className="ap-mobile-menu" onClick={()=>setOpen(true)} aria-label="Open menu"><Menu size={22}/></button><div className="ap-content"><Outlet/></div></main>
    {open&&<div className="ap-scrim" onClick={()=>setOpen(false)}/>} 
  </div>
}
