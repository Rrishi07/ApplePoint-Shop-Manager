import React, { useState } from 'react'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'

export default function PasswordField({ label='Password', value, onChange, placeholder='Enter your password', minLength, required=true, autoComplete='current-password' }) {
  const [show, setShow] = useState(false)
  return (
    <label className="field-label">
      <span>{label}</span>
      <div className="input-icon professional-input">
        <LockKeyhole size={17}/>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minLength={minLength}
          required={required}
          autoComplete={autoComplete}
        />
        <button className="password-toggle" type="button" onClick={() => setShow(v => !v)} aria-label={show ? 'Hide password' : 'Show password'} title={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOff size={17}/> : <Eye size={17}/>}<span>{show ? 'Hide' : 'Show'}</span>
        </button>
      </div>
    </label>
  )
}
