import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Mail } from 'lucide-react'
import { api, setToken } from '../api'
import AuthShell from '../components/AuthShell'
import PasswordField from '../components/PasswordField'

export default function Login(){
  const [form,setForm]=useState({email:'',password:''})
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const nav=useNavigate()

  async function submit(e){
    e.preventDefault(); setBusy(true); setError('')
    try{
      const r=await api('/api/auth/login',{method:'POST',body:JSON.stringify(form)})
      setToken(r.access_token); nav('/')
    }catch(e){setError(e.message)}finally{setBusy(false)}
  }

  return <AuthShell title="Welcome back" subtitle="Sign in to your ApplePoint workspace.">
    {error&&<div className="alert error">{error}</div>}
    <form onSubmit={submit} className="form-stack auth-form">
      <label className="field-label"><span>Email address</span><div className="input-icon professional-input"><Mail size={17}/><input type="email" required autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="name@example.com"/></div></label>
      <PasswordField value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
      <div className="auth-links"><Link to="/forgot-password">Forgot password?</Link></div>
      <button className="primary full auth-primary" disabled={busy}>{busy?'Signing in...':<>Sign in <ArrowRight size={17}/></>}</button>
    </form>
    <p className="auth-bottom">New to ApplePoint? <Link to="/register">Create a verified account</Link></p>
  </AuthShell>
}
