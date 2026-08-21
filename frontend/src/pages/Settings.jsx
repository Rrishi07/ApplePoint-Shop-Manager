import React, { useMemo, useState } from 'react'
import { KeyRound, ShieldCheck, UserRound } from 'lucide-react'
import { api, getToken } from '../api'
import PasswordField from '../components/PasswordField'

function getEmail() {
  try {
    const raw = getToken().split('.')[1].replace(/-/g,'+').replace(/_/g,'/')
    const padded = raw + '='.repeat((4 - raw.length % 4) % 4)
    return JSON.parse(atob(padded)).email || ''
  } catch { return '' }
}

export default function Settings() {
  const email = useMemo(getEmail, [])
  const [form, setForm] = useState({current_password:'',new_password:'',confirm_password:''})
  const [err,setErr] = useState('')
  const [msg,setMsg] = useState('')
  const [busy,setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault(); setErr(''); setMsg('')
    if (form.new_password !== form.confirm_password) return setErr('New password and confirm password do not match.')
    if (form.current_password === form.new_password) return setErr('Choose a new password different from your current password.')
    setBusy(true)
    try {
      const r = await api('/api/auth/change-password',{method:'POST',body:JSON.stringify({current_password:form.current_password,new_password:form.new_password})})
      setMsg(r.message)
      setForm({current_password:'',new_password:'',confirm_password:''})
    } catch(e) { setErr(e.message) } finally { setBusy(false) }
  }

  return <>
    <div className="page-head"><div><h2>Settings</h2><p>Manage your ApplePoint account and security.</p></div></div>
    {err&&<div className="alert error">{err}</div>}
    {msg&&<div className="alert success">{msg}</div>}
    <div className="ap-settings-grid">
      <section className="ap-settings-card">
        <div className="ap-settings-title"><span className="ap-page-stat-icon purple"><UserRound size={19}/></span><div><h3>Account</h3><p>Your verified ApplePoint login.</p></div></div>
        <div className="ap-account-row"><span>Email</span><strong>{email || 'Verified account'}</strong></div>
        <div className="ap-account-row"><span>Status</span><strong className="ap-verified"><ShieldCheck size={15}/> Verified</strong></div>
      </section>
      <section className="ap-settings-card">
        <div className="ap-settings-title"><span className="ap-page-stat-icon blue"><KeyRound size={19}/></span><div><h3>Change password</h3><p>Confirm your current password before setting a new one.</p></div></div>
        <form className="form-stack ap-settings-form" onSubmit={submit}>
          <PasswordField label="Current password" value={form.current_password} onChange={e=>setForm({...form,current_password:e.target.value})} autoComplete="current-password" />
          <PasswordField label="New password" value={form.new_password} onChange={e=>setForm({...form,new_password:e.target.value})} minLength={8} autoComplete="new-password" />
          <PasswordField label="Confirm new password" value={form.confirm_password} onChange={e=>setForm({...form,confirm_password:e.target.value})} minLength={8} autoComplete="new-password" />
          <button className="primary ap-save-password" disabled={busy}>{busy?'Changing password...':'Change password'}</button>
        </form>
      </section>
    </div>
  </>
}
