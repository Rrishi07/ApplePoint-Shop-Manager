import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2, ExternalLink, Mail, RefreshCw } from 'lucide-react'
import { api } from '../api'
import AuthShell from '../components/AuthShell'
import PasswordField from '../components/PasswordField'

export default function Verify(){
  const loc=useLocation()
  const [email,setEmail]=useState(loc.state?.email||'')
  const [password,setPassword]=useState(loc.state?.password||'')
  const [msg,setMsg]=useState('')
  const [err,setErr]=useState('')
  const [busy,setBusy]=useState(false)
  const [seconds,setSeconds]=useState(loc.state?.resendAfter||60)

  useEffect(()=>{
    if(seconds<=0) return
    const id=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000)
    return ()=>clearInterval(id)
  },[seconds])

  async function resend(){
    if(!email||!password){setErr('Enter your email and password to resend the verification link.');return}
    setErr('');setMsg('');setBusy(true)
    try{
      const r=await api('/api/auth/resend-verification',{method:'POST',body:JSON.stringify({email,password})})
      setMsg(r.message); setSeconds(r.resend_after_seconds||60)
    }catch(e){setErr(e.message)}finally{setBusy(false)}
  }

  return <AuthShell eyebrow="Email verification" title="Check your inbox" subtitle={<>A secure verification link was sent to <strong>{email||'your email'}</strong>.</>}>
    {err&&<div className="alert error">{err}</div>}
    {msg&&<div className="alert success"><CheckCircle2 size={16}/>{msg}</div>}

    <div className="verification-link-card">
      <div className="verification-link-icon"><Mail size={24}/></div>
      <div>
        <strong>Open the ApplePoint email</strong>
        <p>Click <b>Verify Email</b> in the message. After Firebase confirms your email, return here and sign in.</p>
      </div>
    </div>

    <div className="form-stack auth-form">
      <label className="field-label"><span>Email address</span><div className="input-icon professional-input"><Mail size={17}/><input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div></label>
      <PasswordField label="Password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your account password"/>
      <button type="button" className="ghost full" disabled={busy||seconds>0} onClick={resend}><RefreshCw size={15}/>{busy?'Sending...':seconds>0?`Resend available in ${seconds}s`:'Resend verification email'}</button>
      <Link className="primary full auth-primary verify-signin-link" to="/login">I verified my email — Sign in <ExternalLink size={16}/></Link>
    </div>

    <p className="auth-bottom">Wrong email? <Link to="/register">Create another account</Link></p>
  </AuthShell>
}
