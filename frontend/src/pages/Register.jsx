import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Mail } from 'lucide-react'
import { api } from '../api'
import AuthShell from '../components/AuthShell'
import PasswordField from '../components/PasswordField'

export default function Register(){
  const [f,setF]=useState({email:'',password:'',confirm:''})
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const nav=useNavigate()

  async function submit(e){
    e.preventDefault()
    if(f.password!==f.confirm){setError('Passwords do not match');return}
    setBusy(true);setError('')
    try{
      const r=await api('/api/auth/register',{method:'POST',body:JSON.stringify({email:f.email,password:f.password})})
      nav('/verify',{state:{email:f.email,resendAfter:r.resend_after_seconds||60}})
    }catch(e){setError(e.message)}finally{setBusy(false)}
  }

  return <AuthShell eyebrow="Create secure access" title="Create your account" subtitle="Register with your own email and password. ApplePoint will send a secure verification link to that email.">
    {error&&<div className="alert error">{error}</div>}
    <form className="form-stack auth-form" onSubmit={submit}>
      <label className="field-label"><span>Email address</span><div className="input-icon professional-input"><Mail size={17}/><input type="email" required autoComplete="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="name@example.com"/></div></label>
      <PasswordField label="Password" minLength={8} autoComplete="new-password" value={f.password} onChange={e=>setF({...f,password:e.target.value})} placeholder="Minimum 8 characters"/>
      <PasswordField label="Confirm password" minLength={8} autoComplete="new-password" value={f.confirm} onChange={e=>setF({...f,confirm:e.target.value})} placeholder="Re-enter your password"/>
      <button className="primary full auth-primary" disabled={busy}>{busy?'Creating account...':<>Create account <ArrowRight size={17}/></>}</button>
    </form>
    <p className="auth-bottom">Already registered? <Link to="/login">Sign in</Link></p>
  </AuthShell>
}
