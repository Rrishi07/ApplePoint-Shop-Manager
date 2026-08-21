import React,{useState} from 'react'
import {Link} from 'react-router-dom'
import {ArrowRight, CheckCircle2, Mail} from 'lucide-react'
import {api} from '../api'
import AuthShell from '../components/AuthShell'

export default function ForgotPassword(){
  const [email,setEmail]=useState('')
  const [msg,setMsg]=useState('')
  const [err,setErr]=useState('')
  const [busy,setBusy]=useState(false)

  async function send(e){
    e.preventDefault();setErr('');setMsg('');setBusy(true)
    try{
      const r=await api('/api/auth/forgot-password',{method:'POST',body:JSON.stringify({email})})
      setMsg(r.message)
    }catch(e){setErr(e.message)}finally{setBusy(false)}
  }

  return <AuthShell eyebrow="Account recovery" title="Reset your password" subtitle="Enter your account email. Firebase will send a secure password-reset link directly to your inbox.">
    {err&&<div className="alert error">{err}</div>}
    {msg&&<div className="alert success"><CheckCircle2 size={16}/>{msg}</div>}
    <form className="form-stack auth-form" onSubmit={send}>
      <label className="field-label"><span>Email address</span><div className="input-icon professional-input"><Mail size={17}/><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"/></div></label>
      <button className="primary full auth-primary" disabled={busy}>{busy?'Sending reset link...':<>Send password reset link <ArrowRight size={17}/></>}</button>
    </form>
    <p className="auth-bottom"><Link to="/login">Back to sign in</Link></p>
  </AuthShell>
}
